import React, { useState } from 'react';
import { Power, Moon, RotateCcw, Lock, LogOut, Palette } from 'lucide-react';

interface FooterProps {
  onPowerAction: (action: string) => void;
  onOpenAccount?: () => void;
  onOpenSettings?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onPowerAction, onOpenAccount, onOpenSettings }) => {
  const [showPowerMenu, setShowPowerMenu] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '40px',
        marginTop: '8px',
        padding: '0 4px',
        userSelect: 'none',
      }}
    >
      {/* User Profile */}
      <div
        onClick={onOpenAccount}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          padding: '4px 6px',
          borderRadius: '8px',
          transition: 'background var(--t-fast) var(--ease-out)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        {/* Avatar Circular */}
        <div
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF9A8B 0%, #FF6A88 55%, #FF99AC 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            border: '1.5px solid rgba(255, 255, 255, 0.4)',
          }}
        >
          {/* Avatar icon / character */}
          <span style={{ fontSize: '13px', lineHeight: 1 }}>🧑‍💻</span>
        </div>
        <span
          style={{
            fontSize: 'var(--fs-body)',
            fontWeight: 'var(--fw-semibold)',
            color: 'var(--text-primary)',
          }}
        >
          Awal
        </span>
      </div>

      {/* Action Buttons: Theme/Settings + Power */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {onOpenSettings && (
          <div
            onClick={onOpenSettings}
            className="glass-chip"
            title="Pengaturan Tema & Float Dock"
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              background: 'var(--surface-chip)',
            }}
          >
            <Palette size={14} color="#FFFFFF" />
          </div>
        )}

        {/* Power Button */}
        <div
          onClick={() => setShowPowerMenu(!showPowerMenu)}
          className="glass-chip"
          title="Opsi Daya"
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            background: showPowerMenu ? 'var(--surface-chip-hover)' : 'var(--surface-chip)',
          }}
        >
          <Power size={14} color="#FFFFFF" />
        </div>
      </div>

      {/* Power Action Flyout */}
      {showPowerMenu && (
        <div
          className="glass-menu"
          style={{
            position: 'absolute',
            bottom: '42px',
            right: '0',
            width: '160px',
            padding: '6px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 99999,
          }}
        >
          <div
            onClick={() => {
              onPowerAction('sleep');
              setShowPowerMenu(false);
            }}
            style={{
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0 8px',
              fontSize: '12px',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#FFFFFF',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Moon size={14} />
            <span>Tidur</span>
          </div>

          <div
            onClick={() => {
              onPowerAction('restart');
              setShowPowerMenu(false);
            }}
            style={{
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0 8px',
              fontSize: '12px',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#FFFFFF',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <RotateCcw size={14} />
            <span>Mulai Ulang</span>
          </div>

          <div
            onClick={() => {
              onPowerAction('lock');
              setShowPowerMenu(false);
            }}
            style={{
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0 8px',
              fontSize: '12px',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#FFFFFF',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Lock size={14} />
            <span>Kunci</span>
          </div>

          <div
            onClick={() => {
              onPowerAction('signout');
              setShowPowerMenu(false);
            }}
            style={{
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0 8px',
              fontSize: '12px',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#FFFFFF',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <LogOut size={14} />
            <span>Keluar</span>
          </div>

          <div
            onClick={() => {
              onPowerAction('shutdown');
              setShowPowerMenu(false);
            }}
            style={{
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0 8px',
              fontSize: '12px',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#FF5A52',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,90,82,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Power size={14} />
            <span>Matikan</span>
          </div>
        </div>
      )}
    </div>
  );
};
