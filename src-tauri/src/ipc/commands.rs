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
use crate::services::media::{get_media_state, MediaState};
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
        media: get_media_state().await,
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
pub fn toggle_timer(app: AppHandle) -> TimerState {
    use tauri::Emitter;
    let state = core_toggle_timer();
    let _ = app.emit("timer-tick", &state);
    state
}

#[tauri::command]
pub fn reset_timer(app: AppHandle) -> TimerState {
    use tauri::Emitter;
    let state = core_reset_timer();
    let _ = app.emit("timer-tick", &state);
    state
}

#[tauri::command]
pub fn set_timer_config(app: AppHandle, label: String, duration_seconds: u32) -> TimerState {
    use tauri::Emitter;
    let state = core_set_timer(label, duration_seconds);
    let _ = app.emit("timer-tick", &state);
    state
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
pub fn resize_dock(app: AppHandle, _expanded: bool, hidden: bool) {
    if let Some(window) = app.get_webview_window("dock") {
        let _ = window.set_ignore_cursor_events(hidden);
    }
}

#[tauri::command]
pub async fn toggle_media_playback() -> MediaState {
    crate::services::media::toggle_playback().await
}

#[tauri::command]
pub async fn media_skip_next() {
    crate::services::media::skip_next().await;
}

#[tauri::command]
pub async fn media_skip_previous() {
    crate::services::media::skip_previous().await;
}

#[derive(Serialize)]
pub struct ChromeProfileEntry {
    pub dir: String,
    pub name: String,
}

#[tauri::command]
pub fn get_available_chrome_profiles() -> Vec<ChromeProfileEntry> {
    let map = crate::core::window_tracker::get_chrome_profile_map();
    let mut list = Vec::new();
    for (dir, name) in map {
        list.push(ChromeProfileEntry { dir, name });
    }
    list.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    list
}

#[tauri::command]
pub fn launch_chrome_profile(dir: String) {
    let _ = std::process::Command::new("cmd")
        .args(["/C", "start", "chrome.exe", &format!("--profile-directory={}", dir)])
        .spawn();
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

#[tauri::command]
pub fn execute_omnibox_command(cmd: String) -> Result<String, String> {
    use std::process::Command;
    let trimmed = cmd.trim().trim_start_matches('>').trim();

    if trimmed.eq_ignore_ascii_case("ip") {
        let output = Command::new("cmd")
            .args(["/C", "ipconfig | findstr /i \"IPv4\""])
            .output()
            .map_err(|e| e.to_string())?;
        let res = String::from_utf8_lossy(&output.stdout).trim().to_string();
        return Ok(if res.is_empty() { "IP tidak ditemukan".into() } else { res });
    }

    if let Some(target_host) = trimmed.strip_prefix("ping ") {
        let host = target_host.trim();
        let output = Command::new("ping")
            .args(["-n", "1", host])
            .output()
            .map_err(|e| e.to_string())?;
        let res = String::from_utf8_lossy(&output.stdout);
        if res.contains("Average =") || res.contains("time=") || res.contains("waktu=") {
            return Ok(format!("Ping {} berhasil (Online)", host));
        } else {
            return Ok(format!("Ping {} gagal atau timeout", host));
        }
    }

    if let Some(proc_name) = trimmed.strip_prefix("kill ") {
        let target = if proc_name.ends_with(".exe") {
            proc_name.to_string()
        } else {
            format!("{}.exe", proc_name.trim())
        };
        let _ = Command::new("taskkill")
            .args(["/F", "/IM", &target])
            .output();
        return Ok(format!("Proses {} dihentikan", target));
    }

    if trimmed.eq_ignore_ascii_case("flushdns") {
        let _ = Command::new("ipconfig").arg("/flushdns").output();
        return Ok("DNS Cache berhasil dibersihkan".into());
    }

    if trimmed.eq_ignore_ascii_case("lock") {
        let _ = Command::new("rundll32.exe").args(["user32.dll,LockWorkStation"]).spawn();
        return Ok("Mengunci Windows...".into());
    }

    if trimmed.eq_ignore_ascii_case("emptybin") {
        let _ = Command::new("powershell")
            .args(["-NoProfile", "-Command", "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"])
            .output();
        return Ok("Recycle Bin berhasil dikosongkan".into());
    }

    if trimmed.eq_ignore_ascii_case("wt") || trimmed.eq_ignore_ascii_case("terminal") {
        let _ = Command::new("wt.exe").spawn();
        return Ok("Membuka Terminal...".into());
    }

    if trimmed.eq_ignore_ascii_case("cmd") {
        let _ = Command::new("cmd.exe").spawn();
        return Ok("Membuka Command Prompt...".into());
    }

    if trimmed.eq_ignore_ascii_case("calc") {
        let _ = Command::new("calc.exe").spawn();
        return Ok("Membuka Kalkulator...".into());
    }

    if trimmed.eq_ignore_ascii_case("code") {
        let _ = Command::new("cmd").args(["/C", "code ."]).spawn();
        return Ok("Membuka VS Code...".into());
    }

    Err("Gunakan: > ip, > ping <host>, > kill <app>, > flushdns, > lock, > emptybin, > wt, > calc, > code".into())
}

#[tauri::command]
pub fn open_quick_folder(folder_key: String) {
    use std::process::Command;
    if let Ok(profile) = std::env::var("USERPROFILE") {
        let target = match folder_key.to_lowercase().as_str() {
            "downloads" => format!("{}\\Downloads", profile),
            "documents" => format!("{}\\Documents", profile),
            "projects" => "D:\\flutterproject".to_string(),
            "pictures" => format!("{}\\Pictures", profile),
            "desktop" => format!("{}\\Desktop", profile),
            "c" | "c:" => "C:\\".to_string(),
            _ => profile,
        };
        let _ = Command::new("explorer.exe").arg(target).spawn();
    }
}

#[tauri::command]
pub fn open_shelf_file(path: String) -> Result<(), String> {
    use std::process::Command;
    Command::new("explorer.exe")
        .arg(&path)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn reveal_shelf_file(path: String) -> Result<(), String> {
    use std::process::Command;
    Command::new("explorer.exe")
        .args([&format!("/select,\"{}\"", path)])
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn optimize_system_memory() -> Result<String, String> {
    #[cfg(windows)]
    unsafe {
        use windows::Win32::System::Threading::{GetCurrentProcess, SetProcessWorkingSetSize};
        let _ = SetProcessWorkingSetSize(GetCurrentProcess(), usize::MAX, usize::MAX);
    }
    crate::core::icon_extractor::clear_icon_cache();
    Ok("Memori Grimoire & Float Dock berhasil dioptimalkan".into())
}

#[tauri::command]
pub fn get_grouped_dock_apps() -> Vec<crate::core::app_grouper::GroupedDockApp> {
    crate::core::app_grouper::collect_grouped_windows()
}

#[tauri::command]
pub fn get_native_app_icon(path: String, size: Option<i32>) -> Option<String> {
    crate::core::icon_extractor::extract_icon_base64(&path, size.unwrap_or(48))
}
