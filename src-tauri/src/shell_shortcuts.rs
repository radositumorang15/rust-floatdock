//! Memicu UI shell Windows yang asli dengan mengirim shortcut keyboard yang sama
//! seperti yang ditekan pengguna ke Windows Explorer.
//!
//!   Start menu          -> Ctrl + Esc (0x11, 0x1B) atau Win (0x5B)
//!   Quick Settings      -> Win + A (0x5B, 0x41)  [Volume, Wi-Fi, Baterai]
//!   Notification Center -> Win + N (0x5B, 0x4E)  [Kalender & Notifikasi Windows 11]
//!   Widgets             -> Win + W (0x5B, 0x57)  [Papan Widget Windows 11]
//!   Search              -> Win + S (0x5B, 0x53)  [Pencarian Windows 11]
//!   Task View           -> Win + Tab (0x5B, 0x09)

#[cfg(windows)]
use windows::Win32::Foundation::HWND;
#[cfg(windows)]
use windows::Win32::UI::Input::KeyboardAndMouse::{
    keybd_event, MapVirtualKeyW, KEYBD_EVENT_FLAGS, KEYEVENTF_EXTENDEDKEY, KEYEVENTF_KEYUP,
    MAPVK_VK_TO_VSC,
};
#[cfg(windows)]
use windows::Win32::UI::WindowsAndMessaging::{GetShellWindow, SetForegroundWindow};

#[cfg(windows)]
pub fn send_hotkey(keys: &[u8]) {
    // Beri jeda 2.5 detik pada taskbar hider agar explorer tidak menutup flyout
    crate::core::taskbar::pause_taskbar_hiding(2500);
    let keys = keys.to_vec();
    std::thread::spawn(move || {
        unsafe {
            // Berikan fokus ke shell desktop Windows agar Explorer menerima hotkey
            let shell_hwnd = GetShellWindow();
            if shell_hwnd != HWND(std::ptr::null_mut()) {
                let _ = SetForegroundWindow(shell_hwnd);
            }
            std::thread::sleep(std::time::Duration::from_millis(25));

            // Tekan tombol berurutan dengan scancode yang tepat
            for &k in &keys {
                let scan = MapVirtualKeyW(k as u32, MAPVK_VK_TO_VSC) as u8;
                let mut flags = 0;
                if k == 0x5B || k == 0x5C {
                    flags |= KEYEVENTF_EXTENDEDKEY.0;
                }
                keybd_event(k, scan, KEYBD_EVENT_FLAGS(flags), 0);
                std::thread::sleep(std::time::Duration::from_millis(20));
            }

            // Beri waktu bagi shell untuk mendeteksi chord
            std::thread::sleep(std::time::Duration::from_millis(40));

            // Lepas tombol secara terbalik
            for &k in keys.iter().rev() {
                let scan = MapVirtualKeyW(k as u32, MAPVK_VK_TO_VSC) as u8;
                let mut flags = KEYEVENTF_KEYUP.0;
                if k == 0x5B || k == 0x5C {
                    flags |= KEYEVENTF_EXTENDEDKEY.0;
                }
                keybd_event(k, scan, KEYBD_EVENT_FLAGS(flags), 0);
                std::thread::sleep(std::time::Duration::from_millis(20));
            }
        }
    });
}

pub fn open_start() {
    #[cfg(windows)]
    {
        crate::core::taskbar::pause_taskbar_hiding(2500);
        std::thread::spawn(|| {
            unsafe {
                let shell_hwnd = GetShellWindow();
                if shell_hwnd != HWND(std::ptr::null_mut()) {
                    let _ = SetForegroundWindow(shell_hwnd);
                }
                std::thread::sleep(std::time::Duration::from_millis(25));

                // Di Windows, Ctrl + Esc (0x11, 0x1B) selalu memicu Start Menu asli Windows
                let ctrl_scan = MapVirtualKeyW(0x11, MAPVK_VK_TO_VSC) as u8;
                let esc_scan = MapVirtualKeyW(0x1B, MAPVK_VK_TO_VSC) as u8;

                keybd_event(0x11, ctrl_scan, KEYBD_EVENT_FLAGS(0), 0);
                std::thread::sleep(std::time::Duration::from_millis(15));
                keybd_event(0x1B, esc_scan, KEYBD_EVENT_FLAGS(0), 0);
                std::thread::sleep(std::time::Duration::from_millis(40));
                keybd_event(0x1B, esc_scan, KEYEVENTF_KEYUP, 0);
                std::thread::sleep(std::time::Duration::from_millis(15));
                keybd_event(0x11, ctrl_scan, KEYEVENTF_KEYUP, 0);
            }
        });
    }
}

pub fn open_quick_settings() {
    #[cfg(windows)]
    send_hotkey(&[0x5B, 0x41]); // Win + A (Quick Settings: Sound, Wi-Fi, Battery)
}

pub fn open_notification_center() {
    #[cfg(windows)]
    send_hotkey(&[0x5B, 0x4E]); // Win + N (Notification Center & Kalender Windows 11)
}

pub fn open_widgets() {
    #[cfg(windows)]
    send_hotkey(&[0x5B, 0x57]); // Win + W (Papan Widget Windows 11)
}

pub fn open_task_view() {
    #[cfg(windows)]
    send_hotkey(&[0x5B, 0x09]); // Win + Tab (Task View)
}

pub fn open_search() {
    #[cfg(windows)]
    send_hotkey(&[0x5B, 0x53]); // Win + S (Pencarian Asli Windows 11)
}
