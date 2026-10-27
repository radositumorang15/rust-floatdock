//! Settings Window Management
//! Controls display of the customization and preferences window.
//! Theme changes are broadcast via Tauri events so all windows stay in sync.

use tauri::{AppHandle, Manager, WebviewWindow};

#[cfg(windows)]
use super::{make_hwnd_transparent, strip_window_decorations};

pub fn setup_settings_window(window: &WebviewWindow) {
    let _ = window.set_title("");
    let _ = window.set_decorations(false);
    let _ = window.set_shadow(false);
    let _ = window.center();

    #[cfg(windows)]
    {
        strip_window_decorations(window);
        make_hwnd_transparent(window);
    }
}

pub fn toggle_settings_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("settings") {
        if let Ok(is_visible) = window.is_visible() {
            if is_visible {
                let _ = window.hide();
            } else {
                #[cfg(windows)]
                {
                    strip_window_decorations(&window);
                    make_hwnd_transparent(&window);
                    crate::core::taskbar::ensure_taskbar_hidden();
                }
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
    }
}
