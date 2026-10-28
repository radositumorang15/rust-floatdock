import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

import { AppEntry, FullDockState, TrackedWindow, TimerState, MediaState } from './types';
import { ThemeConfig, ManaAttribute, MANA_PALETTES } from './themes/types';
import { THEME_DEFAULT } from './themes/presets';
import { applyThemeToCss } from './themes/applyTheme';
import { Dock } from './components/Dock/Dock';
import { StartMenu } from './components/StartMenu/StartMenu';
import { Notch } from './components/Notch/Notch';
import { SettingsModal } from './components/Settings/SettingsModal';

import './styles/tokens.css';
import './styles/glass.css';

const DEFAULT_STATE: FullDockState = {
  pinned_apps: [
    { id: 'explorer', name: 'File Explorer', exec_path: 'explorer.exe', icon_name: 'explorer', is_pinned: true, category: 'Sistem' },
    { id: 'store', name: 'Microsoft Store', exec_path: 'ms-windows-store:', icon_name: 'store', is_pinned: true, category: 'Sistem' },
    { id: 'pureref', name: 'PureRef', exec_path: 'PureRef.exe', icon_name: 'pureref', is_pinned: true, category: 'Media' },
    { id: 'creativecloud', name: 'Creative Cloud', exec_path: 'C:\\Program Files\\Adobe\\Adobe Creative Cloud\\ACC\\Creative Cloud.exe', icon_name: 'creativecloud', is_pinned: true, category: 'Desain' },
    { id: 'illustrator', name: 'Adobe Illustrator', exec_path: 'C:\\Program Files\\Adobe\\Adobe Illustrator 2026\\Support Files\\Contents\\Windows\\Illustrator.exe', icon_name: 'illustrator', is_pinned: true, category: 'Desain' },
    { id: 'cursor', name: 'Cursor', exec_path: 'C:\\Users\\tamu\\AppData\\Local\\Programs\\cursor\\Cursor.exe', icon_name: 'cursor', is_pinned: true, category: 'Pengembangan' },
    { id: 'github', name: 'GitHub Desktop', exec_path: 'C:\\Users\\tamu\\AppData\\Local\\GitHubDesktop\\GitHubDesktop.exe', icon_name: 'github', is_pinned: true, category: 'Pengembangan' },
    { id: 'antigravity', name: 'Antigravity IDE', exec_path: 'D:\\Antigravity IDE\\Antigravity IDE.exe', icon_name: 'antigravity', is_pinned: true, category: 'Pengembangan' },
    { id: 'terminal', name: 'Terminal', exec_path: 'wt.exe', icon_name: 'terminal', is_pinned: true, category: 'Sistem' },
    { id: 'chrome', name: 'Google Chrome', exec_path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', icon_name: 'chrome', is_pinned: true, category: 'Komunikasi' },
    { id: 'settings', name: 'Pengaturan', exec_path: 'ms-settings:', icon_name: 'settings', is_pinned: true, category: 'Sistem' },
  ],
  running_windows: [],
  battery: { percentage: 95, is_charging: true, is_plugged_in: true, has_battery: true },
  volume: { level: 80, is_muted: false },
  network: { is_connected: true, ssid: 'Home Wi-Fi', signal_strength: 95, is_wifi: true },
  timer: {
    label: 'minum',
    total_seconds: 3600,
    remaining_seconds: 3432,
    is_running: true,
    is_finished: false,
    formatted_time: '57:12',
  },
  media: {
    title: '',
    artist: '',
    is_playing: false,
    has_media: false,
  },
  weather: {
    temperature: 30,
    condition: 'Cerah Berawan',
    weather_code: 1,
    is_day: true,
  },
};

const globalThemeChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('floatdock-theme') : null;

export interface LaunchMods {
  shift?: boolean;
  ctrl?: boolean;
  newInstance?: boolean;
}

const HIDDEN_APPS = ['telegram'];

export const App: React.FC = () => {
  const [dockState, setDockState] = useState<FullDockState>(DEFAULT_STATE);

  const visibleState = React.useMemo(() => {
    const isHidden = (name: string, path = '') => {
      const s = `${name} ${path}`.toLowerCase();
      return HIDDEN_APPS.some((h) => s.includes(h));
    };
    return {
      ...dockState,
      pinned_apps: dockState.pinned_apps.filter((a) => !isHidden(a.name, a.exec_path)),
      running_windows: dockState.running_windows.filter((w) => !isHidden(w.app_name, w.exec_path || '')),
    };
  }, [dockState]);
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(() => {
    try {
      const saved = localStorage.getItem('floatdock_theme');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      }
    } catch {}
    return THEME_DEFAULT;
  });
  const [windowMode, setWindowMode] = useState<'dock' | 'start_menu' | 'notch' | 'settings' | 'all'>(() => {
    try {
      const hash = window.location.hash.replace('#', '').replace('/', '');
      if (hash === 'dock' || hash === 'start_menu' || hash === 'notch' || hash === 'settings') {
        return hash as any;
      }
      const appWindow = getCurrentWebviewWindow();
      if (appWindow && appWindow.label) {
        if (appWindow.label === 'dock') return 'dock';
        if (appWindow.label === 'start_menu') return 'start_menu';
        if (appWindow.label === 'notch') return 'notch';
        if (appWindow.label === 'settings') return 'settings';
      }
    } catch {}
    return 'dock';
  });
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '').replace('/', '');
    if (hash === 'dock' || hash === 'start_menu' || hash === 'notch' || hash === 'settings') {
      setWindowMode(hash as any);
      return;
    }

    try {
      const appWindow = getCurrentWebviewWindow();
      if (appWindow && appWindow.label) {
        if (appWindow.label === 'dock') setWindowMode('dock');
        else if (appWindow.label === 'start_menu') setWindowMode('start_menu');
        else if (appWindow.label === 'notch') setWindowMode('notch');
        else if (appWindow.label === 'settings') setWindowMode('settings');
      }
    } catch {
      setWindowMode('dock');
    }
  }, []);

  // Listen to cross-window theme changes across BroadcastChannel, localStorage, and Tauri IPC
  useEffect(() => {
    applyThemeToCss(currentTheme);

    const onChannelMsg = (event: MessageEvent) => {
      if (event.data && event.data.id) {
        setCurrentTheme(event.data);
        applyThemeToCss(event.data);
      }
    };
    globalThemeChannel?.addEventListener('message', onChannelMsg);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'floatdock_theme' && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          if (parsed && parsed.id) {
            setCurrentTheme(parsed);
            applyThemeToCss(parsed);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    let unlistenTheme: (() => void) | undefined;
    listen<ThemeConfig>('theme-changed', (event) => {
      if (event.payload && event.payload.id) {
        setCurrentTheme(event.payload);
        applyThemeToCss(event.payload);
        try {
          localStorage.setItem('floatdock_theme', JSON.stringify(event.payload));
        } catch {}
      }
    }).then((unsub) => {
      unlistenTheme = unsub;
    }).catch(() => {});

    return () => {
      globalThemeChannel?.removeEventListener('message', onChannelMsg);
      window.removeEventListener('storage', handleStorage);
      if (unlistenTheme) unlistenTheme();
    };
  }, []);

  const refreshState = useCallback(async () => {
    try {
      const state = await invoke<FullDockState>('get_full_dock_state');
      setDockState((prev) => {
        const samePinned =
          prev.pinned_apps.length === state.pinned_apps.length &&
          prev.pinned_apps.every(
            (p, i) =>
              p.id === state.pinned_apps[i]?.id &&
              p.icon_url === state.pinned_apps[i]?.icon_url
          );

        const sameWindows =
          prev.running_windows.length === state.running_windows.length &&
          prev.running_windows.every(
            (pw, i) =>
              pw.hwnd === state.running_windows[i]?.hwnd &&
              pw.title === state.running_windows[i]?.title &&
              pw.is_minimized === state.running_windows[i]?.is_minimized &&
              pw.is_active === state.running_windows[i]?.is_active &&
              pw.profile_name === state.running_windows[i]?.profile_name
          );

        const sameMedia =
          prev.media?.title === state.media?.title &&
          prev.media?.artist === state.media?.artist &&
          prev.media?.is_playing === state.media?.is_playing &&
          prev.media?.has_media === state.media?.has_media;

        if (
          samePinned &&
          sameWindows &&
          sameMedia &&
          prev.battery.percentage === state.battery.percentage &&
          prev.volume.level === state.volume.level &&
          prev.network.is_connected === state.network.is_connected
        ) {
          return prev;
        }
        return state;
      });
    } catch (err) {
      console.error('Failed to get full dock state:', err);
    }
  }, []);

  useEffect(() => {
    refreshState();

    let unlistenTimer: (() => void) | undefined;
    listen<TimerState>('timer-tick', (event) => {
      setDockState((prev) => {
        if (
          prev.timer.remaining_seconds === event.payload.remaining_seconds &&
          prev.timer.is_running === event.payload.is_running &&
          prev.timer.is_finished === event.payload.is_finished
        ) {
          return prev;
        }
        return {
          ...prev,
          timer: event.payload,
        };
      });
    }).then((unsub) => {
      unlistenTimer = unsub;
    }).catch(() => {});

    let unlistenMedia: (() => void) | undefined;
    listen<MediaState>('media-updated', (event) => {
      setDockState((prev) => {
        if (
          prev.media?.title === event.payload.title &&
          prev.media?.artist === event.payload.artist &&
          prev.media?.is_playing === event.payload.is_playing &&
          prev.media?.has_media === event.payload.has_media
        ) {
          return prev;
        }
        return {
          ...prev,
          media: event.payload,
        };
      });
    }).then((unsub) => {
      unlistenMedia = unsub;
    }).catch(() => {});

    let t: number | undefined;
    let unlistenWin: (() => void) | undefined;
    let disposed = false;

    listen("windows-changed", () => {
      clearTimeout(t);
      t = window.setTimeout(refreshState, 60);
    })
      .then((un) => (disposed ? un() : (unlistenWin = un)))
      .catch(() => {});

    const interval = setInterval(refreshState, 2000);

    return () => {
      disposed = true;
      clearTimeout(t);
      clearInterval(interval);
      if (unlistenTimer) unlistenTimer();
      if (unlistenMedia) unlistenMedia();
      if (unlistenWin) unlistenWin();
    };
  }, [refreshState]);

  // Theme & Mana switching with multi-channel broadcast
  const handleThemeChange = (newTheme: ThemeConfig) => {
    setCurrentTheme(newTheme);
    applyThemeToCss(newTheme);
    try {
      localStorage.setItem('floatdock_theme', JSON.stringify(newTheme));
      window.dispatchEvent(new Event('storage'));
    } catch {}

    // 1. BroadcastChannel to all webviews
    try {
      globalThemeChannel?.postMessage(newTheme);
    } catch {}

    // 2. Tauri IPC Global Broadcast to all windows
    invoke('broadcast_theme', { theme: newTheme }).catch(() => {});
  };

  const handleManaChange = (attr: ManaAttribute) => {
    const pal = MANA_PALETTES[attr];
    const updated: ThemeConfig = {
      ...currentTheme,
      manaAttribute: attr,
      accent: pal.color,
      glow: {
        ...currentTheme.glow,
        color: pal.auraColor,
      },
    };
    setCurrentTheme(updated);
    applyThemeToCss(updated);
    try {
      localStorage.setItem('floatdock_theme', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch {}

    try {
      globalThemeChannel?.postMessage(updated);
    } catch {}

    invoke('broadcast_theme', { theme: updated }).catch(() => {});
  };

  // Actions
  const handleToggleStartMenu = async () => {
    try {
      await invoke('open_native_start');
    } catch {
      setStartMenuOpen((prev) => !prev);
    }
  };

  const handleOpenSettings = async () => {
    try {
      await invoke('toggle_settings');
    } catch {
      setSettingsOpen(true);
    }
  };

  const handleLaunchApp = async (
    app: AppEntry,
    running?: TrackedWindow,
    mods: LaunchMods = {}
  ) => {
    if (app.id === 'settings') {
      handleOpenSettings();
      return;
    }

    if (mods.ctrl && mods.shift) {
      return handleLaunchAdmin(app.exec_path);
    }

    if (!mods.shift && !mods.newInstance && running) {
      return invoke('toggle_window', { hwnd: running.hwnd }).catch(() => {});
    }

    try {
      await invoke('launch_app', { target: app.exec_path });
    } catch (e) {
      console.log('Launch app fallback:', app.name, e);
    }
  };

  const handleLaunchAdmin = async (target: string) => {
    try {
      await invoke('launch_as_admin', { target });
    } catch (e) {
      console.log('Launch admin fallback:', target, e);
    }
  };

  const handleCloseWindow = async (hwnd: number) => {
    try {
      await invoke('close_window', { hwnd });
      refreshState();
    } catch (e) {
      console.log('Close window fallback:', hwnd, e);
    }
  };

  const handleToggleTimer = async () => {
    try {
      const updated = await invoke<TimerState>('toggle_timer');
      setDockState((prev) => ({ ...prev, timer: updated }));
    } catch {
      setDockState((prev) => ({
        ...prev,
        timer: {
          ...prev.timer,
          is_running: !prev.timer.is_running,
        },
      }));
    }
  };

  const handleResetTimer = async () => {
    try {
      const updated = await invoke<TimerState>('reset_timer');
      setDockState((prev) => ({ ...prev, timer: updated }));
    } catch {
      setDockState((prev) => ({
        ...prev,
        timer: {
          ...prev.timer,
          remaining_seconds: prev.timer.total_seconds,
          formatted_time: '60:00',
          is_running: true,
          is_finished: false,
        },
      }));
    }
  };

  const handleStepVolume = async (delta: number) => {
    try {
      const updated = await invoke<any>('step_volume', { delta });
      setDockState((prev) => ({ ...prev, volume: updated }));
    } catch {
      setDockState((prev) => ({
        ...prev,
        volume: {
          ...prev.volume,
          level: Math.max(0, Math.min(100, prev.volume.level + delta)),
        },
      }));
    }
  };

  const handleToggleMute = async () => {
    try {
      const updated = await invoke<any>('toggle_volume_mute');
      setDockState((prev) => ({ ...prev, volume: updated }));
    } catch {
      setDockState((prev) => ({
        ...prev,
        volume: {
          ...prev.volume,
          is_muted: !prev.volume.is_muted,
        },
      }));
    }
  };

  const handleOpenNetwork = async () => {
    try {
      await invoke('open_quick_settings');
    } catch {
      await invoke('open_network_flyout').catch(() => {});
    }
  };

  const handlePowerAction = async (action: string) => {
    try {
      await invoke('power_action', { action });
    } catch (e) {
      console.log('Power action:', action, e);
    }
  };

  const handleResizeNotch = async (width: number, height: number) => {
    try {
      await invoke('resize_notch', { width, height });
    } catch {}
  };

  const handleToggleTaskbar = async (hide: boolean) => {
    try {
      await invoke('toggle_taskbar_visibility', { hide });
    } catch {}
  };

  // 1. Single Window: DOCK
  if (windowMode === 'dock') {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: '14px',
          pointerEvents: 'none',
          background: 'transparent',
        }}
      >
        <Dock
          state={visibleState}
          theme={currentTheme}
          onToggleStartMenu={handleToggleStartMenu}
          onLaunchApp={handleLaunchApp}
          onLaunchAdmin={handleLaunchAdmin}
          onCloseWindow={handleCloseWindow}
          onToggleTimer={handleToggleTimer}
          onResetTimer={handleResetTimer}
          onOpenNetwork={handleOpenNetwork}
          onStepVolume={handleStepVolume}
          onToggleMute={handleToggleMute}
          onOpenSettings={handleOpenSettings}
          onThemeChange={handleThemeChange}
          onManaChange={handleManaChange}
        />
      </div>
    );
  }

  // 2. Single Window: START MENU
  if (windowMode === 'start_menu') {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <StartMenu
          apps={dockState.pinned_apps}
          theme={currentTheme}
          onLaunchApp={handleLaunchApp}
          onPowerAction={handlePowerAction}
          onClose={handleToggleStartMenu}
          onOpenSettings={handleOpenSettings}
        />
      </div>
    );
  }

  // 3. Single Window: NOTCH
  if (windowMode === 'notch') {
    return (
      <Notch
        timer={dockState.timer}
        media={dockState.media}
        theme={currentTheme}
        onTogglePlayback={() => invoke('toggle_media_playback').catch(() => {})}
        onResize={handleResizeNotch}
      />
    );
  }

  // 4. Single Window: SETTINGS
  if (windowMode === 'settings') {
    return (
      <SettingsModal
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        onManaChange={handleManaChange}
        onToggleTaskbar={handleToggleTaskbar}
        onClose={() => invoke('toggle_settings').catch(() => {})}
      />
    );
  }

  // 5. Desktop Simulator Mode
  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: `
          linear-gradient(rgba(10, 20, 40, 0.2), rgba(10, 20, 40, 0.4)),
          url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2560&q=80') center/cover no-repeat
        `,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Top Center: Notch Island */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 100 }}>
        <Notch
          timer={dockState.timer}
          media={dockState.media}
          theme={currentTheme}
        />
      </div>

      {/* Bottom Center Area: Dock and Left-Aligned Start Menu */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          zIndex: 80,
          pointerEvents: 'none',
        }}
      >
        {/* Start Menu (Rata kiri dengan dock, jarak 12px di atas dock, tinggi 448px) */}
        {startMenuOpen && (
          <div
            style={{
              marginBottom: '12px',
              zIndex: 90,
              pointerEvents: 'auto',
            }}
          >
            <StartMenu
              apps={dockState.pinned_apps}
              theme={currentTheme}
              onLaunchApp={handleLaunchApp}
              onPowerAction={handlePowerAction}
              onClose={() => setStartMenuOpen(false)}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          </div>
        )}

        {/* Floating Glass Dock */}
        <div style={{ pointerEvents: 'auto' }}>
          <Dock
            state={visibleState}
            theme={currentTheme}
            onToggleStartMenu={handleToggleStartMenu}
            onLaunchApp={handleLaunchApp}
            onLaunchAdmin={handleLaunchAdmin}
            onCloseWindow={handleCloseWindow}
            onToggleTimer={handleToggleTimer}
            onResetTimer={handleResetTimer}
            onOpenNetwork={handleOpenNetwork}
            onStepVolume={handleStepVolume}
            onToggleMute={handleToggleMute}
            onOpenSettings={() => setSettingsOpen(true)}
            onThemeChange={handleThemeChange}
            onManaChange={handleManaChange}
          />
        </div>
      </div>

      {/* Settings Modal */}
      {settingsOpen && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 200 }}>
          <SettingsModal
            currentTheme={currentTheme}
            onThemeChange={handleThemeChange}
            onManaChange={handleManaChange}
            onClose={() => setSettingsOpen(false)}
            onToggleTaskbar={handleToggleTaskbar}
          />
        </div>
      )}
    </div>
  );
};

export default App;
