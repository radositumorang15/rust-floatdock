//! Windows Application Desktop Toolbar (AppBar) Integration
//! Handles reserving screen work area so maximized windows stop above the floating dock.

use std::sync::atomic::{AtomicBool, Ordering};

#[cfg(windows)]
use windows::Win32::Foundation::{HWND, LPARAM, RECT};
#[cfg(windows)]
use windows::Win32::UI::Shell::{
    SHAppBarMessage, APPBARDATA, ABM_NEW, ABM_REMOVE, ABM_SETPOS, ABE_BOTTOM,
};
#[cfg(windows)]
use windows::Win32::UI::WindowsAndMessaging::{
    GetSystemMetrics, SM_CXSCREEN, SM_CYSCREEN,
};

static APPBAR_REGISTERED: AtomicBool = AtomicBool::new(false);

/// Registers the dock as a Windows AppBar to reserve desktop space.
pub fn register_dock_appbar(hwnd: isize, dock_height: i32) -> bool {
    #[cfg(windows)]
    unsafe {
        let hwnd_val = HWND(hwnd as *mut _);
        let mut abd = APPBARDATA {
            cbSize: std::mem::size_of::<APPBARDATA>() as u32,
            hWnd: hwnd_val,
            uCallbackMessage: 0,
            uEdge: ABE_BOTTOM,
            rc: RECT::default(),
            lParam: LPARAM(0),
        };

        // 1. Register new AppBar
        let res = SHAppBarMessage(ABM_NEW, &mut abd);
        if res == 0 {
            eprintln!("[AppBar] Warning: ABM_NEW returned 0, might already be registered or unsupported.");
        }

        // 2. Query and set reserved edge & dimensions
        let screen_w = GetSystemMetrics(SM_CXSCREEN);
        let screen_h = GetSystemMetrics(SM_CYSCREEN);

        abd.rc = RECT {
            left: 0,
            top: screen_h - dock_height,
            right: screen_w,
            bottom: screen_h,
        };

        SHAppBarMessage(ABM_SETPOS, &mut abd);
        APPBAR_REGISTERED.store(true, Ordering::SeqCst);
        println!("[AppBar] Registered bottom AppBar with height {}", dock_height);
        return true;
    }

    #[cfg(not(windows))]
    {
        let _ = (hwnd, dock_height);
        false
    }
}

/// Unregisters the AppBar and restores standard desktop work area.
pub fn unregister_dock_appbar(hwnd: isize) {
    if !APPBAR_REGISTERED.load(Ordering::SeqCst) {
        return;
    }

    #[cfg(windows)]
    unsafe {
        let hwnd_val = HWND(hwnd as *mut _);
        let mut abd = APPBARDATA {
            cbSize: std::mem::size_of::<APPBARDATA>() as u32,
            hWnd: hwnd_val,
            uCallbackMessage: 0,
            uEdge: ABE_BOTTOM,
            rc: RECT::default(),
            lParam: LPARAM(0),
        };
        SHAppBarMessage(ABM_REMOVE, &mut abd);
        APPBAR_REGISTERED.store(false, Ordering::SeqCst);
        println!("[AppBar] Unregistered bottom AppBar.");
    }

    #[cfg(not(windows))]
    {
        let _ = hwnd;
    }
}
