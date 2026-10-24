//! Window Tracker for Running Applications
//! Enumerates open windows, tracks active foreground window, and provides window controls.

use serde::{Deserialize, Serialize};

#[cfg(windows)]
use windows::core::BOOL;
#[cfg(windows)]
use windows::Win32::Foundation::{HWND, LPARAM, WPARAM};
#[cfg(windows)]
use windows::Win32::Graphics::Dwm::{
    DwmGetWindowAttribute, DWMWA_CLOAKED,
};
#[cfg(windows)]
use windows::Win32::System::Threading::OpenProcess;
#[cfg(windows)]
use windows::Win32::System::ProcessStatus::GetModuleBaseNameW;
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
    pub is_active: bool,
    pub is_minimized: bool,
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

        // Get App Name from Process
        let mut app_name = String::new();
        if let Ok(process) = OpenProcess(
            windows::Win32::System::Threading::PROCESS_QUERY_INFORMATION
                | windows::Win32::System::Threading::PROCESS_VM_READ,
            false,
            pid,
        ) {
            let mut name_buf = [0u16; 256];
            let name_len = GetModuleBaseNameW(process, None, &mut name_buf);
            if name_len > 0 {
                app_name = String::from_utf16_lossy(&name_buf[..name_len as usize]);
            }
        }

        if app_name.is_empty() {
            app_name = title_trimmed.to_string();
        }

        let foreground_hwnd = GetForegroundWindow();
        let is_active = hwnd == foreground_hwnd;
        let is_minimized = IsIconic(hwnd).as_bool();

        list.push(TrackedWindow {
            hwnd: hwnd.0 as isize,
            title: title_trimmed.to_string(),
            process_id: pid,
            app_name,
            is_active,
            is_minimized,
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
