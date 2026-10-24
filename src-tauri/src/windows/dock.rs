//! Dock Window Management
//! Handles bottom floating placement, screen metrics, and real transparency.

use tauri::WebviewWindow;

#[cfg(windows)]
use windows::Win32::Foundation::HWND;
#[cfg(windows)]
use windows::Win32::Graphics::Dwm::{
    DwmExtendFrameIntoClientArea, DwmSetWindowAttribute, DWMWA_USE_IMMERSIVE_DARK_MODE,
};
#[cfg(windows)]
use windows::Win32::UI::Controls::MARGINS;
#[cfg(windows)]
use windows::Win32::UI::WindowsAndMessaging::{GetSystemMetrics, SM_CXSCREEN, SM_CYSCREEN};

pub const DOCK_WINDOW_WIDTH: f64 = 1680.0;
pub const DOCK_WINDOW_HEIGHT: f64 = 100.0;
pub const DOCK_BAR_HEIGHT: f64 = 60.0;
pub const DOCK_BOTTOM_OFFSET: f64 = 14.0;

pub fn setup_dock_window(window: &WebviewWindow) {
    let _ = window.set_always_on_top(true);
    let _ = window.set_shadow(false);

    #[cfg(windows)]
    {
        make_hwnd_transparent(window);
        if let Ok(hwnd) = window.hwnd() {
            crate::core::appbar::register_dock_appbar(hwnd.0 as isize, 84);
        }
    }

    reposition_dock(window);
    let _ = window.show();
}

/// Extend DWM frame into the entire client area so the webview's CSS
/// `background: transparent` is honoured at the OS level.
/// This eliminates any opaque rectangular background outside rounded CSS corners.
#[cfg(windows)]
fn make_hwnd_transparent(window: &WebviewWindow) {
    if let Ok(hwnd) = window.hwnd() {
        let hwnd = HWND(hwnd.0);
        unsafe {
            let dark: i32 = 1;
            let _ = DwmSetWindowAttribute(
                hwnd,
                DWMWA_USE_IMMERSIVE_DARK_MODE,
                &dark as *const _ as _,
                std::mem::size_of::<i32>() as u32,
            );

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

pub fn reposition_dock(window: &WebviewWindow) {
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

        let win_w = DOCK_WINDOW_WIDTH.min(screen_w - 16.0);
        let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize {
            width: win_w,
            height: DOCK_WINDOW_HEIGHT,
        }));

        // Center horizontally
        let x = ((screen_w - win_w) / 2.0).max(0.0);

        // Position vertically: the dock bar (68px) is centered inside the 100px window (16px top, 16px bottom).
        // We want the bottom of the visible dock bar to sit DOCK_BOTTOM_OFFSET (14px) above the work area bottom (or taskbar).
        // Since the window has (100 - 68)/2 = 16px transparent padding at the bottom:
        // window_bottom = work_bottom - DOCK_BOTTOM_OFFSET + 16px
        // window_y = window_bottom - DOCK_WINDOW_HEIGHT
        let pad_bottom = (DOCK_WINDOW_HEIGHT - DOCK_BAR_HEIGHT) / 2.0;
        let y = (work_bottom - DOCK_BOTTOM_OFFSET + pad_bottom - DOCK_WINDOW_HEIGHT).max(0.0);

        let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: x as i32,
            y: y as i32,
        }));
    }
}
