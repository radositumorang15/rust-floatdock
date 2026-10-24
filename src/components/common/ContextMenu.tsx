import React, { useEffect, useRef } from 'react';
import { ContextMenuState } from '../../types';

interface ContextMenuProps {
  menu: ContextMenuState;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ menu, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (menu.visible) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menu.visible, onClose]);

  if (!menu.visible) return null;

  return (
    <div
      ref={menuRef}
      className="context-menu glass-menu"
      style={{
        position: 'fixed',
        left: `${menu.x}px`,
        top: `${menu.y}px`,
        zIndex: 999999,
        padding: '6px',
        minWidth: '170px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        borderRadius: '14px',
        backdropFilter: 'blur(32px)',
        border: '1px solid rgba(255,255,255,0.25)',
      }}
    >
      {menu.items.map((item, idx) => (
        <div
          key={idx}
          className="context-menu-item"
          onClick={() => {
            item.action();
            onClose();
          }}
          style={{
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
            fontSize: '12px',
            fontWeight: 500,
            borderRadius: '8px',
            cursor: 'pointer',
            color: item.danger ? '#FF5A52' : '#FFFFFF',
            transition: 'background 120ms ease-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
};
