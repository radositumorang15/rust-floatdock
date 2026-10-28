//! Memicu UI shell Windows yang asli dengan mengirim shortcut keyboard yang sama
//! seperti yang ditekan pengguna. Tidak ada UI buatan sendiri.
//!
//!   Start menu          -> tap tombol Win
//!   Quick Settings      -> Win + A   (Wi-Fi, volume, baterai, kecerahan; Windows 11)
//!   Notification Center -> Win + N   (notifikasi + kalender; Windows 11)
//!   Widgets             -> Win + W   (papan widget; Windows 11)

#[cfg(windows)]
use windows::Win32::UI::Input::KeyboardAndMouse::{
    keybd_event, KEYBD_EVENT_FLAGS, KEYEVENTF_EXTENDEDKEY, KEYEVENTF_KEYUP,
};

pub fn send_hotkey(keys: &[u8]) {
    #[cfg(windows)]
    {
        // Beri jeda 2 detik pada taskbar hider agar explorer tidak menutup flyout
        crate::core::taskbar::pause_taskbar_hiding(2000);
        let keys = keys.to_vec();
        std::thread::spawn(move || {
            unsafe {
                // Tekan tombol berurutan
                for &k in &keys {
                    let mut flags = 0;
                    if k == 0x5B || k == 0x5C {
                        flags |= KEYEVENTF_EXTENDEDKEY.0;
                    }
                    keybd_event(k, 0, KEYBD_EVENT_FLAGS(flags), 0);
                    std::thread::sleep(std::time::Duration::from_millis(30));
                }

                // Beri waktu bagi shell untuk mendeteksi chord
                std::thread::sleep(std::time::Duration::from_millis(50));

                // Lepas tombol secara terbalik
                for &k in keys.iter().rev() {
                    let mut flags = KEYEVENTF_KEYUP.0;
                    if k == 0x5B || k == 0x5C {
                        flags |= KEYEVENTF_EXTENDEDKEY.0;
                    }
                    keybd_event(k, 0, KEYBD_EVENT_FLAGS(flags), 0);
                    std::thread::sleep(std::time::Duration::from_millis(25));
                }
            }
        });
    }
}

pub fn open_start() {
    send_hotkey(&[0x5B]);
}

pub fn open_quick_settings() {
    send_hotkey(&[0x5B, 0x41]); // Win + A
}

pub fn open_notification_center() {
    send_hotkey(&[0x5B, 0x4E]); // Win + N
}

pub fn open_widgets() {
    send_hotkey(&[0x5B, 0x57]); // Win + W
}

pub fn open_task_view() {
    send_hotkey(&[0x5B, 0x09]); // Win + Tab
}

