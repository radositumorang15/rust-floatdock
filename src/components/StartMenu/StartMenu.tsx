import React, { useState, useEffect, useRef } from 'react';
import { AppEntry } from '../../types';
import { ThemeConfig } from '../../themes/types';
import { GeometricClover } from '../common/CloverIcon';
import { SearchInput } from './SearchInput';
import { AppGrid } from './AppGrid';
import { Footer } from './Footer';

interface StartMenuProps {
  apps: AppEntry[];
  theme?: ThemeConfig;
  onLaunchApp: (app: AppEntry) => void;
  onPowerAction: (action: string) => void;
  onClose?: () => void;
  onOpenSettings?: () => void;
}

function evaluateMathExpression(input: string): string | null {
  const cleaned = input.replace(/\s+/g, '');
  if (!/^[0-9+\-*/().%]+$/.test(cleaned) || !/[+\-*/%]/.test(cleaned)) {
    return null;
  }
  try {
    const result = Function(`"use strict"; return (${cleaned})`)();
    return typeof result === 'number' && isFinite(result) ? result.toLocaleString('id-ID') : null;
  } catch {
    return null;
  }
}

export const StartMenu: React.FC<StartMenuProps> = ({
  apps,
  theme,
  onLaunchApp,
  onPowerAction,
  onClose,
  onOpenSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [commandOutput, setCommandOutput] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleRunCommand = async () => {
    if (searchQuery.startsWith('>')) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const res = await invoke<string>('execute_omnibox_command', { cmd: searchQuery });
        setCommandOutput(res);
      } catch (err: any) {
        setCommandOutput(String(err));
      }
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchQuery.startsWith('>')) {
        handleRunCommand();
      } else if (mathResult) {
        navigator.clipboard.writeText(mathResult);
        setCommandOutput(`Hasil tersalin: ${mathResult}`);
      } else if (filteredApps.length > 0) {
        onLaunchApp(filteredApps[0]);
        onClose?.();
      }
    }
  };

  const categories = ['Semua', 'Sistem', 'Komunikasi', 'Media'];

  const filteredApps = apps.filter((app) => {
    const matchesSearch = !searchQuery.trim() ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'Semua' ||
      app.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const accentColor = theme?.accent || 'var(--accent)';
  const isGrimoire = theme?.id === 'grimoire';
  const mathResult = evaluateMathExpression(searchQuery);

  return (
    <div
      className="glass-menu"
      style={{
        width: '372px',
        height: '460px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        position: 'relative',
        background: theme?.liquidGlass?.tint || 'var(--glass-bg-strong)',
        borderColor: isGrimoire ? accentColor : 'var(--glass-border)',
        boxShadow: isGrimoire
          ? `0 0 24px ${theme?.glow?.color || accentColor}, var(--glass-shadow)`
          : 'var(--glass-shadow)',
        animation: 'fadeSlideUp var(--t-spring) var(--ease-spring)',
      }}
    >
      {/* Specular Highlight Top Edge */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '20px',
          right: '20px',
          height: '1px',
          background: isGrimoire
            ? `linear-gradient(90deg, transparent, ${accentColor}, transparent)`
            : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* Grimoire Header with Clover Motif if active */}
      {isGrimoire && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
            paddingBottom: '6px',
            borderBottom: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GeometricClover size={18} color={accentColor} />
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px', color: accentColor }}>
              GRIMOIRE SHELL
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
            MANA {theme?.manaAttribute?.toUpperCase() || 'WIND'}
          </span>
        </div>
      )}

      {/* 1. Search Bar */}
      <SearchInput
        value={searchQuery}
        onChange={(val) => {
          setSearchQuery(val);
          setCommandOutput(null);
        }}
        onKeyDown={handleInputKeyDown}
        inputRef={inputRef}
      />

      {/* OMNIBOX INSTANT CALCULATOR */}
      {mathResult && (
        <div
          onClick={() => navigator.clipboard.writeText(mathResult)}
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            borderRadius: '10px',
            background: 'rgba(56, 189, 248, 0.15)',
            border: `1px solid ${accentColor}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          <div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)' }}>Kalkulator Instan (Klik untuk salin)</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFF' }}>
              = {mathResult}
            </div>
          </div>
          <span style={{ fontSize: '10px', color: accentColor, fontWeight: 600 }}>Salin</span>
        </div>
      )}

      {/* OMNIBOX SYSTEM COMMAND PROMPT */}
      {searchQuery.startsWith('>') && (
        <div
          onClick={handleRunCommand}
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10B981',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#10B981', fontWeight: 700 }}>Perintah Cepat Sistem (Klik untuk jalankan)</span>
            <span style={{ fontSize: '10px', color: '#FFF', opacity: 0.7 }}>Enter / Klik</span>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#FFF', fontFamily: 'monospace' }}>
            {commandOutput || `Jalankan: ${searchQuery}`}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          marginTop: '6px',
          overflowX: 'auto',
          paddingBottom: '2px',
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              background: selectedCategory === cat ? (isGrimoire ? accentColor : 'var(--accent)') : 'rgba(255, 255, 255, 0.12)',
              color: selectedCategory === cat && isGrimoire ? '#0B1C14' : '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '3px 10px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 140ms ease-out',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 2. Applications Grid (4x3) */}
      <div style={{ flex: 1, minHeight: 0, marginTop: '4px' }}>
        <AppGrid apps={filteredApps} theme={theme} onLaunch={onLaunchApp} />
      </div>

      {/* BAR AKSES CEPAT FOLDER */}
      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
        {[
          { id: 'downloads', label: '📥 Downloads' },
          { id: 'documents', label: '📄 Docs' },
          { id: 'projects', label: '💻 Projects' },
          { id: 'pictures', label: '🖼️ Pics' },
          { id: 'desktop', label: '🖥️ Desktop' },
        ].map((folder) => (
          <button
            key={folder.id}
            onClick={async () => {
              const { invoke } = await import('@tauri-apps/api/core');
              invoke('open_quick_folder', { folderKey: folder.id }).catch(() => {});
            }}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '4px 6px',
              color: '#FFF',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {folder.label}
          </button>
        ))}
      </div>

      {/* 3. Separator line */}
      <div
        style={{
          height: '1px',
          background: 'rgba(255, 255, 255, 0.2)',
          marginTop: '6px',
          width: '100%',
        }}
      />

      {/* 4. Footer */}
      <Footer onPowerAction={onPowerAction} onOpenSettings={onOpenSettings} />
    </div>
  );
};
