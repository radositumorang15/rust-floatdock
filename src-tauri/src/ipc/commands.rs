//! Frontend IPC Commands
//! Exposes backend systems, window operations, and services to WebView.

use serde::Serialize;
use tauri::{AppHandle, Manager};

use crate::core::taskbar::{hide_taskbar, restore_taskbar};
use crate::core::window_tracker::{
    close_window as core_close_window, focus_window as core_focus_window,
    get_running_windows, minimize_window as core_minimize_window, TrackedWindow,
};
use crate::services::apps_index::{get_all_indexed_apps, get_default_dock_apps, search_apps, AppEntry};
use crate::services::battery::{get_battery_info, BatteryInfo};
use crate::services::launcher::{execute_power_action, launch_app as core_launch_app, launch_as_admin as core_launch_admin};
use crate::services::media::{get_media_state, toggle_playback, MediaState};
use crate::services::network::{get_network_info, open_network_flyout as core_open_network, NetworkInfo};
use crate::services::timer::{
    get_timer, reset_timer as core_reset_timer, set_timer as core_set_timer,
    toggle_timer as core_toggle_timer, TimerState,
};
use crate::services::volume::{
    get_volume, set_volume as core_set_volume, step_volume as core_step_volume,
    toggle_mute as core_toggle_mute, VolumeInfo,
};
use crate::services::weather::{get_weather as core_get_weather, WeatherInfo};
use crate::windows::notch::reposition_notch;
use crate::windows::settings::toggle_settings_window;
use crate::windows::start_menu::toggle_start_menu as core_toggle_start_menu;

#[derive(Serialize)]
pub struct FullDockState {
    pub pinned_apps: Vec<AppEntry>,
    pub running_windows: Vec<TrackedWindow>,
    pub battery: BatteryInfo,
    pub volume: VolumeInfo,
    pub network: NetworkInfo,
    pub timer: TimerState,
    pub media: MediaState,
    pub weather: WeatherInfo,
}

#[tauri::command]
pub async fn get_full_dock_state() -> FullDockState {
    FullDockState {
        pinned_apps: get_default_dock_apps(),
        running_windows: get_running_windows(),
        battery: get_battery_info(),
        volume: get_volume(),
        network: get_network_info(),
        timer: get_timer(),
        media: get_media_state(),
        weather: core_get_weather(None, None).await,
    }
}

#[tauri::command]
pub fn get_running_apps() -> Vec<TrackedWindow> {
    get_running_windows()
}

#[tauri::command]
pub fn focus_window(hwnd: isize) {
    core_focus_window(hwnd);
}

#[tauri::command]
pub fn minimize_window(hwnd: isize) {
    core_minimize_window(hwnd);
}

#[tauri::command]
pub fn close_window(hwnd: isize) {
    core_close_window(hwnd);
}

#[tauri::command]
pub fn launch_app(target: String) -> Result<(), String> {
    core_launch_app(&target)
}

#[tauri::command]
pub fn launch_as_admin(target: String) -> Result<(), String> {
    core_launch_admin(&target)
}

#[tauri::command]
pub fn power_action(action: String) {
    execute_power_action(&action);
}

#[tauri::command]
pub fn toggle_start_menu(app: AppHandle) {
    core_toggle_start_menu(&app);
}

#[tauri::command]
pub fn toggle_settings(app: AppHandle) {
    toggle_settings_window(&app);
}

#[tauri::command]
pub fn open_network_flyout() {
    core_open_network();
}

#[tauri::command]
pub async fn get_weather(lat: Option<f64>, lon: Option<f64>) -> WeatherInfo {
    core_get_weather(lat, lon).await
}

#[tauri::command]
pub fn get_timer_state() -> TimerState {
    get_timer()
}

#[tauri::command]
pub fn toggle_timer() -> TimerState {
    core_toggle_timer()
}

#[tauri::command]
pub fn reset_timer() -> TimerState {
    core_reset_timer()
}

#[tauri::command]
pub fn set_timer_config(label: String, duration_seconds: u32) -> TimerState {
    core_set_timer(label, duration_seconds)
}

#[tauri::command]
pub fn get_volume_state() -> VolumeInfo {
    get_volume()
}

#[tauri::command]
pub fn set_volume(level: u8) -> VolumeInfo {
    core_set_volume(level)
}

#[tauri::command]
pub fn step_volume(delta: i8) -> VolumeInfo {
    core_step_volume(delta)
}

#[tauri::command]
pub fn toggle_volume_mute() -> VolumeInfo {
    core_toggle_mute()
}

#[tauri::command]
pub fn get_indexed_apps() -> Vec<AppEntry> {
    get_all_indexed_apps()
}

#[tauri::command]
pub fn search_start_apps(query: String) -> Vec<AppEntry> {
    search_apps(&query)
}

#[tauri::command]
pub fn resize_notch(app: AppHandle, width: f64, height: f64) {
    if let Some(window) = app.get_webview_window("notch") {
        reposition_notch(&window, width, height);
    }
}

#[tauri::command]
pub fn toggle_media_playback() -> MediaState {
    toggle_playback()
}

#[tauri::command]
pub fn toggle_taskbar_visibility(hide: bool) {
    if hide {
        hide_taskbar();
    } else {
        restore_taskbar();
    }
}

#[tauri::command]
pub fn broadcast_theme(app: AppHandle, theme: serde_json::Value) {
    use tauri::Emitter;
    let _ = app.emit("theme-changed", &theme);
    for label in &["dock", "start_menu", "notch", "settings"] {
        if let Some(w) = app.get_webview_window(label) {
            let _ = w.emit("theme-changed", &theme);
        }
    }
}
