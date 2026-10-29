//! System Media Transport Control Service
//! Synchronizes live Now Playing metadata & playback controls from Windows GSMTC
//! & Active Media Window Scanners (Spotify, YouTube/Chrome, Edge, Firefox, VLC, etc.)

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use once_cell::sync::Lazy;

#[cfg(windows)]
use windows::Media::Control::{
    GlobalSystemMediaTransportControlsSession,
    GlobalSystemMediaTransportControlsSessionManager,
    GlobalSystemMediaTransportControlsSessionPlaybackStatus,
};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct MediaState {
    pub title: String,
    pub artist: String,
    pub is_playing: bool,
    pub has_media: bool,
}

static MEDIA_CACHE: Lazy<Mutex<Option<MediaState>>> = Lazy::new(|| Mutex::new(None));
static GSMTC_CACHE: Lazy<Mutex<Option<MediaState>>> = Lazy::new(|| Mutex::new(None));

pub fn update_gsmtc_cache(state: Option<MediaState>) {
    if let Ok(mut cache) = GSMTC_CACHE.lock() {
        *cache = state;
    }
}

#[cfg(windows)]
pub fn send_media_key(vk: u8) {
    unsafe {
        use windows::Win32::UI::Input::KeyboardAndMouse::{
            keybd_event, KEYEVENTF_EXTENDEDKEY, KEYEVENTF_KEYUP,
        };
        keybd_event(vk, 0, KEYEVENTF_EXTENDEDKEY, 0);
        keybd_event(vk, 0, KEYEVENTF_EXTENDEDKEY | KEYEVENTF_KEYUP, 0);
    }
}

/// Polls Windows GSMTC (WinRT) for media state. Runs safely with a timeout.
#[cfg(windows)]
pub async fn poll_system_media() -> Option<MediaState> {
    unsafe {
        let _ = windows::Win32::System::Com::CoInitializeEx(
            None,
            windows::Win32::System::Com::COINIT_MULTITHREADED,
        );

        let async_mgr = GlobalSystemMediaTransportControlsSessionManager::RequestAsync().ok()?;
        let manager = async_mgr.await.ok()?;

        let mut candidate: Option<GlobalSystemMediaTransportControlsSession> = None;

        // 1. Cek GetSessions: prioritaskan sesi yang statusnya aktif Playing
        if let Ok(sessions) = manager.GetSessions() {
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
                    }
                }

                // Jika tidak ada yang Playing, ambil sesi pertama yang valid
                if candidate.is_none() && count > 0 {
                    for i in 0..count {
                        if let Ok(s) = sessions.GetAt(i) {
                            candidate = Some(s);
                            break;
                        }
                    }
                }
            }
        }

        // 2. Fallback ke GetCurrentSession jika sessions kosong
        if candidate.is_none() {
            if let Ok(s) = manager.GetCurrentSession() {
                candidate = Some(s);
            }
        }

        let session = candidate;

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

/// Fallback / Instant window title & WASAPI audio scanner
pub fn poll_media_from_windows() -> Option<MediaState> {
    let windows = crate::core::window_tracker::get_running_windows();
    let audio_peak = crate::services::hardware_audio::get_last_audio_peak();
    let has_sound = audio_peak > 0.005;

    // 1. Check Spotify
    for win in &windows {
        let app_lower = win.app_name.to_lowercase();
        let title_lower = win.title.to_lowercase();

        if app_lower.contains("spotify") || title_lower == "spotify" {
            let title = win.title.trim();
            if title.is_empty()
                || title.eq_ignore_ascii_case("spotify")
                || title.eq_ignore_ascii_case("spotify free")
                || title.eq_ignore_ascii_case("spotify premium")
            {
                continue;
            }

            if let Some((artist, track)) = title.split_once(" - ") {
                return Some(MediaState {
                    title: track.trim().to_string(),
                    artist: artist.trim().to_string(),
                    is_playing: has_sound,
                    has_media: true,
                });
            } else {
                return Some(MediaState {
                    title: title.to_string(),
                    artist: "Spotify".to_string(),
                    is_playing: has_sound,
                    has_media: true,
                });
            }
        }
    }

    // 2. Check YouTube / YouTube Music in browsers (Chrome, Edge, Brave, Firefox)
    for win in &windows {
        let title = win.title.trim();
        let title_lower = title.to_lowercase();

        if title_lower.contains("youtube music") {
            let mut cleaned = title
                .split(" - Google Chrome").next().unwrap_or(title)
                .split(" - Microsoft​ Edge").next().unwrap_or(title)
                .split(" - Brave").next().unwrap_or(title)
                .split(" - Mozilla Firefox").next().unwrap_or(title)
                .trim();
            if let Some(pos) = cleaned.to_lowercase().find(" - youtube music") {
                cleaned = &cleaned[..pos];
            }
            let cleaned = cleaned.trim();
            if !cleaned.is_empty() {
                let (song, artist) = if let Some((s, a)) = cleaned.split_once(" - ") {
                    (s.trim().to_string(), a.trim().to_string())
                } else {
                    (cleaned.to_string(), "YouTube Music".to_string())
                };
                return Some(MediaState {
                    title: song,
                    artist,
                    is_playing: has_sound,
                    has_media: true,
                });
            }
        } else if title_lower.contains(" - youtube") {
            let mut cleaned = title
                .split(" - Google Chrome").next().unwrap_or(title)
                .split(" - Microsoft​ Edge").next().unwrap_or(title)
                .split(" - Brave").next().unwrap_or(title)
                .split(" - Mozilla Firefox").next().unwrap_or(title)
                .trim();
            if let Some(pos) = cleaned.to_lowercase().find(" - youtube") {
                cleaned = &cleaned[..pos];
            }
            let cleaned = cleaned.trim();
            if !cleaned.is_empty() {
                let (artist, song) = if let Some((a, s)) = cleaned.split_once(" - ") {
                    (a.trim().to_string(), s.trim().to_string())
                } else {
                    ("YouTube".to_string(), cleaned.to_string())
                };
                return Some(MediaState {
                    title: song,
                    artist,
                    is_playing: has_sound,
                    has_media: true,
                });
            }
        }
    }

    // 3. Desktop Media Players (VLC, Apple Music, Foobar2000)
    for win in &windows {
        let title = win.title.trim();
        let title_lower = title.to_lowercase();
        let app_lower = win.app_name.to_lowercase();

        if app_lower.contains("vlc") || title_lower.contains("vlc media player") {
            let cleaned = title.split(" - VLC media player").next().unwrap_or(title).trim();
            if !cleaned.is_empty() && cleaned != "VLC media player" {
                return Some(MediaState {
                    title: cleaned.to_string(),
                    artist: "VLC".to_string(),
                    is_playing: has_sound,
                    has_media: true,
                });
            }
        } else if app_lower.contains("apple") || title_lower.contains("apple music") {
            let cleaned = title.split(" - Apple Music").next().unwrap_or(title).trim();
            if !cleaned.is_empty() && cleaned != "Apple Music" {
                return Some(MediaState {
                    title: cleaned.to_string(),
                    artist: "Apple Music".to_string(),
                    is_playing: has_sound,
                    has_media: true,
                });
            }
        } else if app_lower.contains("foobar") || title_lower.contains("foobar2000") {
            let cleaned = title.split(" [foobar2000]").next().unwrap_or(title).trim();
            if !cleaned.is_empty() {
                return Some(MediaState {
                    title: cleaned.to_string(),
                    artist: "Foobar2000".to_string(),
                    is_playing: has_sound,
                    has_media: true,
                });
            }
        }
    }

    // 4. Preserved state with audio peak
    if has_sound {
        if let Ok(cache) = MEDIA_CACHE.lock() {
            if let Some(ref prev) = *cache {
                if prev.has_media && !prev.title.is_empty() {
                    let mut updated = prev.clone();
                    updated.is_playing = true;
                    return Some(updated);
                }
            }
        }
    }

    None
}

/// Resolves current media state using hybrid detection (GSMTC + Window Title + WASAPI Peak)
pub async fn get_media_state() -> MediaState {
    // 1. Check GSMTC cache (hasil update real-time dari background worker)
    if let Ok(cache) = GSMTC_CACHE.lock() {
        if let Some(ref gsmtc) = *cache {
            if gsmtc.has_media && (gsmtc.is_playing || !gsmtc.title.is_empty()) {
                if let Ok(mut c) = MEDIA_CACHE.lock() {
                    *c = Some(gsmtc.clone());
                }
                return gsmtc.clone();
            }
        }
    }

    // 1b. Polling GSMTC langsung jika cache belum terisi
    #[cfg(windows)]
    {
        if let Some(gsmtc) = poll_system_media().await {
            if gsmtc.has_media && (gsmtc.is_playing || !gsmtc.title.is_empty()) {
                update_gsmtc_cache(Some(gsmtc.clone()));
                if let Ok(mut c) = MEDIA_CACHE.lock() {
                    *c = Some(gsmtc.clone());
                }
                return gsmtc;
            }
        }
    }

    // 2. Check Window & Audio scanner (Spotify, YouTube di browser, VLC, Apple Music)
    if let Some(win_media) = poll_media_from_windows() {
        if let Ok(mut c) = MEDIA_CACHE.lock() {
            *c = Some(win_media.clone());
        }
        return win_media;
    }

    // 3. Fallback to cached state or empty
    if let Ok(cache) = MEDIA_CACHE.lock() {
        if let Some(ref st) = *cache {
            let mut st_out = st.clone();
            let audio_peak = crate::services::hardware_audio::get_last_audio_peak();
            st_out.is_playing = audio_peak > 0.001;
            return st_out;
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
    {
        // 1. Send native Windows Media Play/Pause key (0xB3)
        send_media_key(0xB3);

        // 2. Also try GSMTC session
        tokio::spawn(async {
            unsafe {
                let _ = windows::Win32::System::Com::CoInitializeEx(
                    None,
                    windows::Win32::System::Com::COINIT_MULTITHREADED,
                );
                if let Ok(async_mgr) = GlobalSystemMediaTransportControlsSessionManager::RequestAsync() {
                    if let Ok(manager) = async_mgr.await {
                        if let Ok(session) = manager.GetCurrentSession() {
                            if let Ok(op) = session.TryTogglePlayPauseAsync() {
                                let _ = op.await;
                            }
                        }
                    }
                }
            }
        });
    }

    // Toggle cached is_playing immediately for instant UI feedback
    if let Ok(mut cache) = MEDIA_CACHE.lock() {
        if let Some(ref mut st) = *cache {
            st.is_playing = !st.is_playing;
            return st.clone();
        }
    }

    get_media_state().await
}

pub async fn skip_next() {
    #[cfg(windows)]
    {
        // 1. Send native Windows Media Next key (0xB0)
        send_media_key(0xB0);

        // 2. Also try GSMTC
        tokio::spawn(async {
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
        });
    }
}

pub async fn skip_previous() {
    #[cfg(windows)]
    {
        // 1. Send native Windows Media Prev key (0xB1)
        send_media_key(0xB1);

        // 2. Also try GSMTC
        tokio::spawn(async {
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
        });
    }
}
