//! Application and System Launcher
//! Launches executables, URLs, shell commands, and handles power actions.

use std::process::Command;

#[cfg(windows)]
use windows::core::{HSTRING, PCWSTR};
#[cfg(windows)]
use windows::Win32::UI::Shell::ShellExecuteW;
#[cfg(windows)]
use windows::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL;

pub fn launch_app(target: &str) -> Result<(), String> {
    #[cfg(windows)]
    unsafe {
        let op = HSTRING::from("open");
        let file = HSTRING::from(target);
        let res = ShellExecuteW(
            None,
            PCWSTR(op.as_ptr()),
            PCWSTR(file.as_ptr()),
            PCWSTR(std::ptr::null()),
            PCWSTR(std::ptr::null()),
            SW_SHOWNORMAL,
        );
        if res.0 as usize <= 32 {
            // Fallback to cmd start
            let _ = Command::new("cmd")
                .args(["/C", "start", "", target])
                .spawn()
                .map_err(|e| e.to_string())?;
        }
        return Ok(());
    }

    #[cfg(not(windows))]
    {
        let _ = target;
        Ok(())
    }
}

pub fn launch_as_admin(target: &str) -> Result<(), String> {
    #[cfg(windows)]
    unsafe {
        let op = HSTRING::from("runas");
        let file = HSTRING::from(target);
        ShellExecuteW(
            None,
            PCWSTR(op.as_ptr()),
            PCWSTR(file.as_ptr()),
            PCWSTR(std::ptr::null()),
            PCWSTR(std::ptr::null()),
            SW_SHOWNORMAL,
        );
        Ok(())
    }

    #[cfg(not(windows))]
    {
        let _ = target;
        Ok(())
    }
}

pub fn execute_power_action(action: &str) {
    #[cfg(windows)]
    {
        match action {
            "sleep" => {
                let _ = Command::new("rundll32.exe")
                    .args(["powrprof.dll,SetSuspendState", "0,1,0"])
                    .spawn();
            }
            "restart" => {
                let _ = Command::new("shutdown")
                    .args(["/r", "/t", "0"])
                    .spawn();
            }
            "shutdown" => {
                let _ = Command::new("shutdown")
                    .args(["/s", "/t", "0"])
                    .spawn();
            }
            "lock" => {
                let _ = Command::new("rundll32.exe")
                    .args(["user32.dll,LockWorkStation"])
                    .spawn();
            }
            "signout" => {
                let _ = Command::new("shutdown")
                    .args(["/l"])
                    .spawn();
            }
            _ => eprintln!("[Launcher] Unknown power action: {}", action),
        }
    }
}
