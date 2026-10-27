//! Windows Taskbar Hide/Restore and Watchdog Spawner
//! Manages Shell_TrayWnd visibility and ensures safety during crash or shutdown.

use std::process::Command;
use std::sync::atomic::{AtomicBool, Ordering};

#[cfg(windows)]
use windows::core::w;
#[cfg(windows)]
use windows::Win32::Foundation::HWND;
#[cfg(windows)]
use windows::Win32::UI::WindowsAndMessaging::{
    FindWindowW, IsWindowVisible, ShowWindow, SW_HIDE, SW_SHOW,
};

static TASKBAR_HIDDEN: AtomicBool = AtomicBool::new(false);

pub fn is_taskbar_hidden() -> bool {
    TASKBAR_HIDDEN.load(Ordering::SeqCst)
}

/// Hides the default Windows taskbar (primary and secondary monitors).
pub fn hide_taskbar() {
    #[cfg(windows)]
    unsafe {
        if let Ok(hwnd) = FindWindowW(w!("Shell_TrayWnd"), None) {
            if hwnd != HWND(std::ptr::null_mut()) {
                let _ = ShowWindow(hwnd, SW_HIDE);
            }
        }
        if let Ok(sec_hwnd) = FindWindowW(w!("Shell_SecondaryTrayWnd"), None) {
            if sec_hwnd != HWND(std::ptr::null_mut()) {
                let _ = ShowWindow(sec_hwnd, SW_HIDE);
            }
        }
        TASKBAR_HIDDEN.store(true, Ordering::SeqCst);
        println!("[Taskbar] Windows Taskbar hidden.");
    }
}

/// Continuously ensures the Windows taskbar stays hidden if TASKBAR_HIDDEN is true.
/// This prevents Windows 11 Explorer from restoring the taskbar when settings or other windows gain focus.
pub fn ensure_taskbar_hidden() {
    #[cfg(windows)]
    if is_taskbar_hidden() {
        unsafe {
            if let Ok(hwnd) = FindWindowW(w!("Shell_TrayWnd"), None) {
                if hwnd != HWND(std::ptr::null_mut()) && IsWindowVisible(hwnd).as_bool() {
                    let _ = ShowWindow(hwnd, SW_HIDE);
                }
            }
            if let Ok(sec_hwnd) = FindWindowW(w!("Shell_SecondaryTrayWnd"), None) {
                if sec_hwnd != HWND(std::ptr::null_mut()) && IsWindowVisible(sec_hwnd).as_bool() {
                    let _ = ShowWindow(sec_hwnd, SW_HIDE);
                }
            }
        }
    }
}

/// Restores the default Windows taskbar.
pub fn restore_taskbar() {
    #[cfg(windows)]
    unsafe {
        if let Ok(hwnd) = FindWindowW(w!("Shell_TrayWnd"), None) {
            if hwnd != HWND(std::ptr::null_mut()) {
                let _ = ShowWindow(hwnd, SW_SHOW);
            }
        }
        if let Ok(sec_hwnd) = FindWindowW(w!("Shell_SecondaryTrayWnd"), None) {
            if sec_hwnd != HWND(std::ptr::null_mut()) {
                let _ = ShowWindow(sec_hwnd, SW_SHOW);
            }
        }
        TASKBAR_HIDDEN.store(false, Ordering::SeqCst);
        println!("[Taskbar] Windows Taskbar restored.");
    }
}

/// Spawns the watchdog process to monitor this process.
/// If this process terminates unexpectedly, watchdog automatically calls restore_taskbar.
pub fn spawn_watchdog() {
    let current_pid = std::process::id();
    if let Ok(current_exe) = std::env::current_exe() {
        if let Some(exe_dir) = current_exe.parent() {
            let watchdog_path = exe_dir.join("watchdog.exe");
            if watchdog_path.exists() {
                #[cfg(windows)]
                {
                    use std::os::windows::process::CommandExt;
                    const CREATE_NO_WINDOW: u32 = 0x08000000;
                    let _ = Command::new(&watchdog_path)
                        .arg(current_pid.to_string())
                        .creation_flags(CREATE_NO_WINDOW)
                        .spawn();
                }
                #[cfg(not(windows))]
                {
                    let _ = Command::new(&watchdog_path)
                        .arg(current_pid.to_string())
                        .spawn();
                }
                println!("[Taskbar] Watchdog spawned silently at {:?}", watchdog_path);
                return;
            }
        }
    }
    println!("[Taskbar] Watchdog binary not found in current dir, continuing safely.");
}
