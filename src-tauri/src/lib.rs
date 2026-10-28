pub mod shell_shortcuts;
pub mod native_actions;
pub mod core;
pub mod ipc;
pub mod services;
pub mod windows;

use std::time::Duration;
use tauri::{Emitter, Manager};

use crate::core::taskbar::{hide_taskbar, restore_taskbar, spawn_watchdog};
use crate::ipc::commands::*;
use crate::services::timer::tick_timer;
use crate::windows::dock::setup_dock_window;
use crate::windows::notch::setup_notch_window;
use crate::windows::settings::setup_settings_window;
use crate::windows::start_menu::setup_start_menu_window;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Force WebView2 transparent background
    unsafe {
        std::env::set_var("WEBVIEW2_DEFAULT_BACKGROUND_COLOR", "0");
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_full_dock_state,
            get_running_apps,
            focus_window,
            minimize_window,
            close_window,
            launch_app,
            launch_as_admin,
            power_action,
            toggle_start_menu,
            toggle_settings,
            open_network_flyout,
            get_weather,
            get_timer_state,
            toggle_timer,
            reset_timer,
            set_timer_config,
            get_volume_state,
            set_volume,
            step_volume,
            toggle_volume_mute,
            get_indexed_apps,
            search_start_apps,
            toggle_media_playback,
            resize_notch,
            resize_dock,
            toggle_taskbar_visibility,
            broadcast_theme,
            execute_omnibox_command,
            open_quick_folder,
            get_grouped_dock_apps,
            get_native_app_icon,
            open_shelf_file,
            reveal_shelf_file,
            optimize_system_memory,
            media_skip_next,
            media_skip_previous,
            get_available_chrome_profiles,
            launch_chrome_profile,
            open_native_start,
            open_quick_settings,
            open_notification_center,
            toggle_window,
            activate_group
        ])
        .setup(|app| {
            // Spawn watchdog process to guarantee taskbar restoration if process terminates
            spawn_watchdog();
            crate::native_actions::start_event_hooks(app.handle().clone());

            // Hide default Windows taskbar so float dock takes its place cleanly
            hide_taskbar();

            // Setup Dock window
            if let Some(dock_win) = app.get_webview_window("dock") {
                setup_dock_window(&dock_win);
            }

            // Setup Start Menu window
            if let Some(start_win) = app.get_webview_window("start_menu") {
                setup_start_menu_window(&start_win);
            }

            // Setup Notch window
            if let Some(notch_win) = app.get_webview_window("notch") {
                setup_notch_window(&notch_win);
            }

            // Setup Settings window
            if let Some(settings_win) = app.get_webview_window("settings") {
                setup_settings_window(&settings_win);
            }

            // Spawn background timer tick loop (every 1 second)
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                loop {
                    tokio::time::sleep(Duration::from_secs(1)).await;
                    if let Some(timer_state) = tick_timer() {
                        let _ = app_handle.emit("timer-tick", timer_state);
                    }
                }
            });

            // Spawn background media update monitor (every 400ms)
            let media_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let mut last_state = crate::services::media::MediaState {
                    title: String::new(),
                    artist: String::new(),
                    is_playing: false,
                    has_media: false,
                };
                loop {
                    tokio::time::sleep(Duration::from_millis(400)).await;
                    let current = crate::services::media::get_media_state().await;
                    if current != last_state {
                        last_state = current.clone();
                        let _ = media_handle.emit("media-updated", current);
                    }
                }
            });

            // Spawn background telemetry & hardware audio monitor (every 80ms)
            let pulse_handle = app.handle().clone();
            let dock_hwnd_val = app
                .get_webview_window("dock")
                .and_then(|w| w.hwnd().ok())
                .map(|h| h.0 as isize)
                .unwrap_or(0);

            tauri::async_runtime::spawn(async move {
                loop {
                    tokio::time::sleep(Duration::from_millis(80)).await;
                    #[cfg(windows)]
                    {
                        crate::core::taskbar::ensure_taskbar_hidden();
                        let pulse = crate::services::telemetry::get_system_pulse(dock_hwnd_val);
                        let _ = pulse_handle.emit("system-pulse", pulse);

                        let hw = crate::services::hardware_audio::poll_hardware_and_audio();
                        let _ = pulse_handle.emit("hardware-audio", hw);
                    }
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                if window.label() == "dock" {
                    restore_taskbar();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running float dock application");
}
