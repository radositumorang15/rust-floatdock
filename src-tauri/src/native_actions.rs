//! Native-feel window behaviour for the dock.
//!
//! * Event-driven tracking via SetWinEventHook (foreground, minimize, create, destroy, title, cloak)
//!   -> emits "windows-changed" (debounced 100ms) so the frontend does not need to poll windows.
//! * `last_foreground()`  : last active window that is NOT owned by this app. Stays correct even when
//!   a click on the dock briefly makes the dock the foreground window.
//! * `toggle_window` / `activate_group` : Windows-taskbar click behaviour
//!   (inactive -> focus, active -> minimize, minimized -> restore, group -> cycle).
//! * `is_taskbar_window` : same visibility rules as the real taskbar.
//! * `set_no_activate`   : clicks on the dock/notch no longer steal focus from the app below.
//!
//! Cargo (windows crate) features needed in addition to the existing ones:
//!   "Win32_UI_Accessibility", "Win32_UI_WindowsAndMessaging", "Win32_System_Threading", "Win32_Foundation"

use std::sync::atomic::{AtomicBool, AtomicIsize, Ordering};
use std::time::Duration;
use tauri::{AppHandle, Emitter};

#[cfg(windows)]
use windows::Win32::{
    Foundation::HWND,
    System::Threading::{AttachThreadInput, GetCurrentThreadId},
    UI::{
        Accessibility::{SetWinEventHook, HWINEVENTHOOK},
        WindowsAndMessaging::{
            BringWindowToTop, DispatchMessageW, GetForegroundWindow, GetMessageW, GetWindow,
            GetWindowLongPtrW, GetWindowLongW, GetWindowThreadProcessId, IsIconic,
            SetForegroundWindow, SetWindowLongPtrW, ShowWindow, ShowWindowAsync, TranslateMessage,
            GWL_EXSTYLE, GW_OWNER, MSG, SW_MINIMIZE, SW_RESTORE, WS_EX_APPWINDOW,
            WS_EX_NOACTIVATE, WS_EX_TOOLWINDOW,
        },
    },
};

static LAST_FG: AtomicIsize = AtomicIsize::new(0);
static DIRTY: AtomicBool = AtomicBool::new(false);

/// Last foreground window that does not belong to this process (0 if unknown).
pub fn last_foreground() -> isize {
    LAST_FG.load(Ordering::Relaxed)
}

/* ───────────────────────── Event hooks ───────────────────────── */

// WINEVENT_OUTOFCONTEXT (0) | WINEVENT_SKIPOWNPROCESS (2)
#[cfg(windows)]
const HOOK_FLAGS: u32 = 0x0002;

#[cfg(windows)]
const EVENT_RANGES: [(u32, u32); 5] = [
    (0x0003, 0x0003), // EVENT_SYSTEM_FOREGROUND
    (0x0016, 0x0017), // EVENT_SYSTEM_MINIMIZESTART / MINIMIZEEND
    (0x8000, 0x8003), // EVENT_OBJECT_CREATE / DESTROY / SHOW / HIDE
    (0x800C, 0x800C), // EVENT_OBJECT_NAMECHANGE
    (0x8017, 0x8018), // EVENT_OBJECT_CLOAKED / UNCLOAKED (virtual desktops, UWP)
];

#[cfg(windows)]
unsafe extern "system" fn on_event(
    _hook: HWINEVENTHOOK,
    event: u32,
    hwnd: HWND,
    id_object: i32,
    _id_child: i32,
    _thread: u32,
    _time: u32,
) {
    if event == 0x0003 {
        LAST_FG.store(hwnd.0 as isize, Ordering::Relaxed);
        DIRTY.store(true, Ordering::Relaxed);
        return;
    }
    if id_object == 0 {
        // OBJID_WINDOW
        DIRTY.store(true, Ordering::Relaxed);
    }
}

/// Call once from `setup`: `native_actions::start_event_hooks(app.handle().clone());`
pub fn start_event_hooks(app: AppHandle) {
    #[cfg(windows)]
    std::thread::spawn(|| unsafe {
        for (min, max) in EVENT_RANGES {
            let _ = SetWinEventHook(min, max, None, Some(on_event), 0, 0, HOOK_FLAGS);
        }
        LAST_FG.store(GetForegroundWindow().0 as isize, Ordering::Relaxed);

        // WinEvent hooks need a message loop on the thread that installed them.
        let mut msg = MSG::default();
        while GetMessageW(&mut msg, None, 0, 0).as_bool() {
            let _ = TranslateMessage(&msg);
            let _ = DispatchMessageW(&msg);
        }
    });

    // Debounced emitter: many events (title changes, child windows) collapse into one emit.
    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_millis(100));
        if DIRTY.swap(false, Ordering::Relaxed) {
            let _ = app.emit("windows-changed", ());
        }
    });
}

/* ───────────────────────── Filter ala taskbar ───────────────────────── */

#[cfg(windows)]
pub fn is_own_window(hwnd: HWND) -> bool {
    unsafe {
        let mut pid: u32 = 0;
        GetWindowThreadProcessId(hwnd, Some(&mut pid));
        pid == std::process::id()
    }
}

/// Same rules as the Windows taskbar: skip tool windows, no-activate windows and owned
/// popups/dialogs unless they explicitly ask for a taskbar button (WS_EX_APPWINDOW).
#[cfg(windows)]
pub fn is_taskbar_window(hwnd: HWND) -> bool {
    unsafe {
        let ex = GetWindowLongW(hwnd, GWL_EXSTYLE) as u32;
        let wants_button = ex & WS_EX_APPWINDOW.0 != 0;
        if ex & WS_EX_NOACTIVATE.0 != 0 && !wants_button {
            return false;
        }
        if ex & WS_EX_TOOLWINDOW.0 != 0 && !wants_button {
            return false;
        }
        let has_owner = GetWindow(hwnd, GW_OWNER)
            .map(|o| !o.0.is_null())
            .unwrap_or(false);
        if has_owner && !wants_button {
            return false;
        }
        true
    }
}

/* ───────────────────────── Aksi jendela ───────────────────────── */

#[cfg(windows)]
fn window_is_active(hwnd: isize) -> bool {
    hwnd == last_foreground() || hwnd == unsafe { GetForegroundWindow() }.0 as isize
}

/// SetForegroundWindow is restricted by the OS foreground lock. Attaching to the current
/// foreground thread's input queue is the standard way to make it reliable.
#[cfg(windows)]
fn force_foreground(h: HWND) {
    unsafe {
        if IsIconic(h).as_bool() {
            let _ = ShowWindow(h, SW_RESTORE);
        }
        let this_thread = GetCurrentThreadId();
        let fg_thread = GetWindowThreadProcessId(GetForegroundWindow(), None);
        let attached = fg_thread != 0
            && fg_thread != this_thread
            && AttachThreadInput(this_thread, fg_thread, true).as_bool();

        let _ = BringWindowToTop(h);
        let _ = SetForegroundWindow(h);

        if attached {
            let _ = AttachThreadInput(this_thread, fg_thread, false);
        }
    }
}

/// Click on a single window's icon:
///   minimized -> restore + focus | active -> minimize | otherwise -> focus
pub fn toggle_window(hwnd: isize) -> &'static str {
    #[cfg(windows)]
    unsafe {
        let h = HWND(hwnd as *mut _);
        if IsIconic(h).as_bool() {
            force_foreground(h);
            return "restored";
        }
        if window_is_active(hwnd) {
            // Async: never blocks the dock if the target app is hung.
            let _ = ShowWindowAsync(h, SW_MINIMIZE);
            return "minimized";
        }
        force_foreground(h);
        "focused"
    }
    #[cfg(not(windows))]
    {
        let _ = hwnd;
        "unsupported"
    }
}

/// Click on an app icon that has several windows. `hwnds` should be in z-order (EnumWindows order),
/// so the first non-minimized entry is the most recently used one.
///   one window -> toggle | none active -> focus most recent | one active -> cycle to the next
pub fn activate_group(hwnds: &[isize]) -> &'static str {
    match hwnds.len() {
        0 => return "none",
        1 => return toggle_window(hwnds[0]),
        _ => {}
    }

    #[cfg(windows)]
    unsafe {
        let active = hwnds.iter().position(|&h| window_is_active(h));
        if let Some(i) = active {
            let next = hwnds[(i + 1) % hwnds.len()];
            force_foreground(HWND(next as *mut _));
            return "cycled";
        }
        let target = hwnds
            .iter()
            .copied()
            .find(|&h| !IsIconic(HWND(h as *mut _)).as_bool())
            .unwrap_or(hwnds[0]);
        force_foreground(HWND(target as *mut _));
        "focused"
    }
    #[cfg(not(windows))]
    {
        "unsupported"
    }
}

/* ───────────────────────── No-activate ───────────────────────── */

/// Apply to the dock (and notch) window right after creation. Do NOT apply to windows that
/// need keyboard input (start menu search, settings).
#[cfg(windows)]
pub fn set_no_activate(window: &tauri::WebviewWindow) {
    if let Ok(hwnd) = window.hwnd() {
        unsafe {
            let ex = GetWindowLongPtrW(hwnd, GWL_EXSTYLE);
            SetWindowLongPtrW(hwnd, GWL_EXSTYLE, ex | WS_EX_NOACTIVATE.0 as isize);
        }
    }
}

#[cfg(not(windows))]
pub fn set_no_activate(_window: &tauri::WebviewWindow) {}