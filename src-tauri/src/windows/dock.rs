//! Dock Window Management
//! Handles bottom floating placement, screen metrics, dynamic width/height adjustment, and transparency.

use tauri::WebviewWindow;

#[cfg(windows)]
use super::{make_hwnd_transparent, strip_window_decorations};

pub const DOCK_DEFAULT_WIDTH: f64 = 760.0;
pub const DOCK_IDLE_HEIGHT: f64 = 76.0;
pub const DOCK_EXPANDED_HEIGHT: f64 = 220.0;
pub const DOCK_BAR_HEIGHT: f64 = 60.0;
pub const DOCK_BOTTOM_OFFSET: f64 = 14.0;

pub fn setup_dock_window(window: &WebviewWindow) {
    let _ = window.set_title("Float Dock");
    let _ = window.set_decorations(false);
    let _ = window.set_always_on_top(true);
    let _ = window.set_shadow(false);

    reposition_dock(window, DOCK_DEFAULT_WIDTH, DOCK_IDLE_HEIGHT);

    #[cfg(windows)]
    {
        strip_window_decorations(window);
        make_hwnd_transparent(window);
        crate::native_actions::set_no_activate(window);
    }

    let _ = window.show();
}

pub fn reposition_dock(window: &WebviewWindow, width: f64, height: f64) {
    let monitor = window
        .current_monitor()
        .ok()
        .flatten()
        .or_else(|| window.primary_monitor().ok().flatten());

    if let Some(monitor) = monitor {
        let scale = monitor.scale_factor();
        let mon_size = monitor.size();
        let screen_w = mon_size.width as f64 / scale;
        let screen_h = mon_size.height as f64 / scale;

        let win_w = width.min(screen_w - 16.0).max(200.0);
        let x = ((screen_w - win_w) / 2.0).max(0.0);
        let y = (screen_h - height).max(0.0);

        let px = (x * scale).round() as i32;
        let py = (y * scale).round() as i32;
        let pw = (win_w * scale).round() as i32;
        let ph = (height * scale).round() as i32;

        #[cfg(windows)]
        unsafe {
            use windows::Win32::UI::WindowsAndMessaging::{SetWindowPos, SWP_NOACTIVATE, SWP_NOZORDER};
            use windows::Win32::Foundation::HWND;
            if let Ok(hwnd) = window.hwnd() {
                let _ = SetWindowPos(
                    HWND(hwnd.0),
                    None,
                    px,
                    py,
                    pw,
                    ph,
                    SWP_NOZORDER | SWP_NOACTIVATE,
                );
                return;
            }
        }

        let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize {
            width: win_w,
            height,
        }));

        let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition {
            x,
            y,
        }));
    }
}
