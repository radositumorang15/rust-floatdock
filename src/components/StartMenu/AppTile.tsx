import React, { useState } from 'react';
import { AppEntry } from '../../types';
import { AppIconRenderer } from '../common/AppIcons';

import { ThemeConfig } from '../../themes/types';

interface AppTileProps {
  app: AppEntry;
  theme?: ThemeConfig;
  onClick: (app: AppEntry) => void;
}

export const AppTile: React.FC<AppTileProps> = ({ app, theme, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <div
      onClick={() => onClick(app)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        width: '84px',
        height: '76px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
        cursor: 'pointer',
        background: hovered ? 'var(--surface-chip)' : 'transparent',
        transform: pressed ? 'scale(0.95)' : 'none',
        transition: 'all var(--t-fast) var(--ease-out)',
        padding: '4px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: hovered ? 'scale(1.06)' : 'scale(1)',
          transition: 'transform var(--t-fast) var(--ease-out)',
        }}
      >
        {app.icon_url ? (
          <img
            src={app.icon_url}
            alt={app.name}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))',
            }}
          />
        ) : (
          <AppIconRenderer
            iconName={app.icon_name}
            size={40}
            theme={theme}
            parallaxY={hovered ? -1.5 : 0}
          />
        )}
      </div>
      <span
        style={{
          marginTop: '6px',
          fontSize: 'var(--fs-label)',
          fontWeight: 'var(--fw-semibold)',
          color: '#FFFFFF',
          width: '100%',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: 1.1,
        }}
      >
        {app.name}
      </span>
    </div>
  );
};
