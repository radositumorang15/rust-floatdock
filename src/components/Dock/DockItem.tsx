import React, { useState, memo } from 'react';
import { AppEntry, TrackedWindow } from '../../types';
import { AppIconRenderer } from '../common/AppIcons';
import { Tooltip } from '../common/Tooltip';

import { ThemeConfig } from '../../themes/types';

interface DockItemProps {
  app: AppEntry;
  runningWindow?: TrackedWindow;
  mouseRelativeX: number | null;
  index: number;
  accentColor?: string;
  theme?: ThemeConfig;
  onClick: (app: AppEntry, running?: TrackedWindow) => void;
  onContextMenu: (e: React.MouseEvent, app: AppEntry, running?: TrackedWindow) => void;
}

const DockItemComponent: React.FC<DockItemProps> = ({
  app,
  runningWindow,
  mouseRelativeX,
  index,
  accentColor = 'var(--accent)',
  theme,
  onClick,
  onContextMenu,
}) => {
  const [pressed, setPressed] = useState(false);

  // Gaussian Continuous Distance-Based Magnification
  // Pitch = 54px (48px item + 6px margin), center is index * 54 + 27
  const itemCenterX = index * 54 + 27;
  let scale = 1.0;
  let translateY = 0;
  let parallaxX = 0;
  let parallaxY = 0;

  if (mouseRelativeX !== null) {
    const rawDist = mouseRelativeX - itemCenterX;
    const dist = Math.abs(rawDist);
    if (dist < 180) {
      const sigma = 65; // Gaussian spread radius
      const factor = Math.exp(-(dist * dist) / (2 * sigma * sigma));
      scale = 1.0 + 0.35 * factor;
      translateY = -10 * factor;
      // 1-2px micro-parallax shift following cursor
      parallaxX = Math.max(-2, Math.min(2, (rawDist / 80) * 1.8));
      parallaxY = -1.2 * factor;
    }
  }

  if (pressed) {
    scale *= 0.94;
  }

  const isRunning = Boolean(runningWindow);
  const isActive = Boolean(runningWindow?.is_active);

  return (
    <Tooltip text={app.name}>
      <div
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onClick={() => onClick(app, runningWindow)}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu(e, app, runningWindow);
        }}
        style={{
          width: '48px',
          height: '48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          cursor: 'pointer',
          transform: `translate3d(0, ${translateY.toFixed(2)}px, 0) scale3d(${scale.toFixed(3)}, ${scale.toFixed(3)}, 1)`,
          transition: 'transform 160ms cubic-bezier(0.16, 1, 0.3, 1)',
          transformOrigin: 'bottom center',
          margin: '0 3px',
          flexShrink: 0,
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        {/* Active Window Radial Glow Blob (DESIGN-v0.2 Section 2.1) */}
        {isActive && (
          <div
            className="app-active-glow-blob"
            style={{
              background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
            }}
          />
        )}

        <div
          style={{
            width: '42px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--r-icon)',
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <AppIconRenderer
            iconName={app.icon_name}
            size={42}
            theme={theme}
            parallaxX={parallaxX}
            parallaxY={parallaxY}
          />
        </div>

        {/* Profile Avatar Badge */}
        {runningWindow?.profile_name && (
          <div
            title={`Profil: ${runningWindow.profile_name}`}
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              minWidth: '14px',
              height: '14px',
              padding: '0 3px',
              borderRadius: '7px',
              background: accentColor,
              color: '#090D16',
              fontSize: '9px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 3,
              boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.6)',
              lineHeight: 1,
            }}
          >
            {runningWindow.profile_name.slice(0, 1).toUpperCase()}
          </div>
        )}

        {/* Indicators below icon (DESIGN-v0.2) */}
        {isActive ? (
          <div className="app-active-indicator-pill" style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }} />
        ) : isRunning ? (
          <div className="app-running-dot" />
        ) : null}
      </div>
    </Tooltip>
  );
};

export const DockItem = memo(DockItemComponent);
