//! Real-Time WASAPI Audio Peak Visualizer, Battery/Charger & Audio Endpoint Monitor

use serde::Serialize;
use std::sync::Mutex;
use once_cell::sync::Lazy;

#[cfg(windows)]
use windows::Win32::{
    Media::Audio::{
        eConsole, eMultimedia, eRender, Endpoints::IAudioMeterInformation, IMMDeviceEnumerator,
        MMDeviceEnumerator,
    },
    System::{
        Com::{CoCreateInstance, CoInitializeEx, CoTaskMemFree, CLSCTX_ALL, COINIT_MULTITHREADED},
        Power::{GetSystemPowerStatus, SYSTEM_POWER_STATUS},
    },
};

#[derive(Clone, Serialize, Default)]
pub struct HardwareAudioState {
    pub audio_bars: [f32; 5],           // 5 bar visualizer real-time (0.0 - 1.0)
    pub battery_percent: u8,
    pub is_charging: bool,
    pub hardware_toast: Option<String>, // Pop-up otomatis saat charger/audio berubah
}

struct PrevHardwareState {
    is_charging: Option<bool>,
    candidate_charging: Option<bool>,
    candidate_count: u8,
    cached_battery_percent: u8,
    cached_is_charging: bool,
    battery_low_warned: bool,
    active_audio_id: Option<String>,
    last_audio_toast: Option<std::time::Instant>,
    last_power_toast: Option<std::time::Instant>,
    last_battery_poll: Option<std::time::Instant>,
}

static PREV_HW: Lazy<Mutex<PrevHardwareState>> = Lazy::new(|| {
    Mutex::new(PrevHardwareState {
        is_charging: None,
        candidate_charging: None,
        candidate_count: 0,
        cached_battery_percent: 100,
        cached_is_charging: true,
        battery_low_warned: false,
        active_audio_id: None,
        last_audio_toast: None,
        last_power_toast: None,
        last_battery_poll: None,
    })
});

static LAST_AUDIO_PEAK: Lazy<Mutex<f32>> = Lazy::new(|| Mutex::new(0.0));

pub fn get_last_audio_peak() -> f32 {
    LAST_AUDIO_PEAK.lock().map(|g| *g).unwrap_or(0.0)
}

#[cfg(windows)]
pub fn poll_hardware_and_audio() -> HardwareAudioState {
    unsafe {
        let _ = CoInitializeEx(None, COINIT_MULTITHREADED);

        let mut peak: f32 = 0.0;
        let mut current_device_id = None;

        // 1. Baca Real-Time Audio Peak & ID Perangkat Output (Speaker/Bluetooth)
        if let Ok(enumerator) = CoCreateInstance::<_, IMMDeviceEnumerator>(&MMDeviceEnumerator, None, CLSCTX_ALL) {
            let endpoint = enumerator
                .GetDefaultAudioEndpoint(eRender, eMultimedia)
                .or_else(|_| enumerator.GetDefaultAudioEndpoint(eRender, eConsole));
            if let Ok(device) = endpoint {
                if let Ok(id_pwstr) = device.GetId() {
                    let id_str = id_pwstr.to_string().unwrap_or_default();
                    if !id_str.is_empty() {
                        current_device_id = Some(id_str);
                    }
                    CoTaskMemFree(Some(id_pwstr.as_ptr() as _));
                }
                if let Ok(meter) = device.Activate::<IAudioMeterInformation>(CLSCTX_ALL, None) {
                    peak = meter.GetPeakValue().unwrap_or(0.0).clamp(0.0, 1.0);
                }
            }
        }

        if let Ok(mut g) = LAST_AUDIO_PEAK.lock() {
            *g = peak;
        }

        // Bentuk 5 bar visualizer proporsional dari Peak + variasi harmonik
        let audio_bars = if peak > 0.01 {
            [
                (peak * 0.75).clamp(0.15, 1.0),
                (peak * 1.15).clamp(0.20, 1.0),
                peak.clamp(0.25, 1.0),
                (peak * 0.90).clamp(0.20, 1.0),
                (peak * 0.65).clamp(0.15, 1.0),
            ]
        } else {
            [0.12, 0.12, 0.12, 0.12, 0.12]
        };

        // 2. Deteksi Perubahan Audio & Baterai dengan Debounce dan Cooldown
        let now = std::time::Instant::now();
        let mut hardware_toast = None;
        let mut battery_percent = 100;
        let mut is_charging = true;

        if let Ok(mut prev) = PREV_HW.lock() {
            // Cek Perangkat Audio / Headset Bluetooth Berubah (HANYA jika device ID valid)
            if let Some(ref curr_id) = current_device_id {
                if let Some(ref prev_id) = prev.active_audio_id {
                    if prev_id != curr_id {
                        let cooldown_ok = match prev.last_audio_toast {
                            Some(last_t) => now.duration_since(last_t) > std::time::Duration::from_secs(8),
                            None => true,
                        };
                        if cooldown_ok {
                            prev.last_audio_toast = Some(now);
                            hardware_toast = Some("🎧 Audio: Output Berubah".to_string());
                        }
                    }
                }
                prev.active_audio_id = Some(curr_id.clone());
            }

            // Batasi query baterai maks 1x per detik agar tidak membebani Embedded Controller (EC) laptop
            let should_poll_battery = match prev.last_battery_poll {
                Some(last_poll) => now.duration_since(last_poll) >= std::time::Duration::from_millis(1000),
                None => true,
            };

            if should_poll_battery {
                prev.last_battery_poll = Some(now);

                let mut pwr = SYSTEM_POWER_STATUS::default();
                if GetSystemPowerStatus(&mut pwr).is_ok() {
                    // Cek apakah sistem memiliki baterai fisik (128 = tidak ada baterai, 255 = status tidak diketahui)
                    let has_battery = pwr.BatteryFlag != 128 && pwr.BatteryFlag != 255;
                    let pct = if pwr.BatteryLifePercent <= 100 { pwr.BatteryLifePercent } else { 100 };
                    prev.cached_battery_percent = pct;

                    // ACLineStatus: 0 = Offline (Baterai), 1 = Online (Charger dicolok), 255 = Unknown
                    // Status 255 diabaikan (sering muncul sementara saat handshake USB-PD atau lonjakan daya)
                    if has_battery && (pwr.ACLineStatus == 0 || pwr.ACLineStatus == 1) {
                        let currently_online = pwr.ACLineStatus == 1;

                        match prev.is_charging {
                            None => {
                                // Startup awal: catat kondisi saat ini tanpa memicu pop-up toast
                                prev.is_charging = Some(currently_online);
                                prev.cached_is_charging = currently_online;
                                prev.candidate_charging = None;
                                prev.candidate_count = 0;
                            }
                            Some(confirmed) => {
                                if currently_online != confirmed {
                                    // Status berubah dari kondisi terkonfirmasi: lakukan debouncing
                                    if prev.candidate_charging == Some(currently_online) {
                                        prev.candidate_count += 1;
                                    } else {
                                        prev.candidate_charging = Some(currently_online);
                                        prev.candidate_count = 1;
                                    }

                                    // Perubahan baru diterima jika stabil minimal 2x polling berturut-turut (~2 detik)
                                    if prev.candidate_count >= 2 {
                                        prev.is_charging = Some(currently_online);
                                        prev.cached_is_charging = currently_online;
                                        prev.candidate_charging = None;
                                        prev.candidate_count = 0;

                                        // Cooldown minimal 5 detik antara notifikasi charger
                                        let cooldown_ok = match prev.last_power_toast {
                                            Some(last_t) => now.duration_since(last_t) >= std::time::Duration::from_secs(5),
                                            None => true,
                                        };

                                        if cooldown_ok && hardware_toast.is_none() {
                                            prev.last_power_toast = Some(now);
                                            hardware_toast = Some(if currently_online {
                                                format!("⚡ Mengisi Daya ({}%)", pct)
                                            } else {
                                                format!("🔋 Mode Baterai ({}%)", pct)
                                            });
                                        }
                                    }
                                } else {
                                    // Pembacaan konsisten dengan status terkonfirmasi: reset kandidat debounce
                                    prev.candidate_charging = None;
                                    prev.candidate_count = 0;
                                    prev.cached_is_charging = confirmed;
                                }
                            }
                        }

                        // Cek Peringatan Baterai Lemah (<= 20%)
                        let confirmed_charging = prev.is_charging.unwrap_or(true);
                        if !confirmed_charging && pct <= 20 && pct > 0 && !prev.battery_low_warned {
                            prev.battery_low_warned = true;
                            if hardware_toast.is_none() {
                                hardware_toast = Some(format!("⚠️ Baterai Lemah ({}%)", pct));
                            }
                        } else if confirmed_charging || pct > 25 {
                            prev.battery_low_warned = false;
                        }
                    }
                }
            }

            battery_percent = prev.cached_battery_percent;
            is_charging = prev.cached_is_charging;
        }

        HardwareAudioState {
            audio_bars,
            battery_percent,
            is_charging,
            hardware_toast,
        }
    }
}

#[cfg(not(windows))]
pub fn poll_hardware_and_audio() -> HardwareAudioState {
    HardwareAudioState::default()
}
