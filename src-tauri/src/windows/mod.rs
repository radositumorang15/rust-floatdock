pub mod dock;
pub mod notch;
pub mod settings;
pub mod start_menu;

use tauri::WebviewWindow;

#[cfg(windows)]
use windows::Win32::Foundation::{HWND, LPARAM, LRESULT, WPARAM};
#[cfg(windows)]
use windows::Win32::Graphics::Dwm::{
    DwmSetWindowAttribute,
    DWMNCRP_DISABLED, DWMWA_BORDER_COLOR, DWMWA_NCRENDERING_POLICY,
    DWMWA_TRANSITIONS_FORCEDISABLED, DWMWA_WINDOW_CORNER_PREFERENCE,
    DWMWCP_DONOTROUND,
};
#[cfg(windows)]
use windows::Win32::UI::Shell::{DefSubclassProc, SetWindowSubclass};
#[cfg(windows)]
use windows::Win32::UI::WindowsAndMessaging::{
    GetWindowLongPtrW, SetWindowLongPtrW, SetWindowPos,
    GWL_EXSTYLE, GWL_STYLE,
    SWP_FRAMECHANGED, SWP_NOACTIVATE, SWP_NOMOVE, SWP_NOSIZE, SWP_NOZORDER,
    WS_BORDER, WS_CAPTION, WS_DLGFRAME, WS_EX_APPWINDOW, WS_EX_CLIENTEDGE,
    WS_EX_DLGMODALFRAME, WS_EX_STATICEDGE, WS_EX_TOOLWINDOW, WS_EX_WINDOWEDGE,
    WS_MAXIMIZEBOX, WS_MINIMIZEBOX, WS_POPUP, WS_SYSMENU, WS_THICKFRAME,
};

#[cfg(windows)]
unsafe extern "system" fn no_titlebar_subclass_proc(
    hwnd: HWND,
    msg: u32,
    wparam: WPARAM,
    lparam: LPARAM,
    _id: usize,
    _ref_data: usize,
) -> LRESULT {
    const WM_NCPAINT: u32 = 0x0085;
    const WM_NCACTIVATE: u32 = 0x0086;
    const WM_ERASEBKGND: u32 = 0x0014;

    match msg {
        WM_NCACTIVATE => {
            // Prevent Windows/DefWindowProc from drawing any caption bar when activated or deactivated
            return LRESULT(1);
        }
        WM_NCPAINT => {
            // Suppress non-client window frame painting
            return LRESULT(0);
        }
        WM_ERASEBKGND => {
            // Suppress background erase brush
            return LRESULT(1);
        }
        _ => {}
    }

    unsafe { DefSubclassProc(hwnd, msg, wparam, lparam) }
}

#[cfg(windows)]
pub fn strip_window_decorations(window: &WebviewWindow) {
    let _ = window.set_decorations(false);
    let _ = window.set_shadow(false);
    let _ = window.set_skip_taskbar(true);

    if let Ok(hwnd) = window.hwnd() {
        let hwnd = HWND(hwnd.0);
        unsafe {
            // 1. Install permanent subclass to kill all titlebar/caption paint events
            let _ = SetWindowSubclass(hwnd, Some(no_titlebar_subclass_proc), 1001, 0);

            // 2. Hapus semua style frame & titlebar, paksa WS_POPUP murni
            let mut style = GetWindowLongPtrW(hwnd, GWL_STYLE) as u32;
            let remove_style = WS_CAPTION.0
                | WS_THICKFRAME.0
                | WS_MINIMIZEBOX.0
                | WS_MAXIMIZEBOX.0
                | WS_SYSMENU.0
                | WS_BORDER.0
                | WS_DLGFRAME.0;
            style &= !remove_style;
            style |= WS_POPUP.0;
            SetWindowLongPtrW(hwnd, GWL_STYLE, style as isize);

            // 3. Hapus WS_EX_APPWINDOW dan paksa WS_EX_TOOLWINDOW
            let mut ex_style = GetWindowLongPtrW(hwnd, GWL_EXSTYLE) as u32;
            ex_style &= !(WS_EX_DLGMODALFRAME.0
                | WS_EX_CLIENTEDGE.0
                | WS_EX_STATICEDGE.0
                | WS_EX_WINDOWEDGE.0
                | WS_EX_APPWINDOW.0);
            ex_style |= WS_EX_TOOLWINDOW.0;
            SetWindowLongPtrW(hwnd, GWL_EXSTYLE, ex_style as isize);

            // 4. Matikan Non-Client Rendering & Border Windows 11
            let nc_policy = DWMNCRP_DISABLED.0 as u32;
            let _ = DwmSetWindowAttribute(
                hwnd,
                DWMWA_NCRENDERING_POLICY,
                &nc_policy as *const _ as *const _,
                std::mem::size_of::<u32>() as u32,
            );

            let corner_pref = DWMWCP_DONOTROUND.0 as u32;
            let _ = DwmSetWindowAttribute(
                hwnd,
                DWMWA_WINDOW_CORNER_PREFERENCE,
                &corner_pref as *const _ as *const _,
                std::mem::size_of::<u32>() as u32,
            );

            // 0xFFFFFFFE = DWMWA_COLOR_NONE (hilangkan outline 1px Windows 11)
            let border_none: u32 = 0xFFFFFFFE;
            let _ = DwmSetWindowAttribute(
                hwnd,
                DWMWA_BORDER_COLOR,
                &border_none as *const _ as *const _,
                std::mem::size_of::<u32>() as u32,
            );

            let disable_transitions: u32 = 1;
            let _ = DwmSetWindowAttribute(
                hwnd,
                DWMWA_TRANSITIONS_FORCEDISABLED,
                &disable_transitions as *const _ as *const _,
                std::mem::size_of::<u32>() as u32,
            );

            let _ = SetWindowPos(
                hwnd,
                None,
                0,
                0,
                0,
                0,
                SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE | SWP_FRAMECHANGED,
            );
        }
    }
}

#[cfg(windows)]
pub fn make_hwnd_transparent(_window: &WebviewWindow) {
    // Transparent background is handled directly by WebView2 with alpha 0.
    // DwmExtendFrameIntoClientArea is intentionally omitted to prevent DWM from painting a top titlebar frame.
}

#[cfg(not(windows))]
pub fn strip_window_decorations(_window: &WebviewWindow) {}

#[cfg(not(windows))]
pub fn make_hwnd_transparent(_window: &WebviewWindow) {}
