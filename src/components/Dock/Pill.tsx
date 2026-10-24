import React from 'react';
import { TimerState } from '../../types';
import { ThemeConfig } from '../../themes/types';

interface PillProps {
  timer: TimerState;
  theme?: ThemeConfig;
  onToggle: () => void;
  onReset: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export const Pill: React.FC<PillProps> = ({ timer, theme, onToggle, onReset, onContextMenu }) => {
  const isGrimoire = theme?.id === 'grimoire';
  const accent = theme?.accent || 'var(--accent)';

  // Calculate mana fill percentage (0 to 1)
  const progress = timer.total_seconds > 0
    ? Math.min(1, Math.max(0, (timer.total_seconds - timer.remaining_seconds) / timer.total_seconds))
    : 0;

  // Circular mana ring radius and circumference
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div
      onClick={onToggle}
      onDoubleClick={onReset}
      onContextMenu={onContextMenu}
      className="glass-chip"
      title={timer.is_running ? 'Klik untuk jeda timer (Double-klik untuk reset)' : 'Klik untuk lanjut timer'}
      style={{
        width: isGrimoire ? '88px' : '76px',
        height: '44px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isGrimoire ? '6px' : '0',
        cursor: 'pointer',
        userSelect: 'none',
        flexShrink: 0,
        lineHeight: 1.1,
        position: 'relative',
        border: isGrimoire ? `1px solid ${accent}` : undefined,
        boxShadow: isGrimoire ? `0 0 10px ${theme?.glow.color}` : undefined,
        transition: 'all 220ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Grimoire Circular Mana Ring */}
      {isGrimoire && (
        <svg
          width="28"
          height="28"
          viewBox="0 0 44 44"
          style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}
        >
          {/* Background track */}
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="3.5"
          />
          {/* Filled mana ring */}
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            stroke={accent}
            strokeWidth="3.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 500ms ease-out',
              filter: `drop-shadow(0 0 4px ${accent})`,
            }}
          />
        </svg>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: 'var(--fs-pill)',
            fontWeight: 'var(--fw-bold)',
            color: timer.is_finished ? 'var(--danger)' : isGrimoire ? accent : 'var(--text-primary)',
            letterSpacing: '-0.3px',
          }}
        >
          {timer.formatted_time}
        </span>
        <span
          style={{
            fontSize: 'var(--fs-small)',
            fontWeight: 'var(--fw-regular)',
            color: 'var(--text-secondary)',
            marginTop: '1px',
          }}
        >
          {timer.label}
        </span>
      </div>
    </div>
  );
};

