//! Memicu UI shell Windows yang asli dengan mengirim shortcut keyboard yang sama
//! seperti yang ditekan pengguna. Tidak ada UI buatan sendiri.
//!
//!   Start menu          -> tap tombol Win
//!   Quick Settings      -> Win + A   (Wi-Fi, volume, baterai, kecerahan; Windows 11)
//!   Notification Center -> Win + N   (notifikasi + kalender; Windows 11)
//!
//! Cargo (crate `windows`): feature "Win32_UI_Input_KeyboardAndMouse"

#[cfg(windows)]
use windows::Win32::UI::Input::KeyboardAndMouse::{
    SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYBD_EVENT_FLAGS, KEYEVENTF_KEYUP,
    VIRTUAL_KEY, VK_LWIN,
};

#[cfg(windows)]
fn key_event(vk: VIRTUAL_KEY, up: bool) -> INPUT {
    INPUT {
        r#type: INPUT_KEYBOARD,
        Anonymous: INPUT_0 {
            ki: KEYBDINPUT {
                wVk: vk,
                wScan: 0,
                dwFlags: if up { KEYEVENTF_KEYUP } else { KEYBD_EVENT_FLAGS(0) },
                time: 0,
                dwExtraInfo: 0,
            },
        },
    }
}

/// Tekan semua tombol berurutan, lalu lepas dengan urutan terbalik.
#[cfg(windows)]
fn send_chord(keys: &[VIRTUAL_KEY]) {
    let mut inputs: Vec<INPUT> = keys.iter().map(|&k| key_event(k, false)).collect();
    inputs.extend(keys.iter().rev().map(|&k| key_event(k, true)));
    unsafe {
        SendInput(&inputs, std::mem::size_of::<INPUT>() as i32);
    }
}

pub fn open_start() {
    #[cfg(windows)]
    send_chord(&[VK_LWIN]);
}

pub fn open_quick_settings() {
    #[cfg(windows)]
    send_chord(&[VK_LWIN, VIRTUAL_KEY(0x41)]); // 'A'
}

pub fn open_notification_center() {
    #[cfg(windows)]
    send_chord(&[VK_LWIN, VIRTUAL_KEY(0x4E)]); // 'N'
}

