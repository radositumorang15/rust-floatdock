//! System Audio Volume Service
//! Manages audio endpoint volume level and mute status.

use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VolumeInfo {
    pub level: u8,
    pub is_muted: bool,
}

static VOLUME: Mutex<VolumeInfo> = Mutex::new(VolumeInfo {
    level: 75,
    is_muted: false,
});

pub fn get_volume() -> VolumeInfo {
    let lock = VOLUME.lock().unwrap();
    lock.clone()
}

pub fn set_volume(level: u8) -> VolumeInfo {
    let mut lock = VOLUME.lock().unwrap();
    lock.level = level.min(100);
    lock.is_muted = false;
    lock.clone()
}

pub fn step_volume(delta: i8) -> VolumeInfo {
    let mut lock = VOLUME.lock().unwrap();
    let current = lock.level as i16;
    let new_val = (current + delta as i16).clamp(0, 100) as u8;
    lock.level = new_val;
    lock.clone()
}

pub fn toggle_mute() -> VolumeInfo {
    let mut lock = VOLUME.lock().unwrap();
    lock.is_muted = !lock.is_muted;
    lock.clone()
}
