//! IPC Event Definitions
//! Constants and broadcast helpers between Rust and frontend windows.

use serde::Serialize;
use tauri::{AppHandle, Emitter};

pub const EVENT_TIMER_TICK: &str = "timer-tick";
pub const EVENT_WINDOWS_CHANGED: &str = "windows-changed";
pub const EVENT_TOGGLE_START: &str = "toggle-start";
pub const EVENT_SYSTEM_STATUS: &str = "system-status";

pub fn broadcast_event<T: Serialize + Clone>(app: &AppHandle, event: &str, payload: T) {
    let _ = app.emit(event, payload);
}
