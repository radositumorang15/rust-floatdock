// Prevents console window on Windows in both debug and release
#![windows_subsystem = "windows"]

fn main() {
    #[cfg(windows)]
    unsafe {
        use windows::Win32::Foundation::{GetLastError, ERROR_ALREADY_EXISTS};
        use windows::Win32::System::Threading::CreateMutexW;
        use windows::Win32::UI::WindowsAndMessaging::{MessageBoxW, MB_ICONINFORMATION, MB_OK, FindWindowW, SetForegroundWindow};
        use windows::core::w;
        use std::ffi::OsStr;
        use std::os::windows::ffi::OsStrExt;

        let _mutex = CreateMutexW(None, true, w!("Global\\FloatDock_SingleInstance_Mutex"));
        if GetLastError() == ERROR_ALREADY_EXISTS {
            if let Ok(hwnd) = FindWindowW(None, w!("Float Dock")) {
                let _ = SetForegroundWindow(hwnd);
            }
            let wide_msg: Vec<u16> = OsStr::new("Float Dock sudah berjalan di desktop Anda.")
                .encode_wide()
                .chain(std::iter::once(0))
                .collect();
            let wide_title: Vec<u16> = OsStr::new("Float Dock")
                .encode_wide()
                .chain(std::iter::once(0))
                .collect();
            let _ = MessageBoxW(
                None,
                windows::core::PCWSTR(wide_msg.as_ptr()),
                windows::core::PCWSTR(wide_title.as_ptr()),
                MB_ICONINFORMATION | MB_OK,
            );
            return;
        }
    }

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
