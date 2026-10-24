//! Start Menu Window Management
//! Aligns above the Start button, manages open/close animations, and auto-hides on blur.

use tauri::{AppHandle, Manager, WebviewWindow};

#[cfg(windows)]
use windows::Win32::Foundation::HWND;
#[cfg(windows)]
use windows::Win32::Graphics::Dwm::DwmExtendFrameIntoClientArea;
#[cfg(windows)]
use windows::Win32::UI::Controls::MARGINS;
#[cfg(windows)]
use windows::Win32::UI::WindowsAndMessaging::{GetSystemMetrics, SM_CXSCREEN, SM_CYSCREEN};

use super::dock::{DOCK_BAR_HEIGHT, DOCK_BOTTOM_OFFSET};

pub const START_MENU_WIDTH: f64 = 390.0;
pub const START_MENU_HEIGHT: f64 = 480.0;
pub const GAP_ABOVE_DOCK: f64 = 10.0;

pub fn setup_start_menu_window(window: &WebviewWindow) {
    let _ = window.set_always_on_top(true);
    let _ = window.set_shadow(false);

    #[cfg(windows)]
    {
        make_hwnd_transparent(window);
    }

    reposition_start_menu(window);
}

#[cfg(windows)]
fn make_hwnd_transparent(window: &WebviewWindow) {
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

pub fn reposition_start_menu(window: &WebviewWindow) {
    #[cfg(windows)]
    unsafe {
        use windows::Win32::Foundation::RECT;
        use windows::Win32::UI::WindowsAndMessaging::{
            SystemParametersInfoW, SPI_GETWORKAREA, SYSTEM_PARAMETERS_INFO_UPDATE_FLAGS,
        };

        let mut work_area = RECT::default();
        let ok = SystemParametersInfoW(
            SPI_GETWORKAREA,
            0,
            Some(&mut work_area as *mut _ as *mut _),
            SYSTEM_PARAMETERS_INFO_UPDATE_FLAGS(0),
        );

        let screen_w = GetSystemMetrics(SM_CXSCREEN) as f64;
        let screen_h = GetSystemMetrics(SM_CYSCREEN) as f64;

        let work_bottom = if ok.is_ok() && work_area.bottom > 0 {
            work_area.bottom as f64
        } else {
            screen_h
        };

        // Start menu is positioned above the Start button on the left of the centered dock
        let estimated_dock_left = ((screen_w - 1000.0) / 2.0).max(16.0);
        let dock_top_y = work_bottom - DOCK_BOTTOM_OFFSET - DOCK_BAR_HEIGHT;
        let menu_x = estimated_dock_left;
        let menu_y = (dock_top_y - START_MENU_HEIGHT - GAP_ABOVE_DOCK).max(0.0);

        let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: menu_x as i32,
            y: menu_y as i32,
        }));
    }
}

pub fn toggle_start_menu(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("start_menu") {
        if let Ok(is_visible) = window.is_visible() {
            if is_visible {
                let _ = window.hide();
            } else {
                reposition_start_menu(&window);
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
    }
}
