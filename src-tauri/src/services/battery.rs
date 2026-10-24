//! System Battery Service
//! Queries current battery percentage, charging state, and power status.

use serde::{Deserialize, Serialize};

#[cfg(windows)]
use windows::Win32::System::Power::{GetSystemPowerStatus, SYSTEM_POWER_STATUS};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatteryInfo {
    pub percentage: u8,
    pub is_charging: bool,
    pub is_plugged_in: bool,
    pub has_battery: bool,
}

pub fn get_battery_info() -> BatteryInfo {
    #[cfg(windows)]
    unsafe {
        let mut status = SYSTEM_POWER_STATUS::default();
        if GetSystemPowerStatus(&mut status).is_ok() {
            let percentage = if status.BatteryLifePercent <= 100 {
                status.BatteryLifePercent
            } else {
                100
            };
            // ACLineStatus: 0 = Offline, 1 = Online, 255 = Unknown
            let is_plugged_in = status.ACLineStatus == 1;
            // BatteryFlag: 8 = Charging
            let is_charging = (status.BatteryFlag & 8) != 0 || (is_plugged_in && percentage < 100);
            let has_battery = status.BatteryFlag != 128 && status.BatteryFlag != 255;

            return BatteryInfo {
                percentage,
                is_charging,
                is_plugged_in,
                has_battery,
            };
        }
    }

    BatteryInfo {
        percentage: 100,
        is_charging: false,
        is_plugged_in: true,
        has_battery: true,
    }
}
