#![windows_subsystem = "windows"]
//! Float Dock Watchdog
//! Monitors the main float-dock process. If float-dock terminates or crashes,
//! this watchdog ensures that Windows taskbar (Shell_TrayWnd) is restored and made visible again.

use std::env;
use std::thread;
use std::time::Duration;

#[cfg(windows)]
use windows::core::w;
#[cfg(windows)]
use windows::Win32::Foundation::HWND;
#[cfg(windows)]
use windows::Win32::UI::WindowsAndMessaging::{
    FindWindowW, ShowWindow, SW_SHOW,
};

#[cfg(windows)]
fn restore_taskbar() {
    unsafe {
        let tray_hwnd = FindWindowW(w!("Shell_TrayWnd"), None);
        if let Ok(hwnd) = tray_hwnd {
            if hwnd != HWND(std::ptr::null_mut()) {
                let _ = ShowWindow(hwnd, SW_SHOW);
            }
        }
        let secondary = FindWindowW(w!("Shell_SecondaryTrayWnd"), None);
        if let Ok(hwnd) = secondary {
            if hwnd != HWND(std::ptr::null_mut()) {
                let _ = ShowWindow(hwnd, SW_SHOW);
            }
        }
    }
}

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        eprintln!("Usage: watchdog <main-process-pid>");
        return;
    }

    let target_pid: u32 = match args[1].parse() {
        Ok(pid) => pid,
        Err(_) => {
            eprintln!("Invalid PID argument");
            return;
        }
    };

    println!("[Watchdog] Monitoring float-dock PID {}", target_pid);

    #[cfg(windows)]
    {
        use windows::Win32::System::Threading::{
            OpenProcess, WaitForSingleObject, PROCESS_SYNCHRONIZE, INFINITE,
        };

        unsafe {
            if let Ok(process_handle) = OpenProcess(PROCESS_SYNCHRONIZE, false, target_pid) {
                if !process_handle.is_invalid() {
                    // Wait until main float-dock process terminates
                    let _ = WaitForSingleObject(process_handle, INFINITE);
                }
            }
        }

        // Small pause to let any exit handlers finish
        thread::sleep(Duration::from_millis(200));

        println!("[Watchdog] Main process terminated. Restoring Windows taskbar...");
        restore_taskbar();
    }
}
