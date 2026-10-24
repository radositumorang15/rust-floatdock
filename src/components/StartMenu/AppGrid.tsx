import React from 'react';
import { AppEntry } from '../../types';
import { AppTile } from './AppTile';

import { ThemeConfig } from '../../themes/types';

interface AppGridProps {
  apps: AppEntry[];
  theme?: ThemeConfig;
  onLaunch: (app: AppEntry) => void;
}

export const AppGrid: React.FC<AppGridProps> = ({ apps, theme, onLaunch }) => {
  return (
    <div
      role="grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '4px 2px',
        width: '100%',
        marginTop: '12px',
        maxHeight: '270px',
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingRight: '2px',
      }}
    >
      {apps.map((app) => (
        <AppTile key={app.id} app={app} theme={theme} onClick={onLaunch} />
      ))}
    </div>
  );
};
