//! Real-Time WASAPI Audio Peak Visualizer, Battery/Charger & Audio Endpoint Monitor

use serde::Serialize;
use std::sync::Mutex;
use once_cell::sync::Lazy;

#[cfg(windows)]
use windows::Win32::{
    Media::Audio::{
        eConsole, eRender, Endpoints::IAudioMeterInformation, IMMDeviceEnumerator,
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
    battery_low_warned: bool,
    active_audio_id: Option<String>,
    last_audio_toast: Option<std::time::Instant>,
}

static PREV_HW: Lazy<Mutex<PrevHardwareState>> = Lazy::new(|| {
    Mutex::new(PrevHardwareState {
        is_charging: None,
        battery_low_warned: false,
        active_audio_id: None,
        last_audio_toast: None,
    })
});

#[cfg(windows)]
pub fn poll_hardware_and_audio() -> HardwareAudioState {
    unsafe {
        let _ = CoInitializeEx(None, COINIT_MULTITHREADED);

        let mut peak: f32 = 0.0;
        let mut current_device_id = None;

        // 1. Baca Real-Time Audio Peak & ID Perangkat Output (Speaker/Bluetooth)
        if let Ok(enumerator) = CoCreateInstance::<_, IMMDeviceEnumerator>(&MMDeviceEnumerator, None, CLSCTX_ALL) {
            if let Ok(device) = enumerator.GetDefaultAudioEndpoint(eRender, eConsole) {
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

        // 2. Baca Status Baterai & Charger
        let mut pwr = SYSTEM_POWER_STATUS::default();
        let _ = GetSystemPowerStatus(&mut pwr);
        let is_charging = pwr.ACLineStatus == 1;
        let battery_percent = if pwr.BatteryLifePercent <= 100 { pwr.BatteryLifePercent } else { 100 };

        // 3. Deteksi Perubahan untuk Memicu Pop-up Notch Otomatis
        let mut hardware_toast = None;
        if let Ok(mut prev) = PREV_HW.lock() {
            // Cek Charger dicolok / dicabut
            if let Some(was_charging) = prev.is_charging {
                if was_charging != is_charging {
                    hardware_toast = Some(if is_charging {
                        format!("⚡ Mengisi Daya ({}%)", battery_percent)
                    } else {
                        format!("🔋 Mode Baterai ({}%)", battery_percent)
                    });
                }
            }
            prev.is_charging = Some(is_charging);

            // Cek Peringatan Baterai Lemah (<= 20%)
            if !is_charging && battery_percent <= 20 && !prev.battery_low_warned {
                prev.battery_low_warned = true;
                hardware_toast = Some(format!("⚠️ Baterai Lemah ({}%)", battery_percent));
            } else if is_charging || battery_percent > 25 {
                prev.battery_low_warned = false;
            }

            // Cek Perangkat Audio / Headset Bluetooth Berubah (HANYA jika device ID valid)
            if let Some(ref curr_id) = current_device_id {
                if let Some(ref prev_id) = prev.active_audio_id {
                    if prev_id != curr_id {
                        let now = std::time::Instant::now();
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
