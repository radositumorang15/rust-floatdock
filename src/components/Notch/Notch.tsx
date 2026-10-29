import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Play,
  Pause,
  Bell,
  Music,
  FolderDown,
  Clipboard,
  Cpu,
  Check,
  Trash2,
  Zap,
  ExternalLink,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { MediaState, TimerState, SystemPulse, HardwareAudioState, ShelfFile } from '../../types';
import { ThemeConfig } from '../../themes/types';
import './Notch.css';

interface NotchProps {
  timer?: TimerState;
  media?: MediaState;
  theme?: ThemeConfig;
  onTogglePlayback?: () => void;
  onResize?: (width: number, height: number) => void;
}

type NotchTab = 'media' | 'shelf' | 'clipboard' | 'mana';
type Mood = 'normal' | 'happy' | 'sleepy' | 'alert';
type View = 'toast' | 'alert' | 'expanded' | 'hover' | 'idle';

/* ───────────────────────── Konstanta ───────────────────────── */

const IDLE_W = 124;          // sinkron dengan NOTCH_IDLE_WIDTH di notch.rs
const ACTIVITY_W = 188;      // idle + live activity (timer / musik / file)
const IDLE_H = 36;           // sinkron dengan NOTCH_IDLE_HEIGHT di notch.rs
const HOVER_H = 42;
const ALERT_H = 48;
const EXPANDED_W = 392;
const SHRINK_DELAY = 280;    // sedikit > durasi transisi CSS (260ms) agar window tidak memotong animasi
const MAX_SHELF = 6;
const SHOW_TIMER = false;    // false = widget "waktu minum" (countdown di idle + alert) dimatikan
const INK = '#090D16';
const MUTED = 'rgba(255,255,255,0.6)';

const TABS: { id: NotchTab; label: string; Icon: LucideIcon }[] = [
  { id: 'media', label: 'Media', Icon: Music },
  { id: 'shelf', label: 'Laci', Icon: FolderDown },
  { id: 'clipboard', label: 'Clipboard', Icon: Clipboard },
  { id: 'mana', label: 'Mana', Icon: Cpu },
];

const TAB_W = 30;
const TAB_H = 24;

const EYE_SHAPE: Record<Mood, { w: number; h: number; r: string; glow: number; blink: number }> = {
  normal: { w: 8, h: 12, r: '6px', glow: 8, blink: 0.08 },
  happy: { w: 11, h: 7, r: '10px 10px 3px 3px', glow: 9, blink: 0.08 },
  sleepy: { w: 9, h: 3, r: '4px', glow: 5, blink: 0.2 },
  alert: { w: 9, h: 14, r: '6px', glow: 13, blink: 0.08 },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/* ───────────────────────── Util & Hooks ───────────────────────── */

const basename = (p: string) => p.split(/[\\/]/).pop() || p;

/** Listener event Tauri yang aman dari race-condition unmount & tidak re-subscribe tiap render. */
function useTauriEvent<T>(name: string, handler: (payload: T) => void) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    let disposed = false;
    let unlisten: (() => void) | undefined;

    listen<T>(name, (e) => {
      if (!disposed) ref.current(e.payload);
    })
      .then((un) => {
        if (disposed) un();
        else unlisten = un;
      })
      .catch(() => {});

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [name]);
}

/* ───────────────────────── Mata Organik ───────────────────────── */

interface EyesProps {
  cursorRef: React.MutableRefObject<{ x: number; y: number }>;
  mood: Mood;
}

/**
 * Mata hidup:
 *  - Mengikuti kursor dengan easing berbasis waktu (rAF, tanpa re-render React)
 *  - Optimasi: bypass style mutation jika nilai transform tidak berubah
 *  - Jika kursor diam > 4 dtk, mata melirik ke sekeliling secara mandiri
 *  - Kedipan acak (tunggal / ganda), mata kanan sedikit tertinggal agar terasa organik
 *  - Suasana hati: normal, senang (musik), mengantuk (larut malam), waspada (CPU/RAM tinggi)
 */
const Eyes = memo(function Eyes({ cursorRef, mood }: EyesProps) {
  const groupRef = useRef<HTMLDivElement>(null);
  const ampRef = useRef(1);
  const [blink, setBlink] = useState(false);
  ampRef.current = mood === 'sleepy' ? 0.5 : 1;

  // Kedipan organik
  useEffect(() => {
    let alive = true;
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        if (alive) fn();
      }, ms);
      timers.add(id);
    };

    const schedule = () => {
      const base = mood === 'sleepy' ? 4200 : mood === 'alert' ? 1800 : 2600;
      later(() => {
        setBlink(true);
        later(() => {
          setBlink(false);
          if (mood !== 'sleepy' && Math.random() < 0.3) {
            later(() => {
              setBlink(true);
              later(() => setBlink(false), 110);
            }, 120);
          }
          schedule();
        }, mood === 'sleepy' ? 280 : 130);
      }, base + Math.random() * 3200);
    };

    schedule();
    return () => {
      alive = false;
      timers.forEach((id) => clearTimeout(id));
    };
  }, [mood]);

  // Tatapan: ikuti kursor + lirikan idle dengan optimasi style DOM
  useEffect(() => {
    const el = groupRef.current;
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduce) {
      el.style.transform = 'none';
      return;
    }

    const clamp = (v: number) => Math.max(-1, Math.min(1, v));

    let raf = 0;
    let px = 0;
    let py = 0;
    let last = performance.now();
    let lastCx = cursorRef.current.x;
    let lastCy = cursorRef.current.y;
    let lastMove = last;
    let glance: { x: number; y: number } | null = null;
    let nextGlanceAt = 0;
    let lastTransform = '';

    const frame = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      const c = cursorRef.current;

      if (Math.abs(c.x - lastCx) > 0.003 || Math.abs(c.y - lastCy) > 0.003) {
        lastCx = c.x;
        lastCy = c.y;
        lastMove = now;
        glance = null;
        nextGlanceAt = 0;
      }

      let tx = clamp(c.x);
      let ty = clamp(c.y);
      if (now - lastMove > 4000) {
        if (now >= nextGlanceAt) {
          glance = Math.random() < 0.35
            ? null
            : { x: (Math.random() * 2 - 1) * 0.95, y: (Math.random() * 2 - 1) * 0.55 };
          nextGlanceAt = now + 1400 + Math.random() * 2800;
        }
        if (glance) {
          tx = glance.x;
          ty = glance.y;
        }
      }

      const k = 1 - Math.exp(-dt / 85);
      px += (tx - px) * k;
      py += (ty - py) * k;
      const amp = ampRef.current;

      const nextTransform = `translate3d(${(px * 6.5 * amp).toFixed(2)}px, ${(py * 3.5 * amp).toFixed(2)}px, 0)`;
      // Optimasi: Jangan ubah DOM style jika nilai string transform sama persis
      if (lastTransform !== nextTransform) {
        el.style.transform = nextTransform;
        lastTransform = nextTransform;
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [cursorRef]);

  const s = EYE_SHAPE[mood];
  const blinkTransition = (delayMs: number) =>
    blink ? `transform 70ms ease-in ${delayMs}ms` : `transform 140ms cubic-bezier(.2,.8,.3,1) ${delayMs}ms`;

  return (
    <div ref={groupRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
      {[0, 1].map((i) => (
        <span
          key={i}
          style={{
            display: 'block',
            width: s.w,
            height: s.h,
            borderRadius: s.r,
            background: 'var(--nx-accent)',
            boxShadow: `0 0 ${s.glow}px var(--nx-accent)`,
            transform: blink ? `scaleY(${s.blink})` : 'scaleY(1)',
            transition: `${blinkTransition(i === 1 ? 12 : 0)}, width 280ms ease, height 280ms cubic-bezier(.32,.72,0,1), border-radius 280ms ease, box-shadow 280ms ease`,
            animation: 'nx-breathe 4s ease-in-out infinite',
          }}
        />
      ))}
      {mood === 'sleepy' && <span className="nx-z">z</span>}
    </div>
  );
});

/* ───────────────────────── Spektrum Audio (WASAPI) ───────────────────────── */

/** Update langsung ke DOM (tanpa render React) agar event audio 12.5Hz tidak membebani React. */
const AudioBars = memo(function AudioBars() {
  const refs = useRef<(HTMLSpanElement | null)[]>([]);

  useTauriEvent<HardwareAudioState>('hardware-audio', (hw) => {
    if (Array.isArray(hw?.audio_bars)) {
      hw.audio_bars.forEach((lv, i) => {
        const el = refs.current[i];
        if (el) {
          const val = typeof lv === 'number' && !isNaN(lv) ? Math.max(0.2, Math.min(1, lv)) : 0.2;
          el.style.transform = `scaleY(${val.toFixed(2)})`;
        }
      });
    }
  });

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 14 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          style={{
            width: 2.5,
            height: 14,
            borderRadius: 2,
            background: 'var(--nx-accent)',
            transformOrigin: 'center bottom',
            transform: 'scaleY(0.25)',
            transition: 'transform 80ms ease-out',
          }}
        />
      ))}
    </div>
  );
});

/* ───────────────────────── Meter Bar GPU-Accelerated ───────────────────────── */

const Meter = memo(function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5, color: 'rgba(255,255,255,0.72)' }}>
        <span>{label}</span>
        <span className="nx-mono" style={{ fontWeight: 700, color }}>{value}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.10)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: '100%',
            borderRadius: 3,
            background: color,
            transformOrigin: 'left center',
            transform: `scaleX(${Math.min(100, Math.max(0, value)) / 100})`,
            transition: 'transform 400ms cubic-bezier(.32,.72,0,1)',
          }}
        />
      </div>
    </div>
  );
});

/* ───────────────────────── Tinggi Konten Per Tab ───────────────────────── */

function expandedHeight(tab: NotchTab, shelfCount: number, clipCount: number): number {
  switch (tab) {
    case 'media':
      return 140;
    case 'shelf':
      return shelfCount === 0 ? 150 : Math.max(140, Math.min(250, 88 + shelfCount * 32));
    case 'clipboard':
      return Math.max(140, 64 + Math.min(3, clipCount) * 40);
    case 'mana':
      return 172;
  }
}

/* ───────────────────────── Komponen Utama Notch ───────────────────────── */

export const Notch: React.FC<NotchProps> = ({ timer, media, theme, onTogglePlayback, onResize }) => {
  const [liveMedia, setLiveMedia] = useState<MediaState>(() => media || {
    title: '',
    artist: '',
    is_playing: false,
    has_media: false,
  });

  useEffect(() => {
    if (media) setLiveMedia(media);
  }, [media]);

  useTauriEvent<MediaState>('media-updated', (m) => {
    if (m) setLiveMedia(m);
  });

  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<NotchTab>('media');
  const [ramBoostMsg, setRamBoostMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showTimerAlert, setShowTimerAlert] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [shelfFiles, setShelfFiles] = useState<ShelfFile[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [timeStr, setTimeStr] = useState('12:00');
  const [dateStr, setDateStr] = useState('24 Okt');
  const [isLateNight, setIsLateNight] = useState(false);

  // Telemetri sistem: cursor disimpan di ref (tanpa re-render).
  // CPU/RAM/clip hanya memicu render bila nilainya benar-benar berubah.
  const cursorRef = useRef({ x: 0, y: 0 });
  const [pulse, setPulse] = useState({ cpu_usage: 12, ram_usage: 45, recent_clips: [] as string[] });

  useTauriEvent<SystemPulse>('system-pulse', (p) => {
    cursorRef.current.x = p.cursor_norm_x;
    cursorRef.current.y = p.cursor_norm_y;
    const cpu = Math.round(p.cpu_usage);
    const ram = Math.round(p.ram_usage);
    const clips = p.recent_clips ?? [];
    setPulse((prev) => {
      const sameClips = prev.recent_clips.length === clips.length && prev.recent_clips.every((c, i) => c === clips[i]);
      if (prev.cpu_usage === cpu && prev.ram_usage === ram && sameClips) return prev;
      return { cpu_usage: cpu, ram_usage: ram, recent_clips: clips };
    });
  });

  // Toast alert hardware (charger, baterai, bluetooth)
  const lastToastRef = useRef<{ text: string; time: number } | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  useTauriEvent<HardwareAudioState>('hardware-audio', (hw) => {
    const t = hw?.hardware_toast?.trim() ?? null;
    if (!t) return;

    const now = Date.now();
    // Cegah kemunculan pesan yang sama jika baru saja ditampilkan dalam 5 detik
    if (lastToastRef.current && lastToastRef.current.text === t && now - lastToastRef.current.time < 5000) {
      return;
    }

    lastToastRef.current = { text: t, time: now };
    setToastMsg(t);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 3200);
  });

  // Alert timer selesai (auto-dismiss 7 detik & click-to-dismiss)
  const timerAlertTimeoutRef = useRef<number | null>(null);
  const prevTimerFinishedRef = useRef(false);
  useEffect(() => {
    if (timer?.is_finished && !prevTimerFinishedRef.current) {
      setShowTimerAlert(true);
      if (timerAlertTimeoutRef.current) clearTimeout(timerAlertTimeoutRef.current);
      timerAlertTimeoutRef.current = window.setTimeout(() => setShowTimerAlert(false), 7000);
    } else if (!timer?.is_finished) {
      setShowTimerAlert(false);
      if (timerAlertTimeoutRef.current) clearTimeout(timerAlertTimeoutRef.current);
    }
    prevTimerFinishedRef.current = Boolean(timer?.is_finished);
  }, [timer?.is_finished]);

  const handleDismissTimerAlert = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTimerAlert(false);
    if (timerAlertTimeoutRef.current) clearTimeout(timerAlertTimeoutRef.current);
    invoke('reset_timer').catch(() => {});
  };

  // Jam: update presisi saat detik ke-0 setiap menit
  useEffect(() => {
    let id: number;
    const tick = () => {
      const now = new Date();
      const hour = now.getHours();
      setIsLateNight(hour >= 23 || hour < 5);
      setTimeStr(`${String(hour).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      setDateStr(`${now.getDate()} ${MONTHS[now.getMonth()]}`);
      id = window.setTimeout(tick, (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 20);
    };
    tick();
    return () => clearTimeout(id);
  }, []);

  // Keyboard accessibility: Tekan Escape untuk menutup mode expanded
  useEffect(() => {
    if (!isExpanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isExpanded]);

  // Bersihkan semua timer saat unmount
  useEffect(
    () => () => {
      [toastTimerRef, timerAlertTimeoutRef, leaveTimerRef, boostTimerRef].forEach((r) => {
        if (r.current) clearTimeout(r.current);
      });
    },
    [],
  );

  /* ── File shelf: Drag & Drop Tauri v2 + fallback HTML5 dengan deduplikasi cerdas ── */

  const addFiles = useCallback((incoming: ShelfFile[]) => {
    if (!incoming.length) return;
    setShelfFiles((prev) => {
      const map = new Map<string, ShelfFile>();
      for (const f of prev) {
        map.set(f.path, f);
      }
      for (const f of incoming) {
        // Jika ada file dengan nama sama tapi incoming punya full path asli, gantikan versi fallback
        const existingKey = Array.from(map.keys()).find((k) => basename(k) === f.name);
        if (existingKey && existingKey === f.name && f.path !== f.name) {
          map.delete(existingKey);
        }
        map.set(f.path, f);
      }
      return Array.from(map.values()).slice(0, MAX_SHELF);
    });
    setIsExpanded(true);
    setActiveTab('shelf');
  }, []);

  useEffect(() => {
    let disposed = false;
    let unlisten: (() => void) | undefined;
    try {
      getCurrentWebview()
        .onDragDropEvent((event) => {
          const p = event.payload;
          if (p.type === 'enter' || p.type === 'over') {
            setIsDraggingOver(true);
          } else if (p.type === 'drop') {
            setIsDraggingOver(false);
            addFiles(p.paths.map((path) => ({ name: basename(path), path })));
          } else {
            setIsDraggingOver(false);
          }
        })
        .then((un) => {
          if (disposed) un();
          else unlisten = un;
        })
        .catch(() => {});
    } catch {
      /* Fallback jika dijalankan di browser standalone */
    }
    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [addFiles]);

  useEffect(() => {
    if (isDraggingOver) setActiveTab('shelf');
  }, [isDraggingOver]);

  const dragDepth = useRef(0);
  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current += 1;
    setIsDraggingOver(true);
  };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDragLeave = () => {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDraggingOver(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setIsDraggingOver(false);
    addFiles(
      Array.from(e.dataTransfer.files).map((f) => ({
        name: f.name,
        path: (f as File & { path?: string }).path || f.name,
      })),
    );
  };

  /* ── Hover debounce agar tidak flicker saat kursor menyentuh tepi ── */

  const leaveTimerRef = useRef<number | null>(null);
  const handleEnter = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    setIsHovered(true);
  };
  const handleLeave = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = window.setTimeout(() => {
      setIsHovered(false);
      setIsExpanded(false);
    }, 220);
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1200);
  };

  const boostTimerRef = useRef<number | null>(null);
  const handleOptimize = async () => {
    let msg = 'Optimasi selesai';
    try {
      msg = await invoke<string>('optimize_system_memory');
    } catch {
      /* Gunakan fallback text */
    }
    setRamBoostMsg(msg);
    if (boostTimerRef.current) clearTimeout(boostTimerRef.current);
    boostTimerRef.current = window.setTimeout(() => setRamBoostMsg(null), 2800);
  };

  /* ── Status Turunan (Computed States) ── */

  const accentColor = theme?.accent || '#38BDF8';
  const isPlaying = Boolean(liveMedia?.has_media && liveMedia?.is_playing);
  const isOverloaded = pulse.cpu_usage > 92 || pulse.ram_usage > 94;
  const timerRunning = SHOW_TIMER && Boolean(timer?.is_running && !timer?.is_finished);
  // Beban CPU/RAM tinggi TIDAK boleh mengubah lebar Notch idle agar tidak terjadi flickering/glitch
  const hasActivity = isPlaying || timerRunning || shelfFiles.length > 0;
  const mood: Mood = isOverloaded ? 'alert' : isPlaying ? 'happy' : isLateNight ? 'sleepy' : 'normal';

  const view: View = toastMsg
    ? 'toast'
    : showTimerAlert
      ? 'alert'
      : isExpanded || isDraggingOver
        ? 'expanded'
        : isHovered
          ? 'hover'
          : 'idle';

  // Dimensi adaptif konten & batas aman layar
  const maxW = Math.max(IDLE_W, (typeof window !== 'undefined' ? window.screen.width : 1920) - 16);
  let targetW = hasActivity ? ACTIVITY_W : IDLE_W;
  let targetH = IDLE_H;

  switch (view) {
    case 'toast':
      targetW = Math.min(340, Math.max(210, 76 + (toastMsg?.length ?? 0) * 6.6));
      targetH = IDLE_H + 6;
      break;
    case 'alert':
      targetW = Math.min(340, Math.max(250, 170 + (timer?.label?.length ?? 5) * 7));
      targetH = ALERT_H;
      break;
    case 'expanded':
      targetW = EXPANDED_W;
      targetH = expandedHeight(activeTab, shelfFiles.length, pulse.recent_clips.length);
      break;
    case 'hover':
      targetW = liveMedia?.has_media ? 320 : 264;
      targetH = HOVER_H;
      break;
  }
  targetW = Math.round(Math.min(targetW, maxW));
  targetH = Math.round(targetH);

  // Resize window: Tumbuh instan, menyusut setelah transisi CSS selesai (mencegah clipping)
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;
  const sentDim = useRef({ w: IDLE_W, h: IDLE_H });

  useEffect(() => {
    const s = sentDim.current;
    const w = Math.max(s.w, targetW);
    const h = Math.max(s.h, targetH);
    if (w !== s.w || h !== s.h) {
      sentDim.current = { w, h };
      onResizeRef.current?.(w, h);
    }
    let timeout: number | undefined;
    if (w !== targetW || h !== targetH) {
      timeout = window.setTimeout(() => {
        sentDim.current = { w: targetW, h: targetH };
        onResizeRef.current?.(targetW, targetH);
      }, SHRINK_DELAY);
    }
    return () => clearTimeout(timeout);
  }, [targetW, targetH]);

  const radius =
    view === 'expanded' ? '0 0 30px 30px' : view === 'hover' ? '0 0 20px 20px' : view === 'idle' ? '0 0 18px 18px' : '0 0 24px 24px';
  const tabIndex = TABS.findIndex((t) => t.id === activeTab);

  /* ───────────────────────── Render ───────────────────────── */

  return (
    <div className="nx-root" style={{ '--nx-accent': accentColor } as React.CSSProperties}>
      <div
        className={`nx-island ${view === 'expanded' ? 'expanded' : ''}`}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !showTimerAlert && setIsExpanded((prev) => !prev)}
        style={{
          width: targetW,
          height: targetH,
          borderRadius: radius,
          padding: view === 'expanded' ? '12px 14px 14px' : '0 14px',
        }}
      >
        {/* ── STATE 1: TOAST HARDWARE ── */}
        {view === 'toast' && (
          <div
            key="toast"
            className="nx-fade"
            onClick={(e) => {
              e.stopPropagation();
              setToastMsg(null);
            }}
            title="Klik untuk menutup"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap' }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'color-mix(in srgb, var(--nx-accent) 22%, transparent)',
              }}
            >
              <Zap size={13} color={accentColor} />
            </span>
            <span className="nx-ellipsis" style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: 0.1 }}>
              {toastMsg}
            </span>
          </div>
        )}

        {/* ── STATE 2: ALERT TIMER SELESAI ── */}
        {view === 'alert' && (
          <div
            key="alert"
            className="nx-fade"
            onClick={handleDismissTimerAlert}
            title="Klik untuk menutup & mengulang timer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, whiteSpace: 'nowrap' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
              <span className="nx-ring" style={{ display: 'flex' }}>
                <Bell size={18} color={accentColor} />
              </span>
              <span className="nx-ellipsis" style={{ fontSize: 13, fontWeight: 600 }}>
                Waktu {timer?.label || 'timer'} habis
              </span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: accentColor }}>Ulangi</span>
          </div>
        )}

        {/* ── STATE 3: EXPANDED DYNAMIC ISLAND (4-TAB) ── */}
        {view === 'expanded' && (
          <div
            key="expanded"
            className="nx-fade"
            onClick={(e) => e.stopPropagation()}
            style={{ display: 'flex', flexDirection: 'column', height: '100%', cursor: 'default' }}
          >
            {/* Header: Waktu & Navigasi Tab */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: TAB_H + 4, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                <span className="nx-mono" style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.2 }}>{timeStr}</span>
                <span style={{ fontSize: 11, color: MUTED }}>{dateStr}</span>
                {isOverloaded && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      alignSelf: 'center',
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: 999,
                      color: accentColor,
                      background: 'color-mix(in srgb, var(--nx-accent) 16%, transparent)',
                    }}
                  >
                    <Cpu size={10} /> Beban tinggi
                  </span>
                )}
              </div>

              <div
                role="tablist"
                aria-label="Notch Tabs"
                style={{ position: 'relative', display: 'flex', padding: 2, borderRadius: 12, background: 'rgba(255,255,255,0.07)' }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: 2,
                    width: TAB_W,
                    height: TAB_H,
                    borderRadius: 10,
                    background: accentColor,
                    transform: `translateX(${tabIndex * TAB_W}px)`,
                    transition: 'transform 260ms cubic-bezier(.32,.72,0,1)',
                  }}
                />
                {TABS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={activeTab === id}
                    aria-label={label}
                    title={id === 'shelf' ? `${label} (${shelfFiles.length})` : label}
                    onClick={() => setActiveTab(id)}
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      width: TAB_W,
                      height: TAB_H,
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: activeTab === id ? INK : 'rgba(255,255,255,0.72)',
                      transition: 'color 200ms ease',
                    }}
                  >
                    <Icon size={13} />
                    {id === 'shelf' && shelfFiles.length > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 3,
                          right: 5,
                          width: 5,
                          height: 5,
                          borderRadius: 3,
                          background: activeTab === id ? INK : accentColor,
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Isi Tab */}
            <div key={activeTab} className="nx-fade nx-scroll" style={{ flex: 1, minHeight: 0, marginTop: 10, overflowY: 'auto' }}>
              {/* TAB MEDIA */}
              {activeTab === 'media' && (
                <div className="nx-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px' }}>
                  <div
                    className={`nx-art${isPlaying ? ' playing' : ''}`}
                    style={{ background: `linear-gradient(135deg, ${accentColor}, #A855F7)` }}
                  >
                    <Music size={18} color={INK} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="nx-ellipsis" style={{ fontSize: 13.5, fontWeight: 600 }}>
                      {liveMedia?.has_media ? liveMedia.title : 'Belum ada musik diputar'}
                    </div>
                    <div className="nx-ellipsis" style={{ fontSize: 11.5, color: MUTED, marginTop: 2 }}>
                      {liveMedia?.artist || 'Spotify, YouTube, atau pemutar lain'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <button
                      className="nx-btn"
                      aria-label="Sebelumnya"
                      title="Sebelumnya"
                      onClick={() => invoke('media_skip_previous').catch(() => {})}
                      style={{ width: 28, height: 28, borderRadius: 14 }}
                    >
                      <SkipBack size={13} fill="currentColor" />
                    </button>
                    <button
                      className="nx-btn nx-btn-accent"
                      aria-label={isPlaying ? 'Jeda' : 'Putar'}
                      onClick={() => onTogglePlayback ? onTogglePlayback() : invoke('toggle_media_playback').catch(() => {})}
                      style={{ width: 36, height: 36, borderRadius: 18 }}
                    >
                      {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" style={{ marginLeft: 2 }} />}
                    </button>
                    <button
                      className="nx-btn"
                      aria-label="Selanjutnya"
                      title="Selanjutnya"
                      onClick={() => invoke('media_skip_next').catch(() => {})}
                      style={{ width: 28, height: 28, borderRadius: 14 }}
                    >
                      <SkipForward size={13} fill="currentColor" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB LACI (SHELF) */}
              {activeTab === 'shelf' &&
                (shelfFiles.length === 0 ? (
                  <div
                    style={{
                      minHeight: 84,
                      borderRadius: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: 10,
                      textAlign: 'center',
                      border: `1.5px dashed ${isDraggingOver ? accentColor : 'rgba(255,255,255,0.22)'}`,
                      background: isDraggingOver ? 'color-mix(in srgb, var(--nx-accent) 12%, transparent)' : 'transparent',
                      transition: 'border-color 180ms ease, background 180ms ease',
                    }}
                  >
                    <FolderDown size={20} color={isDraggingOver ? accentColor : 'rgba(255,255,255,0.5)'} />
                    <span style={{ fontSize: 11.5, color: isDraggingOver ? '#fff' : MUTED }}>
                      {isDraggingOver ? 'Lepaskan untuk menyimpan' : 'Tarik file ke sini untuk disimpan sementara'}
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 16, padding: '0 2px' }}>
                      <span style={{ fontSize: 10.5, color: MUTED }}>
                        {isDraggingOver ? 'Lepaskan untuk menambah' : 'Klik nama file untuk membuka'}
                      </span>
                      <span
                        className="nx-link"
                        onClick={() => setShelfFiles([])}
                        style={{ fontSize: 10.5, fontWeight: 600, opacity: 0.7 }}
                      >
                        Hapus semua
                      </span>
                    </div>
                    {shelfFiles.map((f, i) => (
                      <div
                        key={f.path}
                        className="nx-card"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          height: 28,
                          padding: '0 6px 0 10px',
                          borderRadius: 10,
                        }}
                      >
                        <span
                          className="nx-ellipsis nx-link"
                          title="Klik untuk membuka file"
                          onClick={() => invoke('open_shelf_file', { path: f.path }).catch(() => {})}
                          style={{ fontSize: 11.5, flex: 1, minWidth: 0 }}
                        >
                          {f.name}
                        </span>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <button
                            className="nx-btn"
                            aria-label="Tampilkan di Explorer"
                            title="Tampilkan di Explorer"
                            onClick={() => invoke('reveal_shelf_file', { path: f.path }).catch(() => {})}
                            style={{ width: 22, height: 22, borderRadius: 7 }}
                          >
                            <ExternalLink size={11} />
                          </button>
                          <button
                            className="nx-btn"
                            aria-label="Hapus dari laci"
                            title="Hapus dari laci"
                            onClick={() => setShelfFiles((prev) => prev.filter((_, idx) => idx !== i))}
                            style={{ width: 22, height: 22, borderRadius: 7 }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

              {/* TAB CLIPBOARD */}
              {activeTab === 'clipboard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {pulse.recent_clips.length === 0 ? (
                    <div style={{ minHeight: 84, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, color: MUTED }}>
                      Belum ada teks yang disalin
                    </div>
                  ) : (
                    pulse.recent_clips.slice(0, 3).map((clip, idx) => (
                      <button
                        key={idx}
                        className="nx-btn nx-card"
                        onClick={() => copyToClipboard(clip, idx)}
                        title="Klik untuk menyalin lagi"
                        style={{
                          justifyContent: 'space-between',
                          gap: 10,
                          height: 34,
                          padding: '0 12px',
                          borderRadius: 11,
                          fontSize: 11.5,
                          textAlign: 'left',
                          width: '100%',
                          background: 'rgba(255,255,255,0.07)',
                        }}
                      >
                        <span className="nx-ellipsis" style={{ flex: 1, minWidth: 0 }}>
                          {clip.replace(/\s+/g, ' ')}
                        </span>
                        {copiedIndex === idx ? <Check size={13} color="#4ADE80" /> : <Clipboard size={12} opacity={0.55} />}
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* TAB MANA */}
              {activeTab === 'mana' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Meter label="CPU Mana Load" value={pulse.cpu_usage} color={accentColor} />
                  <Meter label="RAM Grimoire Capacity" value={pulse.ram_usage} color="#A855F7" />
                  <button
                    className="nx-btn"
                    onClick={handleOptimize}
                    style={{
                      gap: 6,
                      height: 30,
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 600,
                      width: '100%',
                      background: 'rgba(168,85,247,0.18)',
                      boxShadow: 'inset 0 0 0 1px rgba(168,85,247,0.4)',
                    }}
                  >
                    <Zap size={12} color="#C084FC" />
                    <span>{ramBoostMsg || 'Optimalkan RAM'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STATE 4: HOVER ── */}
        {view === 'hover' && (
          <div
            key="hover"
            className="nx-fade"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%' }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexShrink: 0 }}>
              <span className="nx-mono" style={{ fontSize: 13, fontWeight: 700 }}>{timeStr}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>{dateStr}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, color: accentColor, fontSize: 11, fontWeight: 600 }}>
              {isPlaying && <Music size={11} style={{ flexShrink: 0 }} />}
              <span className="nx-ellipsis nx-mono">
                {liveMedia?.has_media ? liveMedia.title : `CPU ${pulse.cpu_usage}% · RAM ${pulse.ram_usage}%`}
              </span>
            </div>
          </div>
        )}

        {/* ── STATE 5: IDLE (Mata Hidup + Live Activity) ── */}
        {view === 'idle' && (
          <div
            key="idle"
            className="nx-fade"
            style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', width: '100%' }}
          >
            <div style={{ justifySelf: 'start', display: 'flex', alignItems: 'center' }}>
              {timerRunning ? (
                <span className="nx-mono" style={{ fontSize: 10.5, fontWeight: 600, color: 'rgba(255,255,255,0.78)' }}>
                  {timer?.formatted_time}
                </span>
              ) : shelfFiles.length > 0 ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, color: accentColor }}>
                  <FolderDown size={11} />
                  {shelfFiles.length}
                </span>
              ) : null}
            </div>

            <Eyes cursorRef={cursorRef} mood={mood} />

            <div style={{ justifySelf: 'end', display: 'flex', alignItems: 'center' }}>
              {isPlaying ? <AudioBars /> : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
