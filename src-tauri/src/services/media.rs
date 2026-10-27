//! System Media Transport Control Service
//! Synchronizes live Now Playing metadata & playback controls from Windows GSMTC
//! (Spotify, YouTube/Chrome, Edge, Firefox, etc.)

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use once_cell::sync::Lazy;

#[cfg(windows)]
use windows::Media::Control::{
    GlobalSystemMediaTransportControlsSession,
    GlobalSystemMediaTransportControlsSessionManager,
    GlobalSystemMediaTransportControlsSessionPlaybackStatus,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaState {
    pub title: String,
    pub artist: String,
    pub is_playing: bool,
    pub has_media: bool,
}

static MEDIA_CACHE: Lazy<Mutex<Option<MediaState>>> = Lazy::new(|| Mutex::new(None));

#[cfg(windows)]
pub async fn poll_system_media() -> Option<MediaState> {
    unsafe {
        let _ = windows::Win32::System::Com::CoInitializeEx(
            None,
            windows::Win32::System::Com::COINIT_MULTITHREADED,
        );

        let async_mgr = GlobalSystemMediaTransportControlsSessionManager::RequestAsync().ok()?;
        let manager = async_mgr.await.ok()?;

        // 1. Coba current session terlebih dahulu, atau ambil dari sessions
        let session: Option<GlobalSystemMediaTransportControlsSession> = if let Ok(s) = manager.GetCurrentSession() {
            Some(s)
        } else if let Ok(sessions) = manager.GetSessions() {
            let mut candidate = None;
            if let Ok(count) = sessions.Size() {
                for i in 0..count {
                    if let Ok(s) = sessions.GetAt(i) {
                        if let Ok(info) = s.GetPlaybackInfo() {
                            if let Ok(status) = info.PlaybackStatus() {
                                if status == GlobalSystemMediaTransportControlsSessionPlaybackStatus::Playing {
                                    candidate = Some(s);
                                    break;
                                }
                            }
                        }
                        if candidate.is_none() {
                            candidate = Some(s);
                        }
                    }
                }
            }
            candidate
        } else {
            None
        };

        let session = session?;

        let props_async = session.TryGetMediaPropertiesAsync().ok()?;
        let props = props_async.await.ok()?;

        let title = props.Title().ok().map(|s| s.to_string()).unwrap_or_default();
        let artist = props.Artist().ok().map(|s| s.to_string()).unwrap_or_default();

        let is_playing = session
            .GetPlaybackInfo()
            .ok()
            .and_then(|info| info.PlaybackStatus().ok())
            .map(|st| st == GlobalSystemMediaTransportControlsSessionPlaybackStatus::Playing)
            .unwrap_or(false);

        let has_media = !title.trim().is_empty() || !artist.trim().is_empty();

        if has_media {
            Some(MediaState {
                title: title.trim().to_string(),
                artist: artist.trim().to_string(),
                is_playing,
                has_media: true,
            })
        } else {
            None
        }
    }
}

pub async fn get_media_state() -> MediaState {
    #[cfg(windows)]
    {
        if let Some(real_state) = poll_system_media().await {
            if let Ok(mut cache) = MEDIA_CACHE.lock() {
                *cache = Some(real_state.clone());
            }
            return real_state;
        }
    }

    if let Ok(cache) = MEDIA_CACHE.lock() {
        if let Some(ref st) = *cache {
            return st.clone();
        }
    }

    MediaState {
        title: String::new(),
        artist: String::new(),
        is_playing: false,
        has_media: false,
    }
}

pub async fn toggle_playback() -> MediaState {
    #[cfg(windows)]
    unsafe {
        let _ = windows::Win32::System::Com::CoInitializeEx(
            None,
            windows::Win32::System::Com::COINIT_MULTITHREADED,
        );

        if let Ok(async_mgr) = GlobalSystemMediaTransportControlsSessionManager::RequestAsync() {
            if let Ok(manager) = async_mgr.await {
                let target_session = if let Ok(session) = manager.GetCurrentSession() {
                    Some(session)
                } else if let Ok(sessions) = manager.GetSessions() {
                    let mut found = None;
                    if let Ok(count) = sessions.Size() {
                        for i in 0..count {
                            if let Ok(s) = sessions.GetAt(i) {
                                found = Some(s);
                                break;
                            }
                        }
                    }
                    found
                } else {
                    None
                };

                if let Some(session) = target_session {
                    if let Ok(op) = session.TryTogglePlayPauseAsync() {
                        let _ = op.await;
                    }
                }
            }
        }
    }

    get_media_state().await
}

pub async fn skip_next() {
    #[cfg(windows)]
    unsafe {
        let _ = windows::Win32::System::Com::CoInitializeEx(
            None,
            windows::Win32::System::Com::COINIT_MULTITHREADED,
        );
        if let Ok(async_mgr) = GlobalSystemMediaTransportControlsSessionManager::RequestAsync() {
            if let Ok(manager) = async_mgr.await {
                if let Ok(session) = manager.GetCurrentSession() {
                    if let Ok(op) = session.TrySkipNextAsync() {
                        let _ = op.await;
                    }
                }
            }
        }
    }
}

pub async fn skip_previous() {
    #[cfg(windows)]
    unsafe {
        let _ = windows::Win32::System::Com::CoInitializeEx(
            None,
            windows::Win32::System::Com::COINIT_MULTITHREADED,
        );
        if let Ok(async_mgr) = GlobalSystemMediaTransportControlsSessionManager::RequestAsync() {
            if let Ok(manager) = async_mgr.await {
                if let Ok(session) = manager.GetCurrentSession() {
                    if let Ok(op) = session.TrySkipPreviousAsync() {
                        let _ = op.await;
                    }
                }
            }
        }
    }
}
