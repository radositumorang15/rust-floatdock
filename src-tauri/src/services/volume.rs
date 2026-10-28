//! System Audio Volume Service
//! Reads and controls the real Windows master volume and mute state via WASAPI (IAudioEndpointVolume).

use serde::{Deserialize, Serialize};

#[cfg(windows)]
use windows::Win32::{
    Media::Audio::{
        eConsole, eRender, Endpoints::IAudioEndpointVolume, IMMDeviceEnumerator,
        MMDeviceEnumerator,
    },
    System::Com::{CoCreateInstance, CoInitializeEx, CLSCTX_ALL, COINIT_MULTITHREADED},
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VolumeInfo {
    pub level: u8,
    pub is_muted: bool,
}

#[cfg(windows)]
fn get_endpoint_volume() -> Option<IAudioEndpointVolume> {
    unsafe {
        let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
        let enumerator: IMMDeviceEnumerator =
            CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL).ok()?;
        let device = enumerator.GetDefaultAudioEndpoint(eRender, eConsole).ok()?;
        device.Activate::<IAudioEndpointVolume>(CLSCTX_ALL, None).ok()
    }
}

pub fn get_volume() -> VolumeInfo {
    #[cfg(windows)]
    if let Some(endpoint) = get_endpoint_volume() {
        unsafe {
            let level_scalar = endpoint.GetMasterVolumeLevelScalar().unwrap_or(0.7);
            let is_muted = endpoint.GetMute().map(|b| b.as_bool()).unwrap_or(false);

            return VolumeInfo {
                level: (level_scalar * 100.0).round().clamp(0.0, 100.0) as u8,
                is_muted,
            };
        }
    }

    VolumeInfo {
        level: 70,
        is_muted: false,
    }
}

pub fn set_volume(level: u8) -> VolumeInfo {
    let target = level.min(100);
    #[cfg(windows)]
    if let Some(endpoint) = get_endpoint_volume() {
        unsafe {
            let scalar = (target as f32 / 100.0).clamp(0.0, 1.0);
            let _ = endpoint.SetMasterVolumeLevelScalar(scalar, std::ptr::null());
            let _ = endpoint.SetMute(false, std::ptr::null());
        }
    }

    get_volume()
}

pub fn step_volume(delta: i8) -> VolumeInfo {
    let current = get_volume();
    let new_level = (current.level as i16 + delta as i16).clamp(0, 100) as u8;
    set_volume(new_level)
}

pub fn toggle_mute() -> VolumeInfo {
    #[cfg(windows)]
    if let Some(endpoint) = get_endpoint_volume() {
        unsafe {
            if let Ok(muted) = endpoint.GetMute() {
                let _ = endpoint.SetMute(!muted.as_bool(), std::ptr::null());
            }
        }
    }

    get_volume()
}
