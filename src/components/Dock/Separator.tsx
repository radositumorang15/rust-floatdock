import React from 'react';

export const Separator: React.FC = () => {
  return (
    <div
      style={{
        width: '1px',
        height: '32px',
        background: 'rgba(255, 255, 255, 0.3)',
        margin: '0 8px',
        flexShrink: 0,
      }}
    />
  );
};
