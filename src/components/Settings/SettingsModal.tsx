import React, { useState } from 'react';
import { Settings, Eye, Sliders, Palette, Shield, Sparkles, RefreshCw, Wand2, Film } from 'lucide-react';
import { ThemeConfig, ManaAttribute, MANA_PALETTES } from '../../themes/types';
import { AVAILABLE_THEMES } from '../../themes/presets';

interface SettingsProps {
  currentTheme?: ThemeConfig;
  onThemeChange?: (theme: ThemeConfig) => void;
  onManaChange?: (mana: ManaAttribute) => void;
  onClose?: () => void;
  onToggleTaskbar?: (hide: boolean) => void;
}

export const SettingsModal: React.FC<SettingsProps> = ({
  currentTheme = AVAILABLE_THEMES[0],
  onThemeChange,
  onManaChange,
  onClose,
  onToggleTaskbar,
}) => {
  const [iconSize, setIconSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [magnification, setMagnification] = useState(true);
  const [autoHide, setAutoHide] = useState(() => {
    return localStorage.getItem('floatdock_autohide') === 'true';
  });
  const [taskbarHidden, setTaskbarHidden] = useState(true);
  const [videoBg, setVideoBg] = useState(() => {
    return localStorage.getItem('dock_video_bg') !== 'false';
  });
  const [selectedThemeId, setSelectedThemeId] = useState(currentTheme.id);
  const [selectedMana, setSelectedMana] = useState<ManaAttribute>(currentTheme.manaAttribute || 'wind');

  const handleToggleVideoBg = (enabled: boolean) => {
    setVideoBg(enabled);
    localStorage.setItem('dock_video_bg', String(enabled));
    window.dispatchEvent(new Event('storage'));
  };

  React.useEffect(() => {
    setSelectedThemeId(currentTheme.id);
    if (currentTheme.manaAttribute) {
      setSelectedMana(currentTheme.manaAttribute);
    }
  }, [currentTheme]);

  const handleToggleTaskbar = () => {
    const nextState = !taskbarHidden;
    setTaskbarHidden(nextState);
    onToggleTaskbar?.(nextState);
  };

  const handleSelectTheme = (themeId: string) => {
    setSelectedThemeId(themeId);
    const found = AVAILABLE_THEMES.find((t) => t.id === themeId);
    if (found) {
      onThemeChange?.(found);
    }
  };

  const handleSelectMana = (attr: ManaAttribute) => {
    setSelectedMana(attr);
    onManaChange?.(attr);
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
        background: 'rgba(10, 18, 30, 0.75)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div
        className="glass-menu"
        style={{
          width: '580px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '20px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          border: `1px solid ${currentTheme.accent}`,
          overflow: 'hidden',
          animation: 'fadeSlideUp var(--t-spring) var(--ease-spring)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={20} color={currentTheme.accent} />
            <span style={{ fontSize: '16px', fontWeight: 700 }}>Pengaturan Float Dock</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: '#FFFFFF',
                borderRadius: '8px',
                padding: '6px 14px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Tutup
            </button>
          )}
        </div>

        {/* Content list */}
        <div
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto',
          }}
        >
          {/* 1. Theme Pack Selection */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Palette size={18} color="var(--text-secondary)" />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Theme Pack Preset</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Pilih gaya visual dock & start menu</div>
              </div>
            </div>
            <select
              value={selectedThemeId}
              onChange={(e) => handleSelectTheme(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                padding: '6px 12px',
                borderRadius: '8px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {AVAILABLE_THEMES.map((t) => (
                <option key={t.id} value={t.id} style={{ background: '#1E293B' }}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Grimoire Mana Elemental Attributes */}
          {selectedThemeId === 'grimoire' && (
            <div
              style={{
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(124, 255, 178, 0.1)',
                border: `1px solid ${currentTheme.accent}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Wand2 size={16} color={currentTheme.accent} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: currentTheme.accent }}>
                  Atribut Mana Elemen
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {(Object.keys(MANA_PALETTES) as ManaAttribute[]).map((attr) => {
                  const pal = MANA_PALETTES[attr];
                  const isSelected = selectedMana === attr;
                  return (
                    <button
                      key={attr}
                      onClick={() => handleSelectMana(attr)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        background: isSelected ? pal.color : 'rgba(255,255,255,0.1)',
                        color: isSelected ? '#0B1C14' : '#FFFFFF',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 600,
                        transition: 'all 140ms ease-out',
                      }}
                    >
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: pal.color,
                          boxShadow: `0 0 6px ${pal.color}`,
                        }}
                      />
                      <span>{pal.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Icon Size */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sliders size={18} color="var(--text-secondary)" />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Ukuran Ikon Dock</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Kecil (40px), Sedang (48px), Besar (56px)</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['small', 'medium', 'large'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setIconSize(s)}
                  style={{
                    background: iconSize === s ? currentTheme.accent : 'rgba(255,255,255,0.12)',
                    color: iconSize === s ? '#0B1C14' : '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {s === 'small' ? '40px' : s === 'medium' ? '48px' : '56px'}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Magnification */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Eye size={18} color="var(--text-secondary)" />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Magnifikasi Gaussian Kontinu</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Kurva gelombang halus berbasis jarak kursor mouse</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={magnification}
              onChange={(e) => setMagnification(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          {/* 5. Auto-Hide */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={18} color="var(--text-secondary)" />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Sembunyikan Otomatis (Auto-Hide)</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Dock melayang saat kursor mendekat ke tepi bawah</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoHide}
              onChange={(e) => {
                const val = e.target.checked;
                setAutoHide(val);
                localStorage.setItem('floatdock_autohide', String(val));
                window.dispatchEvent(new Event('storage'));
              }}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          {/* 6. Windows Taskbar Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={18} color="var(--text-secondary)" />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Sembunyikan Taskbar Bawaan</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Gantikan taskbar Windows dengan Float Dock</div>
              </div>
            </div>
            <button
              onClick={handleToggleTaskbar}
              style={{
                background: taskbarHidden ? currentTheme.accent : 'rgba(255,255,255,0.2)',
                color: taskbarHidden ? '#0B1C14' : '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {taskbarHidden ? 'Tersembunyi' : 'Tampilkan'}
            </button>
          </div>

          {/* 7. Animated Video Backdrop (Asta Demon Black Clover) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Film size={18} color="var(--text-secondary)" />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Animated Video Backdrop (Asta Demon)</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Putar visual Asta Demon Black Clover di balik kaca dock</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={videoBg}
              onChange={(e) => handleToggleVideoBg(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '12px 20px',
            borderTop: '1px solid rgba(255,255,255,0.15)',
            gap: '8px',
          }}
        >
          <button
            onClick={() => {
              setIconSize('medium');
              setMagnification(true);
              setAutoHide(false);
              handleSelectTheme('liquid-glass');
            }}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '6px 14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} />
            <span>Reset ke Default</span>
          </button>
        </div>
      </div>
    </div>
  );
};
