import React, { useState, useEffect, useRef } from 'react';
import { X, Layers, Plus, Globe, User } from 'lucide-react';
import { WindowInstance, ChromeProfileEntry } from '../../types';
import { invoke } from '@tauri-apps/api/core';

interface DockAppPreviewProps {
  appName: string;
  iconUrl?: string;
  iconName?: string;
  profileBadge?: string;
  windows: WindowInstance[];
  accentColor?: string;
  sizeMode?: 'small' | 'medium' | 'large';
  onFocusWindow: (hwnd: number) => void;
  onCloseWindow: (hwnd: number) => void;
  onLaunchNewInstance: () => void;
  onPreviewHoverChange?: (open: boolean) => void;
  isAnyPreviewOpen?: boolean;
  children?: React.ReactNode;
}

export const DockIconWithPreview: React.FC<DockAppPreviewProps> = ({
  appName,
  iconUrl,
  profileBadge,
  windows,
  accentColor = '#38BDF8',
  sizeMode = 'medium',
  onFocusWindow,
  onCloseWindow,
  onLaunchNewInstance,
  onPreviewHoverChange,
  isAnyPreviewOpen = false,
  children,
}) => {
  const [hovered, setHovered] = useState(false);
  const [chromeProfiles, setChromeProfiles] = useState<ChromeProfileEntry[]>([]);
  const enterTimerRef = useRef<number | null>(null);
  const leaveTimerRef = useRef<number | null>(null);

  const cancelTimers = () => {
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  };

  const dismissPreview = () => {
    cancelTimers();
    setHovered(false);
    onPreviewHoverChange?.(false);
  };

  useEffect(() => {
    return () => cancelTimers();
  }, []);

  const handleMouseEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }

    if (!hovered) {
      if (enterTimerRef.current) {
        clearTimeout(enterTimerRef.current);
      }
      // Jika preview lain sedang terbuka, switch seketika (0ms). Jika belum ada preview, beri delay 120ms
      const delay = isAnyPreviewOpen ? 0 : 120;
      if (delay === 0) {
        setHovered(true);
      } else {
        enterTimerRef.current = window.setTimeout(() => {
          setHovered(true);
          enterTimerRef.current = null;
        }, delay);
      }
    }
  };

  const handleMouseLeave = () => {
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }

    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
    }
    // Grace period 220ms agar kursor dapat bergerak mulus antara ikon dock dan kartu preview tanpa flickering
    leaveTimerRef.current = window.setTimeout(() => {
      setHovered(false);
      leaveTimerRef.current = null;
    }, 220);
  };

  const isChrome =
    appName.toLowerCase().includes('chrome') ||
    Boolean(profileBadge) ||
    windows.some((w) => w.title.toLowerCase().includes('google chrome'));

  const hasOverlayContent = windows.length > 0 || (isChrome && chromeProfiles.length > 0);

  useEffect(() => {
    onPreviewHoverChange?.(hovered && hasOverlayContent);
  }, [hovered, hasOverlayContent, onPreviewHoverChange]);

  useEffect(() => {
    if (hovered && isChrome && chromeProfiles.length === 0) {
      invoke<ChromeProfileEntry[]>('get_available_chrome_profiles')
        .then((res) => {
          if (Array.isArray(res)) {
            setChromeProfiles(res);
          }
        })
        .catch(() => {});
    }
  }, [hovered, isChrome]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle-click (tombol roda mouse) membuka instance/jendela baru
    if (e.button === 1) {
      e.preventDefault();
      onLaunchNewInstance();
    }
  };

  const handleLaunchProfile = (dir: string) => {
    invoke('launch_chrome_profile', { dir }).catch(() => {});
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      {/* KARTU PREVIEW JENDELA & PROFIL SAAT HOVER */}
      {hovered && hasOverlayContent && (
        <div
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="dock-preview-card"
          style={{
            position: 'absolute',
            bottom: sizeMode === 'small' ? '46px' : sizeMode === 'medium' ? '54px' : '62px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(11, 15, 25, 0.96)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            borderRadius: '16px',
            padding: sizeMode === 'small' ? '9px 11px' : '10px 14px',
            minWidth: '260px',
            maxWidth: '420px',
            maxHeight: '400px',
            width: 'max-content',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            zIndex: 9999,
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(20px)',
            pointerEvents: 'auto',
          }}
        >
          {/* Hit Bridge: Menutup celah antara ikon dock dan kartu preview agar mouse tidak keluar */}
          <div
            style={{
              position: 'absolute',
              bottom: '-28px',
              left: '-30px',
              right: '-30px',
              height: '36px',
              background: 'transparent',
              pointerEvents: 'auto',
            }}
          />
          {/* HEADER APLIKASI */}
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.75)',
              padding: '0 2px 6px 2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isChrome ? <Globe size={13} color={accentColor} /> : <Layers size={13} color={accentColor} />}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                {appName}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              {profileBadge && (
                <span
                  style={{
                    background: 'rgba(56, 189, 248, 0.16)',
                    color: accentColor,
                    padding: '1px 6px',
                    borderRadius: '5px',
                    fontSize: '9px',
                    fontWeight: 700,
                    border: `1px solid ${accentColor}44`,
                  }}
                >
                  {profileBadge}
                </span>
              )}
              {windows.length > 0 && (
                <span style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.45)' }}>
                  {windows.length} tab/jendela
                </span>
              )}
            </div>
          </div>

          {/* DAFTAR JENDELA / TAB YANG SEDANG AKTIF */}
          {windows.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                maxHeight: '190px',
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                paddingRight: '2px',
              }}
            >
              {windows.map((win) => (
                <div
                  key={win.hwnd}
                  onClick={() => { dismissPreview(); onFocusWindow(win.hwnd); }}
                  title={win.title}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.07)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    color: '#FFF',
                    transition: 'background 120ms ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                    {win.profile_name && (
                      <span
                        style={{
                          background: `${accentColor}25`,
                          color: accentColor,
                          fontSize: '8px',
                          fontWeight: 700,
                          padding: '1px 4px',
                          borderRadius: '4px',
                          flexShrink: 0,
                        }}
                      >
                        {win.profile_name}
                      </span>
                    )}
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '240px',
                      }}
                    >
                      {win.title}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (windows.length <= 1) {
                        dismissPreview();
                      }
                      onCloseWindow(win.hwnd);
                    }}
                    title="Tutup Jendela"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.5)',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '4px',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FF5A52')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)')}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* BAGIAN PROFIL CHROME (Quick Profile Switcher) */}
          {isChrome && chromeProfiles.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                marginTop: windows.length > 0 ? '4px' : '0',
                paddingTop: windows.length > 0 ? '6px' : '0',
                borderTop: windows.length > 0 ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
              }}
            >
              <div
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: 'rgba(255, 255, 255, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <User size={10} />
                <span>Buka Profil ({chromeProfiles.length})</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px',
                  maxHeight: '130px',
                  overflowY: 'auto',
                  scrollbarWidth: 'thin',
                }}
              >
                {chromeProfiles.slice(0, 12).map((prof) => (
                  <button
                    key={prof.dir}
                    onClick={() => { dismissPreview(); handleLaunchProfile(prof.dir); }}
                    title={`Buka Chrome dengan profil ${prof.name}`}
                    style={{
                      background: 'rgba(255, 255, 255, 0.09)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '2px 7px',
                      fontSize: '10px',
                      color: 'rgba(255, 255, 255, 0.85)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'background 120ms ease, color 120ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${accentColor}33`;
                      e.currentTarget.style.color = '#FFF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)';
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)';
                    }}
                  >
                    <Plus size={9} color={accentColor} />
                    <span>{prof.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* IKON APLIKASI DI DOCK */}
      <div
        onClick={(e) => {
          dismissPreview();
          if (e.shiftKey) {
            onLaunchNewInstance();
            return;
          }
          if (windows.length > 1) {
            invoke("activate_group", { hwnds: windows.map((w) => w.hwnd) }).catch(() => {});
          } else if (windows.length === 1) {
            invoke("toggle_window", { hwnd: windows[0].hwnd }).catch(() => {});
          } else {
            onLaunchNewInstance();
          }
        }}
        style={{
          width: sizeMode === 'small' ? '34px' : sizeMode === 'medium' ? '38px' : '44px',
          height: sizeMode === 'small' ? '34px' : sizeMode === 'medium' ? '38px' : '44px',
          borderRadius: sizeMode === 'small' ? '8px' : sizeMode === 'medium' ? '10px' : '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          cursor: 'pointer',
          transform: hovered ? 'translateY(-3px) scale(1.08)' : 'translateY(0) scale(1)',
          transition: 'transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {children ? (
          children
        ) : iconUrl ? (
          <img
            src={iconUrl}
            alt={appName}
            style={{
              width: sizeMode === 'small' ? '26px' : sizeMode === 'medium' ? '30px' : '36px',
              height: sizeMode === 'small' ? '26px' : sizeMode === 'medium' ? '30px' : '36px',
              borderRadius: sizeMode === 'small' ? '6px' : '8px',
              objectFit: 'contain',
            }}
          />
        ) : (
          <Layers size={sizeMode === 'small' ? 17 : sizeMode === 'medium' ? 20 : 22} color="#FFF" />
        )}

        {/* Badge Profil Chrome */}
        {profileBadge && (
          <span
            style={{
              position: 'absolute',
              top: '1px',
              right: '1px',
              background: accentColor,
              color: '#090D16',
              fontSize: sizeMode === 'small' ? '7px' : '8px',
              fontWeight: 800,
              padding: '1px 3px',
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            {profileBadge.slice(0, 3).toUpperCase()}
          </span>
        )}
      </div>

      {/* Indikator Titik Dinamis Berdasarkan Jumlah Jendela Aktif */}
      {windows.length > 0 && (
        <div style={{ display: 'flex', gap: sizeMode === 'small' ? '2px' : '3px', marginTop: '1px' }}>
          {windows.slice(0, 3).map((w) => (
            <span
              key={w.hwnd}
              style={{
                width: windows.length === 1 ? (sizeMode === 'small' ? '8px' : '10px') : (sizeMode === 'small' ? '3px' : '4px'),
                height: sizeMode === 'small' ? '2px' : '3px',
                borderRadius: '2px',
                background: accentColor,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
