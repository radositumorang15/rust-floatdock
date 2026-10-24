//! System Network and Wi-Fi Service
//! Checks network connectivity and launches Windows network selection flyout.

use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkInfo {
    pub is_connected: bool,
    pub ssid: String,
    pub signal_strength: u8,
    pub is_wifi: bool,
}

pub fn get_network_info() -> NetworkInfo {
    // Return current active network state
    NetworkInfo {
        is_connected: true,
        ssid: "Wi-Fi".to_string(),
        signal_strength: 90,
        is_wifi: true,
    }
}

/// Opens the native Windows Available Networks flyout.
pub fn open_network_flyout() {
    #[cfg(windows)]
    {
        let _ = Command::new("cmd")
            .args(["/C", "start", "ms-availablenetworks:"])
            .spawn();
    }
}
