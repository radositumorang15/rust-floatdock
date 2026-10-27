//! Dock Window Management
//! Handles bottom floating placement, screen metrics, and real transparency.

use tauri::WebviewWindow;

#[cfg(windows)]
use super::{make_hwnd_transparent, strip_window_decorations};

pub const DOCK_WINDOW_WIDTH: f64 = 1680.0;
pub const DOCK_WINDOW_HEIGHT: f64 = 280.0;
pub const DOCK_BAR_HEIGHT: f64 = 60.0;
pub const DOCK_BOTTOM_OFFSET: f64 = 14.0;

pub fn setup_dock_window(window: &WebviewWindow) {
    let _ = window.set_title("Float Dock");
    let _ = window.set_decorations(false);
    let _ = window.set_always_on_top(true);
    let _ = window.set_shadow(false);

    reposition_dock(window);

    #[cfg(windows)]
    {
        strip_window_decorations(window);
        make_hwnd_transparent(window);
    }

    let _ = window.show();
}

pub fn reposition_dock(window: &WebviewWindow) {
    if let Ok(Some(monitor)) = window.primary_monitor() {
        let scale = monitor.scale_factor();
        let screen_w = monitor.size().width as f64 / scale;
        let screen_h = monitor.size().height as f64 / scale;

        let win_w = DOCK_WINDOW_WIDTH.min(screen_w - 16.0);
        let x = ((screen_w - win_w) / 2.0).max(0.0);
        let y = (screen_h - DOCK_WINDOW_HEIGHT).max(0.0);

        let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize {
            width: win_w,
            height: DOCK_WINDOW_HEIGHT,
        }));

        let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition {
            x,
            y,
        }));
    }
}
