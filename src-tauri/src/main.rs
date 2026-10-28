// Prevents console window on Windows in both debug and release
#![windows_subsystem = "windows"]

fn main() {
    // Force WebView2 to use 0 (fully transparent) default background color
    unsafe {
        std::env::set_var("WEBVIEW2_DEFAULT_BACKGROUND_COLOR", "0");
    }

    #[cfg(windows)]
    let _instance_mutex = unsafe {
        use windows::Win32::Foundation::{GetLastError, SetLastError, ERROR_ALREADY_EXISTS, WIN32_ERROR};
        use windows::Win32::System::Threading::CreateMutexW;
        use windows::Win32::UI::WindowsAndMessaging::{FindWindowW, SetForegroundWindow};
        use windows::core::w;

        SetLastError(WIN32_ERROR(0));
        let handle = CreateMutexW(None, true, w!("Local\\FloatDock_SingleInstance_Mutex"));
        if handle.is_ok() && GetLastError() == ERROR_ALREADY_EXISTS {
            if let Ok(hwnd) = FindWindowW(None, w!("Float Dock")) {
                let _ = SetForegroundWindow(hwnd);
            }
            return;
        }
        handle
    };

    std::panic::set_hook(Box::new(|info| {
        let msg = format!("Float Dock Panic:\n{}", info);
        let _ = std::fs::write("panic.log", &msg);
        if let Ok(exe) = std::env::current_exe() {
            if let Some(dir) = exe.parent() {
                let _ = std::fs::write(dir.join("panic.log"), &msg);
            }
        }
        #[cfg(windows)]
        unsafe {
            use windows::Win32::UI::WindowsAndMessaging::{MessageBoxW, MB_ICONERROR, MB_OK};
            use std::ffi::OsStr;
            use std::os::windows::ffi::OsStrExt;
            let wide_msg: Vec<u16> = OsStr::new(&msg).encode_wide().chain(std::iter::once(0)).collect();
            let wide_title: Vec<u16> = OsStr::new("Float Dock Error").encode_wide().chain(std::iter::once(0)).collect();
            let _ = MessageBoxW(
                None,
                windows::core::PCWSTR(wide_msg.as_ptr()),
                windows::core::PCWSTR(wide_title.as_ptr()),
                MB_ICONERROR | MB_OK,
            );
        }
    }));

    float_dock_lib::run()
}
