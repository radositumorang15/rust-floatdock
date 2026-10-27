//! Window Tracker for Running Applications
//! Enumerates open windows, tracks active foreground window, and provides window controls.

use serde::{Deserialize, Serialize};

#[cfg(windows)]
use windows::core::{BOOL, PWSTR};
#[cfg(windows)]
use windows::Win32::Foundation::{CloseHandle, HWND, LPARAM, WPARAM};
#[cfg(windows)]
use windows::Win32::Graphics::Dwm::{
    DwmGetWindowAttribute, DWMWA_CLOAKED,
};
#[cfg(windows)]
use windows::Win32::System::Threading::{
    OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_WIN32, PROCESS_QUERY_LIMITED_INFORMATION,
};
#[cfg(windows)]
use windows::Win32::UI::WindowsAndMessaging::{
    EnumWindows, GetForegroundWindow, GetWindowLongW, GetWindowTextW,
    GetWindowThreadProcessId, IsIconic, IsWindowVisible, PostMessageW,
    SetForegroundWindow, ShowWindow, GWL_EXSTYLE, SW_MINIMIZE, SW_RESTORE,
    WM_CLOSE, WS_EX_TOOLWINDOW,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackedWindow {
    pub hwnd: isize,
    pub title: String,
    pub process_id: u32,
    pub app_name: String,
    pub exec_path: Option<String>,
    pub icon_url: Option<String>,
    pub is_active: bool,
    pub is_minimized: bool,
    pub profile_name: Option<String>,
}

use std::collections::HashMap;
use std::sync::RwLock;

static CHROME_PROFILE_CACHE: once_cell::sync::Lazy<RwLock<(std::time::Instant, HashMap<String, String>)>> =
    once_cell::sync::Lazy::new(|| {
        RwLock::new((
            std::time::Instant::now() - std::time::Duration::from_secs(60),
            HashMap::new(),
        ))
    });

#[cfg(windows)]
#[repr(C)]
struct ProcessCommandLineInformationData {
    length: u16,
    maximum_length: u16,
    buffer: *mut u16,
}

#[cfg(windows)]
unsafe extern "system" {
    fn NtQueryInformationProcess(
        process_handle: windows::Win32::Foundation::HANDLE,
        process_information_class: u32,
        process_information: *mut std::ffi::c_void,
        process_information_length: u32,
        return_length: *mut u32,
    ) -> windows::Win32::Foundation::NTSTATUS;
}

#[cfg(windows)]
pub fn get_process_command_line(pid: u32) -> Option<String> {
    unsafe {
        let process = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid).ok()?;
        let mut return_len: u32 = 0;
        let _ = NtQueryInformationProcess(
            process,
            60, // ProcessCommandLineInformation
            std::ptr::null_mut(),
            0,
            &mut return_len,
        );

        if return_len == 0 {
            let _ = CloseHandle(process);
            return None;
        }

        let mut buffer: Vec<u8> = vec![0u8; return_len as usize];
        let status = NtQueryInformationProcess(
            process,
            60,
            buffer.as_mut_ptr() as *mut std::ffi::c_void,
            return_len,
            &mut return_len,
        );
        let _ = CloseHandle(process);

        if status.0 != 0 {
            return None;
        }

        let unicode_str = &*(buffer.as_ptr() as *const ProcessCommandLineInformationData);
        if unicode_str.buffer.is_null() || unicode_str.length == 0 {
            return None;
        }

        let len_u16 = (unicode_str.length / 2) as usize;
        let slice = std::slice::from_raw_parts(unicode_str.buffer, len_u16);
        Some(String::from_utf16_lossy(slice))
    }
}

#[cfg(not(windows))]
pub fn get_process_command_line(_pid: u32) -> Option<String> {
    None
}

pub fn get_chrome_profile_map() -> HashMap<String, String> {
    if let Ok(guard) = CHROME_PROFILE_CACHE.read() {
        if guard.0.elapsed() < std::time::Duration::from_secs(10) {
            return guard.1.clone();
        }
    }

    let mut map = HashMap::new();
    if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
        let local_state_path = std::path::Path::new(&local_app_data)
            .join("Google")
            .join("Chrome")
            .join("User Data")
            .join("Local State");
        if let Ok(contents) = std::fs::read_to_string(local_state_path) {
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&contents) {
                if let Some(info_cache) = val.get("profile").and_then(|p| p.get("info_cache")).and_then(|i| i.as_object()) {
                    for (dir, info) in info_cache {
                        if let Some(name) = info.get("name").and_then(|n| n.as_str()) {
                            map.insert(dir.clone(), name.to_string());
                        }
                    }
                }
            }
        }
    }

    if let Ok(mut guard) = CHROME_PROFILE_CACHE.write() {
        *guard = (std::time::Instant::now(), map.clone());
    }

    map
}

/// Extracts profile name from Chrome process command line or window title
pub fn extract_chrome_profile(pid: u32, window_title: &str) -> Option<String> {
    // 1. Try extracting from process command line: --profile-directory="..."
    if let Some(cmd) = get_process_command_line(pid) {
        if let Some(pos) = cmd.find("--profile-directory=") {
            let rest = &cmd[pos + "--profile-directory=".len()..];
            let dir_name = if let Some(stripped) = rest.strip_prefix('"') {
                stripped.split('"').next().unwrap_or("").trim()
            } else {
                rest.split_whitespace().next().unwrap_or("").trim()
            };

            if !dir_name.is_empty() {
                let map = get_chrome_profile_map();
                if let Some(friendly_name) = map.get(dir_name) {
                    return Some(friendly_name.clone());
                }
                return Some(dir_name.to_string());
            }
        }
    }

    // 2. Fallback to title suffix if formatted as "Tab - Profile - Google Chrome"
    let suffix = " - Google Chrome";
    if let Some(stripped) = window_title.strip_suffix(suffix) {
        if let Some(idx) = stripped.rfind(" - ") {
            let candidate = stripped[idx + 3..].trim();
            if !candidate.is_empty() && candidate.len() < 30 {
                return Some(candidate.to_string());
            }
        }
    }

    None
}

/// Extracts profile name from Chrome window title (e.g. "Tab - Person 1 - Google Chrome")
pub fn extract_chrome_profile_name(window_title: &str) -> Option<String> {
    extract_chrome_profile(0, window_title)
}

#[cfg(windows)]
unsafe extern "system" fn enum_window_callback(hwnd: HWND, lparam: LPARAM) -> BOOL {
    unsafe {
        let list = &mut *(lparam.0 as *mut Vec<TrackedWindow>);

        if !IsWindowVisible(hwnd).as_bool() {
            return BOOL(1);
        }

        // Exclude Tool Windows
        let ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE) as u32;
        if (ex_style & WS_EX_TOOLWINDOW.0) != 0 {
            return BOOL(1);
        }

        // Exclude Cloaked (e.g. hidden UWP background windows)
        let mut cloaked: u32 = 0;
        let _ = DwmGetWindowAttribute(
            hwnd,
            DWMWA_CLOAKED,
            &mut cloaked as *mut _ as *mut _,
            std::mem::size_of::<u32>() as u32,
        );
        if cloaked != 0 {
            return BOOL(1);
        }

        // Get Window Title
        let mut title_buf = [0u16; 512];
        let len = GetWindowTextW(hwnd, &mut title_buf);
        if len == 0 {
            return BOOL(1);
        }
        let title = String::from_utf16_lossy(&title_buf[..len as usize]);
        let title_trimmed = title.trim();
        if title_trimmed.is_empty()
            || title_trimmed == "Program Manager"
            || title_trimmed == "Float Dock"
            || title_trimmed == "Settings"
            || title_trimmed == "Start Menu"
            || title_trimmed == "Notch"
        {
            return BOOL(1);
        }

        // Get Process ID
        let mut pid: u32 = 0;
        GetWindowThreadProcessId(hwnd, Some(&mut pid));

        // Get Executable Path & App Name using PROCESS_QUERY_LIMITED_INFORMATION
        let mut app_name = String::new();
        let mut exec_path: Option<String> = None;

        if let Ok(process) = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid) {
            let mut path_buf = [0u16; 512];
            let mut size = path_buf.len() as u32;
            if QueryFullProcessImageNameW(process, PROCESS_NAME_WIN32, PWSTR(path_buf.as_mut_ptr()), &mut size).is_ok() {
                let full_path = String::from_utf16_lossy(&path_buf[..size as usize]);
                if let Some(file_name) = std::path::Path::new(&full_path).file_name().and_then(|s| s.to_str()) {
                    app_name = file_name.to_string();
                }
                exec_path = Some(full_path);
            }
            let _ = CloseHandle(process);
        }

        if app_name.is_empty() {
            app_name = title_trimmed.to_string();
        }

        // PWA & AI App Awareness (Gemini, ChatGPT, Snipping Tool)
        let lower_title = title_trimmed.to_lowercase();
        let lower_app = app_name.to_lowercase();

        let (resolved_name, profile_name) = if lower_title.contains("gemini") || lower_app.contains("gemini") {
            ("Gemini".to_string(), Some("Gemini".to_string()))
        } else if lower_title.contains("chatgpt") || lower_app.contains("chatgpt") {
            ("ChatGPT".to_string(), Some("ChatGPT".to_string()))
        } else if lower_title.contains("snipping tool") || lower_app.contains("snipping") {
            ("Snipping Tool".to_string(), None)
        } else if lower_app.contains("chrome") || lower_title.ends_with("- google chrome") {
            let profile = extract_chrome_profile(pid, &title_trimmed);
            let display_name = if let Some(ref prof) = profile {
                format!("Chrome ({})", prof)
            } else {
                "Google Chrome".to_string()
            };
            (display_name, profile)
        } else {
            (app_name.clone(), None)
        };

        // Extract native high-res icon if executable path is found
        let icon_url = exec_path.as_deref().and_then(|p| {
            crate::core::icon_extractor::extract_icon_base64(p, 48)
        });

        let foreground_hwnd = GetForegroundWindow();
        let is_active = hwnd == foreground_hwnd;
        let is_minimized = IsIconic(hwnd).as_bool();

        list.push(TrackedWindow {
            hwnd: hwnd.0 as isize,
            title: title_trimmed.to_string(),
            process_id: pid,
            app_name: resolved_name,
            exec_path,
            icon_url,
            is_active,
            is_minimized,
            profile_name,
        });

        BOOL(1)
    }
}

/// Retrieves list of all valid top-level desktop windows.
pub fn get_running_windows() -> Vec<TrackedWindow> {
    #[cfg(windows)]
    unsafe {
        let mut windows_list = Vec::new();
        let lparam = LPARAM(&mut windows_list as *mut _ as isize);
        let _ = EnumWindows(Some(enum_window_callback), lparam);
        windows_list
    }

    #[cfg(not(windows))]
    {
        Vec::new()
    }
}

/// Focuses or restores the specified window.
pub fn focus_window(hwnd: isize) {
    #[cfg(windows)]
    unsafe {
        let hwnd_val = HWND(hwnd as *mut _);
        if IsIconic(hwnd_val).as_bool() {
            let _ = ShowWindow(hwnd_val, SW_RESTORE);
        }
        let _ = SetForegroundWindow(hwnd_val);
    }
    #[cfg(not(windows))]
    let _ = hwnd;
}

/// Minimizes the specified window.
pub fn minimize_window(hwnd: isize) {
    #[cfg(windows)]
    unsafe {
        let hwnd_val = HWND(hwnd as *mut _);
        let _ = ShowWindow(hwnd_val, SW_MINIMIZE);
    }
    #[cfg(not(windows))]
    let _ = hwnd;
}

/// Closes the specified window gracefully.
pub fn close_window(hwnd: isize) {
    #[cfg(windows)]
    unsafe {
        let hwnd_val = HWND(hwnd as *mut _);
        let _ = PostMessageW(Some(hwnd_val), WM_CLOSE, WPARAM(0), LPARAM(0));
    }
    #[cfg(not(windows))]
    let _ = hwnd;
}
