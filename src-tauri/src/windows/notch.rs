//! Notch Window Management
//! Places the interactive status island at the top center of the primary display.

use tauri::WebviewWindow;

#[cfg(windows)]
use windows::Win32::UI::WindowsAndMessaging::{GetSystemMetrics, SM_CXSCREEN};

pub const NOTCH_IDLE_WIDTH: f64 = 116.0;
pub const NOTCH_IDLE_HEIGHT: f64 = 36.0;

pub fn setup_notch_window(window: &WebviewWindow) {
    let _ = window.set_always_on_top(true);
    let _ = window.set_shadow(false);

    reposition_notch(window, NOTCH_IDLE_WIDTH, NOTCH_IDLE_HEIGHT);
    let _ = window.show();
}

pub fn reposition_notch(window: &WebviewWindow, width: f64, height: f64) {
    #[cfg(windows)]
    unsafe {
        let screen_w = GetSystemMetrics(SM_CXSCREEN) as f64;
        let x = ((screen_w - width) / 2.0).max(0.0);

        let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
            width: width as u32,
            height: height as u32,
        }));

        let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: x as i32,
            y: 0,
        }));
    }
}
