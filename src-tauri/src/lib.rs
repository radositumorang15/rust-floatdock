pub mod core;
pub mod ipc;
pub mod services;
pub mod windows;

use std::time::Duration;
use tauri::{Emitter, Manager};

use crate::core::appbar::unregister_dock_appbar;
use crate::core::taskbar::{hide_taskbar, restore_taskbar, spawn_watchdog};
use crate::ipc::commands::*;
use crate::services::timer::tick_timer;
use crate::windows::dock::setup_dock_window;
use crate::windows::notch::setup_notch_window;
use crate::windows::settings::setup_settings_window;
use crate::windows::start_menu::setup_start_menu_window;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
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
            toggle_taskbar_visibility,
            broadcast_theme
        ])
        .setup(|app| {
            // Spawn watchdog process to guarantee taskbar restoration if process terminates
            spawn_watchdog();

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

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                if window.label() == "dock" {
                    #[cfg(windows)]
                    if let Ok(hwnd) = window.hwnd() {
                        unregister_dock_appbar(hwnd.0 as isize);
                    }
                    restore_taskbar();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running float dock application");
}
