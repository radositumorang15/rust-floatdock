//! Notch Window Management
//! Places the interactive status island at the top center of the primary display.

use tauri::WebviewWindow;

#[cfg(windows)]
use super::{make_hwnd_transparent, strip_window_decorations};

pub const NOTCH_IDLE_WIDTH: f64 = 124.0;
pub const NOTCH_IDLE_HEIGHT: f64 = 36.0;

pub fn setup_notch_window(window: &WebviewWindow) {
    let _ = window.set_title("");
    let _ = window.set_decorations(false);
    let _ = window.set_always_on_top(true);
    let _ = window.set_shadow(false);

    #[cfg(windows)]
    {
        strip_window_decorations(window);
        make_hwnd_transparent(window);
    }

    reposition_notch(window, NOTCH_IDLE_WIDTH, NOTCH_IDLE_HEIGHT);
    let _ = window.show();
}

pub fn reposition_notch(window: &WebviewWindow, width: f64, height: f64) {
    if let Ok(Some(monitor)) = window.primary_monitor() {
        let scale = monitor.scale_factor();
        let screen_w = monitor.size().width as f64 / scale;
        let x = ((screen_w - width) / 2.0).max(0.0);

        let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize {
            width,
            height,
        }));

        let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition {
            x,
            y: 0.0,
        }));
    }
}
