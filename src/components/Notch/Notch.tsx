import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, Bell, Music, FolderDown, Clipboard, Cpu, Check, Trash2, Zap, ExternalLink, SkipBack, SkipForward
} from 'lucide-react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { MediaState, TimerState, SystemPulse, HardwareAudioState, ShelfFile } from '../../types';
import { ThemeConfig } from '../../themes/types';

interface NotchProps {
  timer?: TimerState;
  media?: MediaState;
  theme?: ThemeConfig;
  onTogglePlayback?: () => void;
  onResize?: (width: number, height: number) => void;
}

type NotchTab = 'media' | 'shelf' | 'clipboard' | 'mana';

export const Notch: React.FC<NotchProps> = ({
  timer,
  media,
  theme,
  onTogglePlayback,
  onResize,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<NotchTab>('media');
  const [ramBoostMsg, setRamBoostMsg] = useState<string | null>(null);

  // State Telemetry & Mata
  const [pulse, setPulse] = useState<SystemPulse>({
    cursor_norm_x: 0,
    cursor_norm_y: 0,
    cpu_usage: 12,
    ram_usage: 45,
    should_autohide_dock: false,
    cursor_near_bottom: false,
    recent_clips: [],
  });

  // State Hardware & Audio WASAPI
  const [hwState, setHwState] = useState<HardwareAudioState>({
    audio_bars: [0.12, 0.12, 0.12, 0.12, 0.12],
    battery_percent: 100,
    is_charging: true,
    hardware_toast: null,
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [blinking, setBlinking] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // State File Shelf (Drop Zone)
  const [shelfFiles, setShelfFiles] = useState<ShelfFile[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Jam & Tanggal
  const [timeStr, setTimeStr] = useState('12:00');
  const [dateStr, setDateStr] = useState('24 Okt');
  const [isLateNight, setIsLateNight] = useState(false);
  const shrinkTimeoutRef = useRef<number | null>(null);

  // 1. Dengarkan event "system-pulse" dan "hardware-audio" dari Rust
  useEffect(() => {
    let unlistenPulse: (() => void) | undefined;
    let unlistenHw: (() => void) | undefined;

    listen<SystemPulse>('system-pulse', (event) => {
      setPulse(event.payload);
    }).then((unsub) => {
      unlistenPulse = unsub;
    }).catch(() => {});

    listen<HardwareAudioState>('hardware-audio', (event) => {
      setHwState(event.payload);
    }).then((unsub) => {
      unlistenHw = unsub;
    }).catch(() => {});

    return () => {
      if (unlistenPulse) unlistenPulse();
      if (unlistenHw) unlistenHw();
    };
  }, []);

  // 2. Hardware Toast Alert (Pop-up otomatis selama 3 detik)
  const toastTimeoutRef = useRef<number | null>(null);
  useEffect(() => {
    if (hwState.hardware_toast) {
      setToastMsg(hwState.hardware_toast);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = window.setTimeout(() => {
        setToastMsg(null);
      }, 3000);
    }
  }, [hwState.hardware_toast]);

  // 2b. Timer Finished Notification Alert (auto-dismiss 7 detik & click-to-dismiss agar tidak stuck)
  const [showTimerAlert, setShowTimerAlert] = useState(false);
  const timerAlertTimeoutRef = useRef<number | null>(null);
  const prevTimerFinishedRef = useRef(false);

  useEffect(() => {
    if (timer?.is_finished && !prevTimerFinishedRef.current) {
      setShowTimerAlert(true);
      if (timerAlertTimeoutRef.current) clearTimeout(timerAlertTimeoutRef.current);
      timerAlertTimeoutRef.current = window.setTimeout(() => {
        setShowTimerAlert(false);
      }, 7000);
    } else if (!timer?.is_finished) {
      setShowTimerAlert(false);
      if (timerAlertTimeoutRef.current) clearTimeout(timerAlertTimeoutRef.current);
    }
    prevTimerFinishedRef.current = Boolean(timer?.is_finished);

    return () => {
      if (timerAlertTimeoutRef.current) clearTimeout(timerAlertTimeoutRef.current);
    };
  }, [timer?.is_finished]);

  const handleDismissTimerAlert = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTimerAlert(false);
    if (timerAlertTimeoutRef.current) clearTimeout(timerAlertTimeoutRef.current);
    invoke('reset_timer').catch(() => {});
  };

  // 3. Update Jam & Deteksi Jam Tidur (Sleepy Mode >= 23:00 atau < 05:00)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hour = now.getHours();
      setIsLateNight(hour >= 23 || hour < 5);

      setTimeStr(
        `${String(hour).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      setDateStr(`${now.getDate()} ${months[now.getMonth()]}`);
    };
    updateClock();
    const timerId = setInterval(updateClock, 1000);
    return () => clearInterval(timerId);
  }, []);

  // 4. Kedipan Organik (Single & Double Blink)
  useEffect(() => {
    let timeout: number;
    const loopBlink = () => {
      timeout = window.setTimeout(() => {
        setBlinking(true);
        setTimeout(() => {
          setBlinking(false);
          if (Math.random() < 0.35) {
            setTimeout(() => {
              setBlinking(true);
              setTimeout(() => setBlinking(false), 100);
            }, 110);
          }
        }, 120);
        loopBlink();
      }, 2500 + Math.random() * 3500);
    };
    loopBlink();
    return () => clearTimeout(timeout);
  }, []);

  const isPlaying = Boolean(media?.has_media && media?.is_playing);
  const isOverloaded = pulse.cpu_usage > 85 || pulse.ram_usage > 88;

  // Warna Aksen Berdasarkan Tema (Tanpa warna merah)
  const accentColor = theme?.accent || '#38BDF8';

  // Kalkulasi dimensi Notch
  let targetWidth = toastMsg ? 270 : (isPlaying || shelfFiles.length > 0 ? 176 : 126);
  let targetHeight = 36;

  if (showTimerAlert) {
    targetWidth = 290;
    targetHeight = 48;
  } else if (isExpanded || isDraggingOver) {
    targetWidth = 390;
    targetHeight = 176;
  } else if (isHovered) {
    targetWidth = 280;
    targetHeight = 42;
  }

  // Anti-Clip Window Resize
  const prevDim = useRef({ w: targetWidth, h: targetHeight });
  useEffect(() => {
    if (shrinkTimeoutRef.current) clearTimeout(shrinkTimeoutRef.current);
    const growing = targetWidth > prevDim.current.w || targetHeight > prevDim.current.h;

    if (growing) {
      onResize?.(targetWidth, targetHeight);
    } else {
      shrinkTimeoutRef.current = window.setTimeout(() => {
        onResize?.(targetWidth, targetHeight);
      }, 230);
    }
    prevDim.current = { w: targetWidth, h: targetHeight };
  }, [targetWidth, targetHeight, onResize]);

  // Handler Drag & Drop untuk File Shelf
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    setIsExpanded(true);
    setActiveTab('shelf');

    const files = Array.from(e.dataTransfer.files).map((f) => ({
      name: f.name,
      path: (f as any).path || f.name,
    }));
    if (files.length > 0) {
      setShelfFiles((prev) => [...files, ...prev].slice(0, 6));
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1200);
  };

  // Hitung pergeseran pupil mata mengikuti kursor layar secara global
  const eyeX = pulse.cursor_norm_x * 6.5;
  const eyeY = pulse.cursor_norm_y * 3.5;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        width: '100vw',
        height: '100vh',
        background: 'transparent',
        overflow: 'hidden',
      }}
    >
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsExpanded(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        onClick={() => !showTimerAlert && setIsExpanded((prev) => !prev)}
        style={{
          width: `${targetWidth}px`,
          height: `${targetHeight}px`,
          background: 'var(--notch-bg, #000000)',
          borderRadius: isExpanded ? '22px' : '0 0 18px 18px',
          border: '1px solid rgba(255,255,255,0.14)',
          borderTop: 'none',
          boxShadow: 'none',
          color: '#FFFFFF',
          cursor: 'pointer',
          userSelect: 'none',
          padding: isExpanded ? '12px 16px' : '0 14px',
          boxSizing: 'border-box',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          transition:
            'width 220ms cubic-bezier(0.22, 1, 0.36, 1), height 220ms cubic-bezier(0.22, 1, 0.36, 1), border-radius 200ms ease',
        }}
      >
        {/* STATE 0: Hardware Toast Popup (Charger, Battery, Bluetooth) */}
        {toastMsg ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setToastMsg(null);
            }}
            title="Klik untuk menutup"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '0 8px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Zap size={15} color={accentColor} />
            <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.2px' }}>{toastMsg}</span>
          </div>
        ) : showTimerAlert ? (
          /* STATE 1: Timer Selesai (Klik untuk menutup & mengulang) */
          <div
            onClick={handleDismissTimerAlert}
            title="Klik untuk menutup & mengulang timer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: '0 8px',
              whiteSpace: 'nowrap',
            }}
          >
            <Bell size={18} color={accentColor} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              Waktu {timer?.label || 'Timer'} Habis!
            </span>
          </div>
        ) : isExpanded || isDraggingOver ? (
          /* STATE 2: EXPANDED 4-TAB DYNAMIC ISLAND */
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}
          >
            {/* Bar Navigasi Tab */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>{timeStr}</span>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)' }}>{dateStr}</span>
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                {[
                  { id: 'media', icon: <Music size={11} />, label: 'Media' },
                  { id: 'shelf', icon: <FolderDown size={11} />, label: `Laci (${shelfFiles.length})` },
                  { id: 'clipboard', icon: <Clipboard size={11} />, label: 'Clip' },
                  { id: 'mana', icon: <Cpu size={11} />, label: 'Mana' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as NotchTab)}
                    style={{
                      background: activeTab === t.id ? accentColor : 'rgba(255,255,255,0.08)',
                      color: activeTab === t.id ? '#090D16' : '#FFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '4px 7px',
                      fontSize: '10px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Isi Tab */}
            <div style={{ flex: 1, marginTop: '8px', overflowY: 'auto' }}>
              {activeTab === 'media' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                      {media?.has_media ? media.title : 'Belum ada musik diputar'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                      {media?.artist || 'Spotify / YouTube / Media'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <button
                      onClick={() => invoke('media_skip_previous').catch(() => {})}
                      title="Sebelumnya"
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(255,255,255,0.1)',
                        color: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <SkipBack size={13} />
                    </button>
                    <button
                      onClick={() => onTogglePlayback?.()}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        border: 'none',
                        background: accentColor,
                        color: '#090D16',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button
                      onClick={() => invoke('media_skip_next').catch(() => {})}
                      title="Selanjutnya"
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(255,255,255,0.1)',
                        color: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <SkipForward size={13} />
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'shelf' && (
                <div
                  style={{
                    border: '1px dashed rgba(255,255,255,0.25)',
                    borderRadius: '12px',
                    padding: '8px 10px',
                    minHeight: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: shelfFiles.length === 0 ? 'center' : 'flex-start',
                    gap: '5px',
                  }}
                >
                  {shelfFiles.length === 0 ? (
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                      Tarik & lepas file ke Notch ini untuk disimpan sementara
                    </span>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>Klik file untuk buka</span>
                        <span
                          onClick={() => setShelfFiles([])}
                          style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Hapus Semua
                        </span>
                      </div>
                      {shelfFiles.map((f, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'rgba(255,255,255,0.08)',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                          }}
                        >
                          <span
                            onClick={() => invoke('open_shelf_file', { path: f.path }).catch(() => {})}
                            title="Klik untuk membuka file"
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '240px',
                              cursor: 'pointer',
                              textDecoration: 'underline dotted rgba(255,255,255,0.4)',
                            }}
                          >
                            {f.name}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              title="Buka lokasi file di Explorer"
                              style={{ cursor: 'pointer', opacity: 0.7, display: 'flex', alignItems: 'center' }}
                              onClick={() => invoke('reveal_shelf_file', { path: f.path }).catch(() => {})}
                            >
                              <ExternalLink size={12} />
                            </span>
                            <span
                              title="Hapus dari laci"
                              style={{ cursor: 'pointer', opacity: 0.7, display: 'flex', alignItems: 'center' }}
                              onClick={() => setShelfFiles((prev) => prev.filter((_, idx) => idx !== i))}
                            >
                              <Trash2 size={12} />
                            </span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {activeTab === 'clipboard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {pulse.recent_clips.length === 0 ? (
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '16px' }}>
                      Belum ada teks yang disalin.
                    </span>
                  ) : (
                    pulse.recent_clips.slice(0, 3).map((clip, idx) => (
                      <div
                        key={idx}
                        onClick={() => copyToClipboard(clip, idx)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'rgba(255,255,255,0.07)',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '290px' }}>
                          {clip}
                        </span>
                        {copiedIndex === idx ? <Check size={12} color="#4ADE80" /> : <Clipboard size={12} opacity={0.6} />}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'mana' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '2px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                      <span>CPU Mana Load</span>
                      <span style={{ fontWeight: 700, color: accentColor }}>{pulse.cpu_usage.toFixed(0)}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pulse.cpu_usage}%`, height: '100%', background: accentColor, transition: 'width 250ms ease' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                      <span>RAM Grimoire Capacity</span>
                      <span style={{ fontWeight: 700, color: '#A855F7' }}>{pulse.ram_usage.toFixed(0)}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pulse.ram_usage}%`, height: '100%', background: '#A855F7', transition: 'width 250ms ease' }} />
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      try {
                        const res = await invoke<string>('optimize_system_memory');
                        setRamBoostMsg(res);
                        setTimeout(() => setRamBoostMsg(null), 3000);
                      } catch {
                        setRamBoostMsg('Optimasi selesai');
                        setTimeout(() => setRamBoostMsg(null), 2000);
                      }
                    }}
                    style={{
                      marginTop: '4px',
                      padding: '4px 8px',
                      background: 'rgba(168, 85, 247, 0.18)',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      borderRadius: '8px',
                      color: '#FFF',
                      fontSize: '10px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <Zap size={11} color="#C084FC" />
                    <span>{ramBoostMsg || '⚡ Optimalkan RAM (Trim Working Set)'}</span>
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
              <span>{isOverloaded ? '⚡ ASTA DEMON OVERLOAD' : 'Grimoire Dynamic Island'}</span>
              <span>Klik luar untuk tutup</span>
            </div>
          </div>
        ) : isHovered ? (
          /* STATE 3: HOVER BAR (Jam, Tanggal, CPU/RAM status) */
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>{timeStr}</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)' }}>{dateStr}</span>
            </div>
            <span style={{ fontSize: '11px', color: accentColor, fontWeight: 600 }}>
              {media?.has_media ? media.title : `CPU ${pulse.cpu_usage.toFixed(0)}% • RAM ${pulse.ram_usage.toFixed(0)}%`}
            </span>
          </div>
        ) : (
          /* STATE 4: IDLE SYSTEM-AWARE LIVING EYES + WASAPI AUDIO VISUALIZER */
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            {shelfFiles.length > 0 && (
              <span style={{ fontSize: '10px', color: accentColor, fontWeight: 700 }}>
                {shelfFiles.length} file
              </span>
            )}

            {/* Mata yang menatap kursor global */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                margin: '0 auto',
                transform: `translate(${eyeX.toFixed(1)}px, ${eyeY.toFixed(1)}px)`,
                transition: 'transform 80ms linear',
              }}
            >
              {[0, 1].map((i) => (
                <div
                  key={i}
                  style={{
                    width: isPlaying ? '10px' : '8px',
                    height: isLateNight ? '4px' : '11px', // Mengantuk saat larut malam
                    borderRadius: isPlaying ? '10px 10px 3px 3px' : '6px',
                    background: accentColor,
                    boxShadow: `0 0 ${isOverloaded ? '12px' : '8px'} ${accentColor}`,
                    transform: blinking ? 'scaleY(0.08)' : 'scaleY(1)',
                    transition: 'transform 80ms ease, height 200ms ease, background 200ms ease',
                  }}
                />
              ))}
            </div>

            {/* Real-Time WASAPI Audio Spectrum Bars */}
            {isPlaying ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '14px' }}>
                {hwState.audio_bars.map((level, i) => (
                  <span
                    key={i}
                    style={{
                      width: '2.5px',
                      height: `${Math.max(3, level * 14)}px`,
                      background: accentColor,
                      borderRadius: '2px',
                      transition: 'height 75ms ease-out',
                    }}
                  />
                ))}
              </div>
            ) : isOverloaded ? (
              <Zap size={12} color={accentColor} />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
