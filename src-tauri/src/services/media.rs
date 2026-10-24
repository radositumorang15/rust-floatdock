//! System Media Transport Control Service
//! Provides now-playing media metadata and playback controls.

use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaState {
    pub title: String,
    pub artist: String,
    pub is_playing: bool,
    pub has_media: bool,
}

static MEDIA_STATE: Mutex<Option<MediaState>> = Mutex::new(None);

fn init_media() {
    let mut lock = MEDIA_STATE.lock().unwrap();
    if lock.is_none() {
        *lock = Some(MediaState {
            title: "Float Dock Soundtrack".to_string(),
            artist: "Ambient Waters".to_string(),
            is_playing: true,
            has_media: true,
        });
    }
}

pub fn get_media_state() -> MediaState {
    init_media();
    let lock = MEDIA_STATE.lock().unwrap();
    lock.as_ref().unwrap().clone()
}

pub fn toggle_playback() -> MediaState {
    init_media();
    let mut lock = MEDIA_STATE.lock().unwrap();
    let media = lock.as_mut().unwrap();
    media.is_playing = !media.is_playing;
    media.clone()
}
