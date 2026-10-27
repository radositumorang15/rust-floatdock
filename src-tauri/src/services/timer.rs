//! Countdown Reminder / Timer Service
//! Manages timer state, countdown ticks, and completion notifications (e.g. "57:12 minum").

use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimerState {
    pub label: String,
    pub total_seconds: u32,
    pub remaining_seconds: u32,
    pub is_running: bool,
    pub is_finished: bool,
    pub formatted_time: String,
}

static TIMER: Mutex<Option<TimerState>> = Mutex::new(None);

fn format_time(seconds: u32) -> String {
    let m = seconds / 60;
    let s = seconds % 60;
    format!("{:02}:{:02}", m, s)
}

pub fn init_timer() {
    let mut lock = TIMER.lock().unwrap();
    if lock.is_none() {
        let initial_seconds = 57 * 60 + 12; // 57:12 matching screenshot
        *lock = Some(TimerState {
            label: "minum".to_string(),
            total_seconds: 60 * 60,
            remaining_seconds: initial_seconds,
            is_running: true,
            is_finished: false,
            formatted_time: format_time(initial_seconds),
        });
    }
}

pub fn get_timer() -> TimerState {
    init_timer();
    let lock = TIMER.lock().unwrap();
    lock.as_ref().unwrap().clone()
}

pub fn tick_timer() -> Option<TimerState> {
    init_timer();
    let mut lock = TIMER.lock().unwrap();
    if let Some(ref mut timer) = *lock {
        if timer.is_running && timer.remaining_seconds > 0 {
            timer.remaining_seconds -= 1;
            timer.formatted_time = format_time(timer.remaining_seconds);
            if timer.remaining_seconds == 0 {
                timer.is_running = false;
                timer.is_finished = true;
            }
            return Some(timer.clone());
        }
    }
    None
}

pub fn toggle_timer() -> TimerState {
    init_timer();
    let mut lock = TIMER.lock().unwrap();
    let timer = lock.as_mut().unwrap();
    if timer.remaining_seconds == 0 || timer.is_finished {
        timer.remaining_seconds = timer.total_seconds;
        timer.formatted_time = format_time(timer.total_seconds);
        timer.is_running = true;
        timer.is_finished = false;
    } else {
        timer.is_running = !timer.is_running;
    }
    timer.clone()
}

pub fn reset_timer() -> TimerState {
    init_timer();
    let mut lock = TIMER.lock().unwrap();
    let timer = lock.as_mut().unwrap();
    timer.remaining_seconds = timer.total_seconds;
    timer.formatted_time = format_time(timer.total_seconds);
    timer.is_running = true;
    timer.is_finished = false;
    timer.clone()
}

pub fn set_timer(label: String, duration_seconds: u32) -> TimerState {
    init_timer();
    let mut lock = TIMER.lock().unwrap();
    let timer = lock.as_mut().unwrap();
    timer.label = label;
    timer.total_seconds = duration_seconds;
    timer.remaining_seconds = duration_seconds;
    timer.formatted_time = format_time(duration_seconds);
    timer.is_running = true;
    timer.is_finished = false;
    timer.clone()
}
