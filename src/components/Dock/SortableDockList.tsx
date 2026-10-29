import React, { useState, useRef } from 'react';
import { DockIconWithPreview } from './DockWindowPreview';
import { AppIconRenderer } from '../common/AppIcons';
import { WindowInstance } from '../../types';
import { ThemeConfig } from '../../themes/types';

export interface DockItemData {
  id: string;
  name: string;
  execPath: string;
  iconName: string;
  iconUrl?: string;
  profileBadge?: string;
  isPinned: boolean;
  windows: WindowInstance[];
}

interface SortableDockListProps {
  items: DockItemData[];
  theme?: ThemeConfig;
  accentColor?: string;
  sizeMode?: 'small' | 'medium' | 'large';
  onFocusWindow: (hwnd: number) => void;
  onCloseWindow: (hwnd: number) => void;
  onLaunchApp: (item: DockItemData) => void;
  onContextMenu?: (e: React.MouseEvent, item: DockItemData) => void;
  onPreviewHoverChange?: (open: boolean) => void;
}

const STORAGE_ORDER_KEY = 'floatdock_pinned_order_v1';

const DockIconImage: React.FC<{
  name: string;
  iconUrl?: string;
  iconName: string;
  theme?: ThemeConfig;
  sizeMode?: 'small' | 'medium' | 'large';
}> = ({ name, iconUrl, iconName, theme, sizeMode = 'medium' }) => {
  const [loadError, setLoadError] = useState(false);
  const px = sizeMode === 'small' ? '26px' : sizeMode === 'medium' ? '30px' : '36px';
  const iconNum = sizeMode === 'small' ? 26 : sizeMode === 'medium' ? 30 : 36;

  if (iconUrl && !loadError) {
    return (
      <img
        src={iconUrl}
        alt={name}
        onError={() => setLoadError(true)}
        style={{
          width: px,
          height: px,
          borderRadius: sizeMode === 'small' ? '6px' : '8px',
          objectFit: 'contain',
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))',
          pointerEvents: 'none',
        }}
      />
    );
  }
  return <AppIconRenderer iconName={iconName} size={iconNum} theme={theme} />;
};

export const SortableDockList: React.FC<SortableDockListProps> = ({
  items,
  theme,
  accentColor = '#38BDF8',
  sizeMode = 'medium',
  onFocusWindow,
  onCloseWindow,
  onLaunchApp,
  onContextMenu,
  onPreviewHoverChange,
}) => {
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const previewTimerRef = useRef<number | null>(null);

  const handlePreviewHover = (id: string, open: boolean) => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }

    if (open) {
      setActivePreviewId(id);
      onPreviewHoverChange?.(true);
    } else {
      previewTimerRef.current = window.setTimeout(() => {
        setActivePreviewId((current) => {
          if (current === id) {
            onPreviewHoverChange?.(false);
            return null;
          }
          return current;
        });
        previewTimerRef.current = null;
      }, 140);
    }
  };

  const [orderedIds, setOrderedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ORDER_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Pisahkan aplikasi Pinned dan Unpinned (Running only)
  const pinnedItems = items
    .filter((item) => item.isPinned)
    .sort((a, b) => {
      const idxA = orderedIds.indexOf(a.id);
      const idxB = orderedIds.indexOf(b.id);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

  const unpinnedRunningItems = items.filter(
    (item) => !item.isPinned && item.windows.length > 0
  );

  // Simpan urutan baru saat di-drag
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const currentOrder = pinnedItems.map((i) => i.id);
    const fromIdx = currentOrder.indexOf(draggedId);
    const toIdx = currentOrder.indexOf(targetId);

    if (fromIdx !== -1 && toIdx !== -1) {
      const updated = [...currentOrder];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      setOrderedIds(updated);
      localStorage.setItem(STORAGE_ORDER_KEY, JSON.stringify(updated));
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: sizeMode === 'small' ? '4px' : sizeMode === 'medium' ? '5px' : '6px' }}>
      {/* 1. DAFTAR APLIKASI PINNED (Bisa di-Reorder dengan Drag & Drop) */}
      {pinnedItems.map((app) => (
        <div
          key={app.id}
          draggable
          onDragStart={() => setDraggedId(app.id)}
          onDragOver={(e) => handleDragOver(e, app.id)}
          onDragEnd={() => setDraggedId(null)}
          onContextMenu={(e) => onContextMenu?.(e, app)}
          style={{
            opacity: draggedId === app.id ? 0.45 : 1,
            transform: draggedId === app.id ? 'scale(0.92)' : 'scale(1)',
            transition: 'transform 150ms ease, opacity 150ms ease',
          }}
        >
          <DockIconWithPreview
            appName={app.name}
            iconUrl={app.iconUrl}
            iconName={app.iconName}
            profileBadge={app.profileBadge}
            windows={app.windows}
            accentColor={accentColor}
            sizeMode={sizeMode}
            isAnyPreviewOpen={Boolean(activePreviewId)}
            onFocusWindow={onFocusWindow}
            onCloseWindow={onCloseWindow}
            onLaunchNewInstance={() => onLaunchApp(app)}
            onPreviewHoverChange={(open) => handlePreviewHover(app.id, open)}
          >
            <DockIconImage
              name={app.name}
              iconUrl={app.iconUrl}
              iconName={app.iconName}
              theme={theme}
              sizeMode={sizeMode}
            />
          </DockIconWithPreview>
        </div>
      ))}

      {/* 2. SEPARATOR VERTIKAL OTOMATIS (Jika ada aplikasi unpinned yang sedang aktif) */}
      {pinnedItems.length > 0 && unpinnedRunningItems.length > 0 && (
        <div
          style={{
            width: '1px',
            height: sizeMode === 'small' ? '18px' : sizeMode === 'medium' ? '22px' : '26px',
            background: 'rgba(255, 255, 255, 0.22)',
            margin: sizeMode === 'small' ? '0 2px' : '0 4px',
            borderRadius: '1px',
          }}
        />
      )}

      {/* 3. DAFTAR APLIKASI AKTIF NON-PINNED (Termasuk Profil Chrome Tambahan) */}
      {unpinnedRunningItems.map((app) => (
        <div key={app.id} onContextMenu={(e) => onContextMenu?.(e, app)}>
          <DockIconWithPreview
            appName={app.name}
            iconUrl={app.iconUrl}
            iconName={app.iconName}
            profileBadge={app.profileBadge}
            windows={app.windows}
            accentColor={accentColor}
            sizeMode={sizeMode}
            isAnyPreviewOpen={Boolean(activePreviewId)}
            onFocusWindow={onFocusWindow}
            onCloseWindow={onCloseWindow}
            onLaunchNewInstance={() => onLaunchApp(app)}
            onPreviewHoverChange={(open) => handlePreviewHover(app.id, open)}
          >
            <DockIconImage
              name={app.name}
              iconUrl={app.iconUrl}
              iconName={app.iconName}
              theme={theme}
              sizeMode={sizeMode}
            />
          </DockIconWithPreview>
        </div>
      ))}
    </div>
  );
};
