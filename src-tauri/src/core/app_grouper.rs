//! Dynamic App Grouping, Chrome Profile Separator & Window Preview Collector

use serde::Serialize;
use std::collections::HashMap;

use windows::core::{BOOL, PWSTR};
#[cfg(windows)]
use windows::Win32::{
    Foundation::{CloseHandle, HWND, LPARAM},
    System::Threading::{
        OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_WIN32, PROCESS_QUERY_LIMITED_INFORMATION,
    },
    UI::WindowsAndMessaging::{
        EnumWindows, GetWindowLongPtrW, GetWindowTextW, GetWindowThreadProcessId,
        IsIconic, IsWindowVisible, GWL_EXSTYLE, WS_EX_TOOLWINDOW,
    },
};

#[derive(Clone, Serialize)]
pub struct WindowInstance {
    pub hwnd: isize,
    pub title: String,
    pub is_minimized: bool,
}

#[derive(Clone, Serialize)]
pub struct GroupedDockApp {
    pub group_id: String,              // Unik per profil Chrome / per aplikasi
    pub app_name: String,
    pub exec_path: Option<String>,
    pub icon_url: Option<String>,
    pub profile_badge: Option<String>, // Contoh: "Work", "Personal" pada Chrome / PWA badge
    pub is_pinned: bool,
    pub windows: Vec<WindowInstance>,
}

pub fn parse_chrome_profile(title: &str) -> Option<String> {
    if let Some(rest) = title.strip_suffix(" - Google Chrome") {
        if let Some(idx) = rest.rfind(" - ") {
            return Some(rest[idx + 3..].trim().to_string());
        }
    }
    None
}

pub fn resolve_correct_app_identity(pid: u32, title: &str, exe_path: Option<&str>) -> (String, String, Option<String>) {
    let lower_title = title.to_lowercase();
    let lower_path = exe_path.unwrap_or("").to_lowercase();

    if lower_title.contains("gemini") || lower_path.contains("gemini") {
        return ("gemini".to_string(), "Gemini".to_string(), Some("Gemini".to_string()));
    }
    if lower_title.contains("chatgpt") || lower_path.contains("chatgpt") {
        return ("chatgpt".to_string(), "ChatGPT".to_string(), Some("ChatGPT".to_string()));
    }
    if lower_title.contains("snipping tool") || lower_path.contains("snippingtool") {
        return ("snipping_tool".to_string(), "Snipping Tool".to_string(), None);
    }
    if lower_path.contains("chrome.exe") || lower_title.ends_with("- google chrome") {
        if let Some(prof) = super::window_tracker::extract_chrome_profile(pid, title) {
            return (format!("chrome.profile.{}", prof.to_lowercase()), format!("Chrome ({})", prof), Some(prof));
        }
        return ("chrome".to_string(), "Google Chrome".to_string(), None);
    }
    if lower_path.contains("windowsterminal.exe") || lower_path.contains("wt.exe") {
        return ("terminal".to_string(), "Windows Terminal".to_string(), None);
    }
    if lower_path.contains("code.exe") || lower_title.contains("visual studio code") {
        return ("vscode".to_string(), "Visual Studio Code".to_string(), None);
    }
    if lower_path.contains("antigravity ide.exe") || lower_title.contains("antigravity") {
        return ("antigravity".to_string(), "Antigravity IDE".to_string(), None);
    }

    let app_name = if let Some(path) = exe_path {
        std::path::Path::new(path)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or(title)
            .to_string()
    } else {
        title.split(" - ").last().unwrap_or(title).trim().to_string()
    };

    let group_id = app_name.to_lowercase();
    (group_id, app_name, None)
}

#[cfg(windows)]
pub fn collect_grouped_windows() -> Vec<GroupedDockApp> {
    let mut map: HashMap<String, GroupedDockApp> = HashMap::new();

    unsafe extern "system" fn enum_proc(hwnd: HWND, lparam: LPARAM) -> BOOL {
        unsafe {
            if !IsWindowVisible(hwnd).as_bool() {
                return BOOL(1);
            }

            let ex_style = GetWindowLongPtrW(hwnd, GWL_EXSTYLE) as u32;
            if (ex_style & WS_EX_TOOLWINDOW.0) != 0 {
                return BOOL(1);
            }

            let mut buf = [0u16; 256];
            let len = GetWindowTextW(hwnd, &mut buf);
            if len == 0 {
                return BOOL(1);
            }

            let title = String::from_utf16_lossy(&buf[..len as usize]);
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

            let mut pid = 0;
            GetWindowThreadProcessId(hwnd, Some(&mut pid));

            let mut exec_path: Option<String> = None;
            if let Ok(process) = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid) {
                let mut path_buf = [0u16; 512];
                let mut size = path_buf.len() as u32;
                if QueryFullProcessImageNameW(process, PROCESS_NAME_WIN32, PWSTR(path_buf.as_mut_ptr()), &mut size).is_ok() {
                    exec_path = Some(String::from_utf16_lossy(&path_buf[..size as usize]));
                }
                let _ = CloseHandle(process);
            }

            let (group_id, app_name, profile_badge) =
                resolve_correct_app_identity(pid, title_trimmed, exec_path.as_deref());

            let icon_url = exec_path.as_deref().and_then(|p| {
                crate::core::icon_extractor::extract_icon_base64(p, 48)
            });

            let map = &mut *(lparam.0 as *mut HashMap<String, GroupedDockApp>);
            let entry = map.entry(group_id.clone()).or_insert_with(|| GroupedDockApp {
                group_id,
                app_name,
                exec_path: exec_path.clone(),
                icon_url,
                profile_badge,
                is_pinned: false,
                windows: Vec::new(),
            });

            entry.windows.push(WindowInstance {
                hwnd: hwnd.0 as isize,
                title: title_trimmed.to_string(),
                is_minimized: IsIconic(hwnd).as_bool(),
            });

            BOOL(1)
        }
    }

    unsafe {
        let ptr = &mut map as *mut _ as isize;
        let _ = EnumWindows(Some(enum_proc), LPARAM(ptr));
    }

    map.into_values().collect()
}

#[cfg(not(windows))]
pub fn collect_grouped_windows() -> Vec<GroupedDockApp> {
    Vec::new()
}
