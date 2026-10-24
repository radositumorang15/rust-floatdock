import React, { useState, useRef, useEffect } from 'react';
import { Search, LayoutGrid, Bell } from 'lucide-react';
import { AppEntry, FullDockState, TrackedWindow, ContextMenuState, ContextMenuItem } from '../../types';
import { Windows11Logo, TelegramIcon } from '../common/AppIcons';
import { GeometricClover } from '../common/CloverIcon';
import { ManaParticles } from '../common/ManaParticles';
import { ThemeConfig, ManaAttribute } from '../../themes/types';
import { AVAILABLE_THEMES } from '../../themes/presets';
import { DockItem } from './DockItem';
import { Pill } from './Pill';
import { TrayArea } from './TrayIcon';
import { ContextMenu } from '../common/ContextMenu';

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
  onToggleTimer,
  onResetTimer,
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

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    x: 0,
    y: 0,
    visible: false,
    items: [],
  });

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

  const handlePillContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: Math.max(e.clientY - 90, 10),
      visible: true,
      items: [
        {
          label: state.timer.is_running ? 'Jeda Timer' : 'Lanjutkan Timer',
          action: onToggleTimer,
        },
        {
          label: 'Reset Timer (57:12)',
          action: onResetTimer,
        },
      ],
    });
  };

  const getRunningWindowForApp = (app: AppEntry): TrackedWindow | undefined => {
    return state.running_windows.find(
      (w) =>
        w.app_name.toLowerCase().includes(app.name.toLowerCase()) ||
        app.exec_path.toLowerCase().includes(w.app_name.toLowerCase())
    );
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
    <div className="segmented-dock-container">
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

        {/* 1. App Icons Strip */}
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
          {state.pinned_apps.map((app, idx) => {
            const running = getRunningWindowForApp(app);
            return (
              <DockItem
                key={app.id}
                app={app}
                runningWindow={running}
                index={idx}
                mouseRelativeX={mouseRelativeX}
                accentColor={accentColor}
                theme={theme}
                onClick={onLaunchApp}
                onContextMenu={handleItemContextMenu}
              />
            );
          })}
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
            onClick={() => onLaunchApp({ id: 'taskview', name: 'Task View', exec_path: '', icon_name: '', is_pinned: false, category: 'Sistem' })}
            className="quick-tool-btn"
            title="Tampilan Tugas (Task View)"
          >
            <LayoutGrid size={16} />
          </div>

          {/* Notification Bell */}
          <div
            onClick={onOpenSettings}
            className="quick-tool-btn"
            title="Pusat Pemberitahuan & Pengaturan"
          >
            <Bell size={16} />
          </div>

          {/* Telegram / Chat icon with active dot */}
          <div
            onClick={() => onLaunchApp({ id: 'telegram', name: 'Telegram', exec_path: 'telegram.exe', icon_name: 'telegram', is_pinned: true, category: 'Komunikasi' })}
            className="quick-tool-btn"
            title="Telegram (1 pesan baru)"
            style={{ position: 'relative' }}
          >
            <TelegramIcon size={26} />
            <div
              style={{
                position: 'absolute',
                bottom: '1px',
                right: '1px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#38BDF8',
                border: '1.5px solid rgba(0,0,0,0.4)',
              }}
            />
          </div>
        </div>

        {/* Sleek Timer Pill (Only shown when timer is running) */}
        {state.timer && state.timer.is_running && (
          <div style={{ marginLeft: '4px' }}>
            <Pill
              timer={state.timer}
              theme={theme}
              onToggle={onToggleTimer}
              onReset={onResetTimer}
              onContextMenu={handlePillContextMenu}
            />
          </div>
        )}
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
            onOpenCalendar={onOpenSettings}
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
