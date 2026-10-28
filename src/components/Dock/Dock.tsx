import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, LayoutGrid, Bell } from 'lucide-react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { AppEntry, FullDockState, TrackedWindow, ContextMenuState, ContextMenuItem, SystemPulse, WindowInstance } from '../../types';
import { Windows11Logo } from '../common/AppIcons';
import { GeometricClover } from '../common/CloverIcon';
import { ManaParticles } from '../common/ManaParticles';
import { ThemeConfig, ManaAttribute } from '../../themes/types';
import { AVAILABLE_THEMES } from '../../themes/presets';
import { TrayArea } from './TrayIcon';
import { ContextMenu } from '../common/ContextMenu';
import { SortableDockList, DockItemData } from './SortableDockList';

interface DockProps {
  state: FullDockState;
  theme?: ThemeConfig;
  onToggleStartMenu: () => void;
  onLaunchApp: (app: AppEntry, running?: TrackedWindow) => void;
  onLaunchAdmin: (target: string) => void;
  onCloseWindow: (hwnd: number) => void;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onOpenNetwork: () => void;
  onStepVolume: (delta: number) => void;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onThemeChange?: (theme: ThemeConfig) => void;
  onManaChange?: (mana: ManaAttribute) => void;
}

export const Dock: React.FC<DockProps> = ({
  state,
  theme,
  onToggleStartMenu,
  onLaunchApp,
  onLaunchAdmin,
  onCloseWindow,
  onToggleTimer: _onToggleTimer,
  onResetTimer: _onResetTimer,
  onOpenNetwork,
  onStepVolume,
  onToggleMute,
  onOpenSettings,
  onThemeChange,
  onManaChange,
}) => {
  const [mouseRelativeX, setMouseRelativeX] = useState<number | null>(null);
  const iconStripRef = useRef<HTMLDivElement>(null);

  // Video Background Configuration (Asta Demon Black Clover)
  const [videoBgEnabled, setVideoBgEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('dock_video_bg');
    return saved !== null ? saved === 'true' : true; // Default ON
  });
  const [videoOpacity, setVideoOpacity] = useState<number>(() => {
    const saved = localStorage.getItem('dock_video_opacity');
    return saved ? parseFloat(saved) : 0.40;
  });
  const [videoBlend, setVideoBlend] = useState<'screen' | 'overlay' | 'normal'>(() => {
    const saved = localStorage.getItem('dock_video_blend');
    return (saved as any) || 'screen';
  });

  const toggleVideoBg = () => {
    setVideoBgEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('dock_video_bg', String(next));
      window.dispatchEvent(new Event('storage'));
      return next;
    });
  };

  const cycleOpacity = () => {
    const options = [0.25, 0.45, 0.65];
    setVideoOpacity((curr) => {
      const idx = options.findIndex((v) => Math.abs(v - curr) < 0.05);
      const next = options[(idx + 1) % options.length];
      localStorage.setItem('dock_video_opacity', String(next));
      return next;
    });
  };

  const cycleBlend = () => {
    const modes: ('screen' | 'overlay' | 'normal')[] = ['screen', 'overlay', 'normal'];
    setVideoBlend((curr) => {
      const idx = modes.indexOf(curr);
      const next = modes[(idx + 1) % modes.length];
      localStorage.setItem('dock_video_blend', next);
      return next;
    });
  };

  useEffect(() => {
    const handleStorage = () => {
      const savedBg = localStorage.getItem('dock_video_bg');
      if (savedBg !== null) setVideoBgEnabled(savedBg === 'true');
      const savedOp = localStorage.getItem('dock_video_opacity');
      if (savedOp) setVideoOpacity(parseFloat(savedOp));
      const savedBlend = localStorage.getItem('dock_video_blend');
      if (savedBlend) setVideoBlend(savedBlend as any);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Smart Intellihide & Telemetry state with local hover protection and smooth grace period
  const [pulse, setPulse] = useState<SystemPulse | null>(null);
  const [isDockHovered, setIsDockHovered] = useState(false);
  const hideTimerRef = useRef<number | null>(null);
  const [debouncedHidden, setDebouncedHidden] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listen<SystemPulse>('system-pulse', (event) => {
      setPulse(event.payload);
    }).then((unsub) => {
      unlisten = unsub;
    }).catch(() => {});

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const [autoHideEnabled, setAutoHideEnabled] = useState<boolean>(() => {
    return localStorage.getItem('floatdock_autohide') === 'true';
  });

  useEffect(() => {
    const handleStorage = () => {
      setAutoHideEnabled(localStorage.getItem('floatdock_autohide') === 'true');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const shouldHide = Boolean(
    autoHideEnabled && pulse?.should_autohide_dock && !pulse?.cursor_near_bottom && !isDockHovered
  );

  useEffect(() => {
    if (!shouldHide) {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      setDebouncedHidden(false);
    } else {
      if (!hideTimerRef.current) {
        hideTimerRef.current = window.setTimeout(() => {
          setDebouncedHidden(true);
          hideTimerRef.current = null;
        }, 500); // 500ms delay so moving cursor to tab or icons never hides
      }
    }
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [shouldHide]);

  // Convert pinned_apps & running_windows into SortableDockList items with multi-window tracking
  const dockItems: DockItemData[] = useMemo(() => {
    const list: DockItemData[] = [];
    const assignedHwnds = new Set<number>();

    // 1. Pinned Apps
    state.pinned_apps.forEach((app) => {
      const isPinnedChrome =
        app.id === 'chrome' ||
        app.name.toLowerCase().includes('chrome') ||
        app.exec_path.toLowerCase().includes('chrome.exe');

      let resolvedIconUrl = app.icon_url;
      const matchingWins: WindowInstance[] = state.running_windows
        .filter((w) => {
          if (assignedHwnds.has(w.hwnd)) return false;

          // If pinned Chrome: match any window belonging to Chrome
          if (isPinnedChrome) {
            const isWinChrome =
              w.app_name.toLowerCase().includes('chrome') ||
              w.title.toLowerCase().includes('google chrome') ||
              (w.exec_path && w.exec_path.toLowerCase().includes('chrome.exe'));

            if (isWinChrome && !resolvedIconUrl && w.icon_url) {
              resolvedIconUrl = w.icon_url;
            }
            return Boolean(isWinChrome);
          }

          const appStem = app.name.toLowerCase().replace(/\.exe|\.lnk/g, '').trim();
          const winStem = (w.app_name || '').toLowerCase().replace(/\.exe/g, '').trim();
          const winTitle = (w.title || '').toLowerCase();
          const appExec = (app.exec_path || '').toLowerCase();
          const winExec = (w.exec_path || '').toLowerCase();

          const appExeName = appExec.split(/[\\/]/).pop()?.replace(/\.lnk/g, '') || '';
          const winExeName = winExec.split(/[\\/]/).pop() || '';

          const exeMatch = Boolean(winExeName && (appExeName.includes(winExeName) || winExeName.includes(appExeName)));
          const nameMatch = Boolean(winStem && (appStem.includes(winStem) || winStem.includes(appStem)));
          const titleMatch = Boolean(appStem.length >= 3 && winTitle.includes(appStem));
          const iconMatch = Boolean(
            app.icon_name && app.icon_name !== 'default' && (
              winStem.includes(app.icon_name) || winTitle.includes(app.icon_name) || winExeName.includes(app.icon_name)
            )
          );

          const matches = exeMatch || nameMatch || titleMatch || iconMatch;
          if (matches && !resolvedIconUrl && w.icon_url) {
            resolvedIconUrl = w.icon_url;
          }
          return matches;
        })
        .map((w) => {
          assignedHwnds.add(w.hwnd);
          return {
            hwnd: w.hwnd,
            title: w.title,
            is_minimized: w.is_minimized,
            profile_name: w.profile_name,
          };
        });

      list.push({
        id: app.id,
        name: app.name,
        execPath: app.exec_path,
        iconName: app.icon_name,
        iconUrl: resolvedIconUrl,
        isPinned: true,
        windows: matchingWins,
      });
    });

    // 2. Unpinned Running Windows (group by app or Chrome profile)
    const groupedRunning = new Map<string, {
      id: string;
      name: string;
      execPath: string;
      iconName: string;
      iconUrl?: string;
      profileBadge?: string;
      windows: WindowInstance[];
    }>();

    state.running_windows.forEach((win) => {
      if (assignedHwnds.has(win.hwnd)) return;

      const isWinChrome =
        win.app_name.toLowerCase().includes('chrome') ||
        win.title.toLowerCase().includes('google chrome') ||
        (win.exec_path && win.exec_path.toLowerCase().includes('chrome.exe'));

      let groupKey: string;
      let displayName: string;
      let iconName = 'default';
      let profileBadge: string | undefined = undefined;

      if (isWinChrome && win.profile_name) {
        groupKey = `chrome_profile_${win.profile_name.toLowerCase()}`;
        displayName = `Chrome (${win.profile_name})`;
        profileBadge = win.profile_name;
        iconName = 'chrome';
      } else {
        const lowerName = (win.app_name + ' ' + win.title).toLowerCase();
        if (lowerName.includes('gemini')) { iconName = 'gemini'; displayName = 'Gemini'; }
        else if (lowerName.includes('chatgpt')) { iconName = 'chatgpt'; displayName = 'ChatGPT'; }
        else if (lowerName.includes('snipping') || lowerName.includes('snip')) { iconName = 'snipping_tool'; displayName = 'Snipping Tool'; }
        else if (lowerName.includes('calc')) { iconName = 'calc'; displayName = 'Calculator'; }
        else if (lowerName.includes('chrome')) { iconName = 'chrome'; displayName = 'Google Chrome'; }
        else if (lowerName.includes('code') || lowerName.includes('vscode')) { iconName = 'vscode'; displayName = 'VS Code'; }
        else if (lowerName.includes('antigravity')) { iconName = 'antigravity'; displayName = 'Antigravity IDE'; }
        else if (lowerName.includes('spotify') || lowerName.includes('music')) { iconName = 'music'; displayName = 'Spotify'; }
        else if (lowerName.includes('discord')) { iconName = 'discord'; displayName = 'Discord'; }
        else if (lowerName.includes('telegram')) { iconName = 'telegram'; displayName = 'Telegram'; }
        else if (lowerName.includes('brave')) { iconName = 'brave'; displayName = 'Brave'; }
        else if (lowerName.includes('edge')) { iconName = 'edge'; displayName = 'Microsoft Edge'; }
        else if (lowerName.includes('terminal') || lowerName.includes('cmd') || lowerName.includes('wt')) { iconName = 'terminal'; displayName = 'Terminal'; }
        else {
          displayName = win.app_name.replace('.exe', '');
        }
        groupKey = `app_${displayName.toLowerCase()}`;
      }

      if (!groupedRunning.has(groupKey)) {
        groupedRunning.set(groupKey, {
          id: `running_${groupKey}`,
          name: displayName,
          execPath: win.exec_path || '',
          iconName,
          iconUrl: win.icon_url,
          profileBadge,
          windows: [],
        });
      }

      groupedRunning.get(groupKey)!.windows.push({
        hwnd: win.hwnd,
        title: win.title,
        is_minimized: win.is_minimized,
        profile_name: win.profile_name,
      });
      assignedHwnds.add(win.hwnd);
    });

    groupedRunning.forEach((item) => {
      list.push({
        id: item.id,
        name: item.name,
        execPath: item.execPath,
        iconName: item.iconName,
        iconUrl: item.iconUrl,
        profileBadge: item.profileBadge,
        isPinned: false,
        windows: item.windows,
      });
    });

    return list;
  }, [state.pinned_apps, state.running_windows]);

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    x: 0,
    y: 0,
    visible: false,
    items: [],
  });

  const [previewOpen, setPreviewOpen] = useState(false);
  const isExpanded = Boolean(previewOpen || contextMenu.visible);

  useEffect(() => {
    let timeout: number | undefined;
    if (isExpanded) {
      invoke('resize_dock', { expanded: true, hidden: debouncedHidden }).catch(() => {});
    } else {
      timeout = window.setTimeout(() => {
        invoke('resize_dock', { expanded: false, hidden: debouncedHidden }).catch(() => {});
      }, 200);
    }
    return () => clearTimeout(timeout);
  }, [isExpanded, debouncedHidden]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (iconStripRef.current) {
      const rect = iconStripRef.current.getBoundingClientRect();
      setMouseRelativeX(e.clientX - rect.left);
    }
  };

  const handleMouseLeave = () => {
    setMouseRelativeX(null);
  };

  const handleDockContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const items: ContextMenuItem[] = [
      {
        label: '⚙️ Pengaturan Float Dock...',
        action: onOpenSettings,
      },
      {
        label: '🌿 Tema: Grimoire Verdant (New Taskbar)',
        action: () => onThemeChange?.(AVAILABLE_THEMES[0]),
      },
      {
        label: '🌸 Tema: Light Pastel Glass (Reference)',
        action: () => onThemeChange?.(AVAILABLE_THEMES[1]),
      },
      {
        label: '💧 Tema: Liquid Glass (Apple)',
        action: () => onThemeChange?.(AVAILABLE_THEMES[2]),
      },
      {
        label: '💎 Tema: Crystal Clear (Transparan)',
        action: () => onThemeChange?.(AVAILABLE_THEMES[3]),
      },
      {
        label: '🌑 Tema: Obsidian Dark (Kaca Gelap)',
        action: () => onThemeChange?.(AVAILABLE_THEMES[4]),
      },
    ];

    if ((theme?.id === 'grimoire' || theme?.id === 'grimoire-verdant') && onManaChange) {
      items.push(
        { label: '---', action: () => {} },
        { label: '🍃 Mana: Angin (Wind)', action: () => onManaChange('wind') },
        { label: '🔥 Mana: Api (Fire)', action: () => onManaChange('fire') },
        { label: '💧 Mana: Air (Water)', action: () => onManaChange('water') },
        { label: '🌍 Mana: Bumi (Earth)', action: () => onManaChange('earth') },
        { label: '⚡ Mana: Cahaya (Light)', action: () => onManaChange('light') },
        { label: '🔮 Mana: Kegelapan (Dark)', action: () => onManaChange('dark') },
      );
    }

    // Video Background controls
    items.push(
      { label: '---', action: () => {} },
      {
        label: videoBgEnabled ? '🎬 Video Asta Background: [ON]' : '🎬 Video Asta Background: [OFF]',
        action: toggleVideoBg,
      },
      {
        label: `✨ Mode Blend: [${videoBlend.toUpperCase()}]`,
        action: cycleBlend,
      },
      {
        label: `🔆 Opacity: [${Math.round(videoOpacity * 100)}%]`,
        action: cycleOpacity,
      }
    );

    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 220),
      y: Math.max(e.clientY - (items.length * 28 + 24), 10),
      visible: true,
      items,
    });
  };

  const handleItemContextMenu = (
    e: React.MouseEvent,
    app: AppEntry,
    running?: TrackedWindow
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const items: ContextMenuItem[] = [];

    if (app.id === 'settings') {
      items.push(
        {
          label: '⚙️ Pengaturan Float Dock & Tema',
          action: onOpenSettings,
        },
        {
          label: '🪟 Buka Pengaturan Windows',
          action: () => onLaunchApp(app, running),
        }
      );
    } else {
      items.push(
        {
          label: `Buka ${app.name}`,
          action: () => onLaunchApp(app, running),
        },
        {
          label: 'Jalankan sebagai administrator',
          action: () => onLaunchAdmin(app.exec_path),
        }
      );

      if (app.exec_path && app.exec_path.length > 3) {
        items.push({
          label: '📂 Buka Lokasi File',
          action: () => invoke('reveal_shelf_file', { path: app.exec_path }).catch(() => {}),
        });
      }
    }

    if (running) {
      items.push({
        label: 'Tutup jendela',
        action: () => onCloseWindow(running.hwnd),
        danger: true,
      });
    }

    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 180),
      y: Math.max(e.clientY - 120, 10),
      visible: true,
      items,
    });
  };

  const accentColor = theme?.accent || 'var(--accent)';
  const isGrimoire = theme?.id === 'grimoire' || theme?.id === 'grimoire-verdant';
  const isLight = theme?.mode === 'light';
  const isVideoAllowed = videoBgEnabled;

  const tintStart = theme?.tints?.start || 'var(--tint-start)';
  const tintApps = theme?.tints?.apps || 'var(--tint-apps)';
  const tintInfo = theme?.tints?.info || 'var(--tint-info)';
  const tintSystem = theme?.tints?.system || 'var(--tint-system)';
  const tintNotify = theme?.tints?.notify || 'var(--tint-notify)';

  return (
    <div
      className="segmented-dock-container"
      onMouseEnter={() => setIsDockHovered(true)}
      onMouseLeave={() => setIsDockHovered(false)}
      style={{
        transform: debouncedHidden ? 'translateY(84px)' : 'translateY(0)',
        transition: 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1), opacity 240ms ease',
        opacity: debouncedHidden ? 0 : 1,
      }}
    >
      {/* ========================================================
          SEGMENT 1: START BUTTON TILE (52x52)
          ======================================================== */}
      <div
        onClick={onToggleStartMenu}
        onContextMenu={handleDockContextMenu}
        className="glass-segment-start"
        title="Buka Start Menu (Klik Kanan: Ganti Tema & Video Background)"
        style={{
          background: tintStart,
          borderColor: isGrimoire ? accentColor : (isLight ? 'rgba(0,0,0,0.14)' : 'var(--glass-border)'),
          boxShadow: isGrimoire
            ? `0 0 16px ${theme?.glow?.color || 'var(--glow)'}, var(--glass-shadow)`
            : 'var(--glass-shadow)',
        }}
      >
        <div className="dock-glass-bg-layer">
          <div className="dock-glass-bg-overlay" style={{ background: tintStart }} />
          {isVideoAllowed && (
            <video
              src="./asta-demon.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="dock-glass-bg-video"
              style={{
                opacity: videoOpacity,
                mixBlendMode: videoBlend,
                objectPosition: '20% 30%',
              }}
            />
          )}
        </div>
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isGrimoire && theme?.startMenu?.cloverMotif ? (
            <GeometricClover size={22} color={accentColor} />
          ) : (
            <Windows11Logo size={22} color={isLight ? '#0F172A' : '#FFFFFF'} />
          )}
        </div>
      </div>

      {/* ========================================================
          SEGMENT 2: MAIN APPS + TOOLS + NOTIFICATION ISLAND (Height 60px)
          ======================================================== */}
      <div
        className="glass-segment glass-segment-apps"
        onContextMenu={handleDockContextMenu}
        style={{
          background: `linear-gradient(90deg, ${tintApps} 0%, ${tintInfo} 65%, ${tintNotify} 100%)`,
          borderColor: isGrimoire ? accentColor : (isLight ? 'rgba(0,0,0,0.14)' : 'var(--glass-border)'),
          boxShadow: isGrimoire
            ? `0 0 20px ${theme?.glow?.color || 'var(--glow)'}, var(--glass-shadow)`
            : 'var(--glass-shadow)',
        }}
      >
        {/* Background Layer with Video Backdrop */}
        <div className="dock-glass-bg-layer">
          <div
            className="dock-glass-bg-overlay"
            style={{
              background: `linear-gradient(90deg, ${tintApps} 0%, ${tintInfo} 60%, ${tintNotify} 100%)`,
            }}
          />
          {isVideoAllowed && (
            <video
              src="./asta-demon.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="dock-glass-bg-video"
              style={{
                opacity: videoOpacity,
                mixBlendMode: videoBlend,
                objectPosition: 'center 40%',
                filter: 'saturate(1.3) contrast(1.15) brightness(0.95)',
              }}
            />
          )}
        </div>

        {/* Foreground Content Layer */}
        <div className="dock-glass-content-layer">
        {/* Mana Particles effect (if active in theme) */}
        {theme?.particles?.enabled && (
          <ManaParticles
            active={mouseRelativeX !== null}
            color={accentColor}
            cursorX={mouseRelativeX !== null ? mouseRelativeX : null}
          />
        )}

        {/* 1. App Icons Strip with Drag-and-Drop Reorder & Multi-Window Previews */}
        <div
          ref={iconStripRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <SortableDockList
            items={dockItems}
            theme={theme}
            accentColor={accentColor}
            onPreviewHoverChange={(open) => {
              setPreviewOpen(open);
              setIsDockHovered(open);
            }}
            onFocusWindow={(hwnd) => invoke('focus_window', { hwnd }).catch(() => {})}
            onCloseWindow={(hwnd) => onCloseWindow(hwnd)}
            onLaunchApp={(item) =>
              onLaunchApp({
                id: item.id,
                name: item.name,
                exec_path: item.execPath,
                icon_name: item.iconName,
                is_pinned: item.isPinned,
                category: 'Applications',
              })
            }
            onContextMenu={(e, item) =>
              handleItemContextMenu(
                e,
                {
                  id: item.id,
                  name: item.name,
                  exec_path: item.execPath,
                  icon_name: item.iconName,
                  is_pinned: item.isPinned,
                  category: 'Applications',
                },
                item.windows[0]
                  ? ({
                      hwnd: item.windows[0].hwnd,
                      title: item.windows[0].title,
                      process_id: 0,
                      app_name: item.name,
                      is_active: false,
                      is_minimized: item.windows[0].is_minimized,
                    } as TrackedWindow)
                  : undefined
              )
            }
          />
        </div>

        {/* 2. Thin Glass Divider */}
        <div
          style={{
            width: '1px',
            height: '24px',
            background: 'rgba(255, 255, 255, 0.22)',
            margin: '0 4px',
          }}
        />

        {/* 3. Quick Action Tools (Search, TaskView, Bell, Telegram) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Search Icon */}
          <div
            onClick={onToggleStartMenu}
            className="quick-tool-btn"
            title="Cari aplikasi dan file"
          >
            <Search size={16} />
          </div>

          {/* Task View Icon */}
          <div
            onClick={() => invoke('open_task_view').catch(() => {})}
            className="quick-tool-btn"
            title="Tampilan Tugas (Task View - Win+Tab)"
          >
            <LayoutGrid size={16} />
          </div>

          {/* Notification Bell */}
          <div
            onClick={() => invoke('open_notification_center').catch(() => {})}
            className="quick-tool-btn"
            title="Pusat Pemberitahuan & Kalender (Win+N)"
          >
            <Bell size={16} />
          </div>
        </div>
        </div>
      </div>

      {/* ========================================================
          SEGMENT 3: SYSTEM TRAY & CLOCK ISLAND (Height 60px)
          ======================================================== */}
      <div
        className="glass-segment glass-segment-system"
        onContextMenu={handleDockContextMenu}
        style={{
          background: tintSystem,
          borderColor: isGrimoire ? accentColor : (isLight ? 'rgba(0,0,0,0.14)' : 'var(--glass-border)'),
          boxShadow: isGrimoire
            ? `0 0 16px ${theme?.glow?.color || 'var(--glow)'}, var(--glass-shadow)`
            : 'var(--glass-shadow)',
        }}
      >
        <div className="dock-glass-bg-layer">
          <div className="dock-glass-bg-overlay" style={{ background: tintSystem }} />
          {isVideoAllowed && (
            <video
              src="./asta-demon.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="dock-glass-bg-video"
              style={{
                opacity: videoOpacity,
                mixBlendMode: videoBlend,
                objectPosition: '80% 30%',
              }}
            />
          )}
        </div>
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center' }}>
          <TrayArea
            battery={state.battery}
            volume={state.volume}
            network={state.network}
            weather={state.weather}
            onOpenNetwork={onOpenNetwork}
            onStepVolume={onStepVolume}
            onToggleMute={onToggleMute}
            onOpenCalendar={() => invoke('open_notification_center').catch(() => {})}
          />
        </div>
      </div>

      {/* Context Menu Modal */}
      <ContextMenu
        menu={contextMenu}
        onClose={() => setContextMenu((prev) => ({ ...prev, visible: false }))}
      />
    </div>
  );
};
