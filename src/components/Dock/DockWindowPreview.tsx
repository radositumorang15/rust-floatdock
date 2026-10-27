import React, { useState, useEffect } from 'react';
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
  onFocusWindow: (hwnd: number) => void;
  onCloseWindow: (hwnd: number) => void;
  onLaunchNewInstance: () => void;
  onPreviewHoverChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export const DockIconWithPreview: React.FC<DockAppPreviewProps> = ({
  appName,
  iconUrl,
  profileBadge,
  windows,
  accentColor = '#38BDF8',
  onFocusWindow,
  onCloseWindow,
  onLaunchNewInstance,
  onPreviewHoverChange,
  children,
}) => {
  const [hovered, setHovered] = useState(false);
  const [chromeProfiles, setChromeProfiles] = useState<ChromeProfileEntry[]>([]);

  const isChrome =
    appName.toLowerCase().includes('chrome') ||
    Boolean(profileBadge) ||
    windows.some((w) => w.title.toLowerCase().includes('google chrome'));

  const hasOverlayContent = windows.length > 0 || (isChrome && chromeProfiles.length > 0);

  useEffect(() => {
    onPreviewHoverChange?.(hovered && hasOverlayContent);
  }, [hovered, hasOverlayContent, onPreviewHoverChange]);

  useEffect(() => {
    if (hovered && isChrome) {
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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={handleMouseDown}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      {/* KARTU PREVIEW JENDELA & PROFIL SAAT HOVER */}
      {hovered && hasOverlayContent && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: '58px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(11, 15, 25, 0.96)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            borderRadius: '16px',
            padding: '10px 12px',
            minWidth: '260px',
            maxWidth: '380px',
            width: 'max-content',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 9999,
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(20px)',
            pointerEvents: 'auto',
          }}
        >
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
                maxHeight: '160px',
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                paddingRight: '2px',
              }}
            >
              {windows.map((win) => (
                <div
                  key={win.hwnd}
                  onClick={() => onFocusWindow(win.hwnd)}
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
                  maxHeight: '90px',
                  overflowY: 'auto',
                  scrollbarWidth: 'thin',
                }}
              >
                {chromeProfiles.slice(0, 12).map((prof) => (
                  <button
                    key={prof.dir}
                    onClick={() => handleLaunchProfile(prof.dir)}
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
        onClick={() => {
          if (windows.length > 0) {
            onFocusWindow(windows[0].hwnd);
          } else {
            onLaunchNewInstance();
          }
        }}
        style={{
          width: '46px',
          height: '46px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          cursor: 'pointer',
          transform: hovered ? 'translateY(-4px) scale(1.08)' : 'translateY(0) scale(1)',
          transition: 'transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {children ? (
          children
        ) : iconUrl ? (
          <img
            src={iconUrl}
            alt={appName}
            style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'contain' }}
          />
        ) : (
          <Layers size={22} color="#FFF" />
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
              fontSize: '8px',
              fontWeight: 800,
              padding: '1px 4px',
              borderRadius: '5px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            {profileBadge.slice(0, 3).toUpperCase()}
          </span>
        )}
      </div>

      {/* Indikator Titik Dinamis Berdasarkan Jumlah Jendela Aktif */}
      {windows.length > 0 && (
        <div style={{ display: 'flex', gap: '3px', marginTop: '2px' }}>
          {windows.slice(0, 3).map((w) => (
            <span
              key={w.hwnd}
              style={{
                width: windows.length === 1 ? '10px' : '4px',
                height: '3px',
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
