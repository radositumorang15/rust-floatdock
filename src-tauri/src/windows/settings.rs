//! Settings Window Management
//! Controls display of the customization and preferences window.
//! Theme changes are broadcast via Tauri events so all windows stay in sync.

use tauri::{AppHandle, Manager, WebviewWindow};

#[cfg(windows)]
use windows::Win32::Foundation::HWND;
#[cfg(windows)]
use windows::Win32::Graphics::Dwm::DwmExtendFrameIntoClientArea;
#[cfg(windows)]
use windows::Win32::UI::Controls::MARGINS;

pub fn setup_settings_window(window: &WebviewWindow) {
    let _ = window.center();

    #[cfg(windows)]
    {
        if let Ok(hwnd) = window.hwnd() {
            let hwnd = HWND(hwnd.0);
            unsafe {
                let margins = MARGINS {
                    cxLeftWidth: -1,
                    cxRightWidth: -1,
                    cyTopHeight: -1,
                    cyBottomHeight: -1,
                };
                let _ = DwmExtendFrameIntoClientArea(hwnd, &margins);
            }
        }
    }
}

pub fn toggle_settings_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("settings") {
        if let Ok(is_visible) = window.is_visible() {
            if is_visible {
                let _ = window.hide();
            } else {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
    }
}
