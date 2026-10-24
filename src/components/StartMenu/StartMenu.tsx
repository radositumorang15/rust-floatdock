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

  return (
    <div
      className="glass-menu"
      style={{
        width: '368px',
        height: '448px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        position: 'relative',
        background: theme?.liquidGlass.tint || 'var(--glass-bg-strong)',
        borderColor: isGrimoire ? accentColor : 'var(--glass-border)',
        boxShadow: isGrimoire
          ? `0 0 24px ${theme?.glow.color}, var(--glass-shadow)`
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
            marginBottom: '10px',
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
        onChange={setSearchQuery}
        inputRef={inputRef}
      />

      {/* Category Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          marginTop: '8px',
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

      {/* 3. Separator line */}
      <div
        style={{
          height: '1px',
          background: 'rgba(255, 255, 255, 0.2)',
          marginTop: '8px',
          width: '100%',
        }}
      />

      {/* 4. Footer */}
      <Footer onPowerAction={onPowerAction} onOpenSettings={onOpenSettings} />
    </div>
  );
};
