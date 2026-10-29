//! System Telemetry, Global Cursor Tracking, Smart Intellihide & Clipboard Monitor

use serde::Serialize;
use std::sync::Mutex;
use once_cell::sync::Lazy;

#[cfg(windows)]
use windows::Win32::{
    Foundation::{POINT, RECT, FILETIME},
    System::{
        DataExchange::{CloseClipboard, GetClipboardData, OpenClipboard},
        Memory::{GlobalLock, GlobalUnlock},
        SystemInformation::{GlobalMemoryStatusEx, MEMORYSTATUSEX},
        Threading::GetSystemTimes,
    },
    UI::WindowsAndMessaging::{
        GetCursorPos, GetForegroundWindow, GetSystemMetrics, GetWindowRect, IsZoomed,
        SM_CXSCREEN, SM_CYSCREEN,
    },
};

#[derive(Clone, Serialize, Default)]
pub struct SystemPulse {
    pub cursor_norm_x: f64, // -1.0 (kiri) s/d 1.0 (kanan) relatif terhadap Notch
    pub cursor_norm_y: f64, // 0.0 (atas) s/d 1.0 (bawah)
    pub cpu_usage: f32,
    pub ram_usage: f32,
    pub should_autohide_dock: bool,
    pub cursor_near_bottom: bool,
    pub recent_clips: Vec<String>,
}

struct CpuTimes {
    idle: u64,
    kernel: u64,
    user: u64,
}

static LAST_CPU: Lazy<Mutex<CpuTimes>> = Lazy::new(|| {
    Mutex::new(CpuTimes { idle: 0, kernel: 0, user: 0 })
});

static CLIPBOARD_HISTORY: Lazy<Mutex<Vec<String>>> = Lazy::new(|| Mutex::new(Vec::new()));
static LAST_SEQ: once_cell::sync::Lazy<std::sync::atomic::AtomicU32> = once_cell::sync::Lazy::new(|| std::sync::atomic::AtomicU32::new(0));
static CPU_EMA: Lazy<Mutex<f32>> = Lazy::new(|| Mutex::new(0.0));

#[cfg(windows)]
fn filetime_to_u64(ft: FILETIME) -> u64 {
    ((ft.dwHighDateTime as u64) << 32) | (ft.dwLowDateTime as u64)
}

#[cfg(windows)]
pub fn sample_cpu_and_ram() -> (f32, f32) {
    unsafe {
        // 1. Hitung RAM via GlobalMemoryStatusEx
        let mut mem_info = MEMORYSTATUSEX {
            dwLength: std::mem::size_of::<MEMORYSTATUSEX>() as u32,
            ..Default::default()
        };
        let _ = GlobalMemoryStatusEx(&mut mem_info);
        let ram_usage = mem_info.dwMemoryLoad as f32;

        // 2. Hitung CPU via GetSystemTimes
        let mut idle = Default::default();
        let mut kernel = Default::default();
        let mut user = Default::default();

        let mut cpu_usage = 0.0;
        if GetSystemTimes(Some(&mut idle), Some(&mut kernel), Some(&mut user)).is_ok() {
            let idle_u = filetime_to_u64(idle);
            let kernel_u = filetime_to_u64(kernel);
            let user_u = filetime_to_u64(user);

            if let Ok(mut prev) = LAST_CPU.lock() {
                let d_idle = idle_u.saturating_sub(prev.idle);
                let d_kernel = kernel_u.saturating_sub(prev.kernel);
                let d_user = user_u.saturating_sub(prev.user);
                let total_sys = d_kernel + d_user;

                if total_sys > 0 {
                    let raw_cpu = ((total_sys.saturating_sub(d_idle)) as f32 / total_sys as f32) * 100.0;
                    if let Ok(mut ema) = CPU_EMA.lock() {
                        *ema = (*ema * 0.82) + (raw_cpu.clamp(0.0, 100.0) * 0.18);
                        cpu_usage = *ema;
                    } else {
                        cpu_usage = raw_cpu;
                    }
                }
                *prev = CpuTimes { idle: idle_u, kernel: kernel_u, user: user_u };
            }
        }

        (cpu_usage.clamp(0.0, 100.0), ram_usage.clamp(0.0, 100.0))
    }
}

#[cfg(not(windows))]
pub fn sample_cpu_and_ram() -> (f32, f32) {
    (0.0, 0.0)
}

#[cfg(windows)]
pub fn check_clipboard_update() -> Vec<String> {
    unsafe {
        use windows::Win32::System::DataExchange::GetClipboardSequenceNumber;
        let seq = GetClipboardSequenceNumber();
        if LAST_SEQ.swap(seq, std::sync::atomic::Ordering::Relaxed) == seq {
            return CLIPBOARD_HISTORY.lock().map(|h| h.clone()).unwrap_or_default();
        }

        const CF_UNICODETEXT: u32 = 13;
        if OpenClipboard(None).is_ok() {
            if let Ok(handle) = GetClipboardData(CF_UNICODETEXT) {
                let ptr = GlobalLock(windows::Win32::Foundation::HGLOBAL(handle.0)) as *const u16;
                if !ptr.is_null() {
                    let mut len = 0;
                    while *ptr.add(len) != 0 && len < 500 {
                        len += 1;
                    }
                    let slice = std::slice::from_raw_parts(ptr, len);
                    let text = String::from_utf16_lossy(slice).trim().to_string();
                    let _ = GlobalUnlock(windows::Win32::Foundation::HGLOBAL(handle.0));

                    if !text.is_empty() {
                        if let Ok(mut hist) = CLIPBOARD_HISTORY.lock() {
                            if hist.first() != Some(&text) {
                                hist.retain(|item| item != &text);
                                hist.insert(0, text);
                                hist.truncate(8); // Simpan 8 riwayat terakhir
                            }
                        }
                    }
                }
            }
            let _ = CloseClipboard();
        }
    }
    CLIPBOARD_HISTORY.lock().map(|h| h.clone()).unwrap_or_default()
}

#[cfg(not(windows))]
pub fn check_clipboard_update() -> Vec<String> {
    Vec::new()
}

#[cfg(windows)]
pub fn get_system_pulse(dock_hwnd_val: isize) -> SystemPulse {
    unsafe {
        let screen_w = GetSystemMetrics(SM_CXSCREEN).max(1) as f64;
        let screen_h = GetSystemMetrics(SM_CYSCREEN).max(1) as f64;

        // 1. Posisi Kursor Global
        let mut pt = POINT::default();
        let _ = GetCursorPos(&mut pt);

        // Normalisasi arah tatapan mata Notch (pusat di tengah atas layar)
        let center_x = screen_w / 2.0;
        let norm_x = ((pt.x as f64 - center_x) / (screen_w / 2.0)).clamp(-1.0, 1.0);
        let norm_y = (pt.y as f64 / screen_h).clamp(0.0, 1.0);
        let cursor_near_bottom = (pt.y as f64) >= (screen_h - 130.0);

        // 2. Smart Intellihide: Cek apakah jendela aktif menutupi area Dock (84px bawah)
        let fg_hwnd = GetForegroundWindow();
        let mut should_autohide_dock = false;

        if !fg_hwnd.0.is_null() && fg_hwnd.0 as isize != dock_hwnd_val {
            if IsZoomed(fg_hwnd).as_bool() {
                should_autohide_dock = true;
            } else {
                let mut rect = RECT::default();
                if GetWindowRect(fg_hwnd, &mut rect).is_ok() {
                    let dock_top_zone = (screen_h - 84.0) as i32;
                    // Jika bagian bawah jendela aktif menabrak area dock
                    if rect.bottom > dock_top_zone && rect.top < (screen_h as i32 - 10) {
                        should_autohide_dock = true;
                    }
                }
            }
        }

        let (cpu_usage, ram_usage) = sample_cpu_and_ram();
        let recent_clips = check_clipboard_update();

        SystemPulse {
            cursor_norm_x: norm_x,
            cursor_norm_y: norm_y,
            cpu_usage,
            ram_usage,
            should_autohide_dock,
            cursor_near_bottom,
            recent_clips,
        }
    }
}

#[cfg(not(windows))]
pub fn get_system_pulse(_dock_hwnd_val: isize) -> SystemPulse {
    SystemPulse::default()
}
