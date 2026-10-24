import React, { useState, useEffect } from 'react';
import { Play, Pause, Bell } from 'lucide-react';
import { MediaState, TimerState } from '../../types';
import { ThemeConfig } from '../../themes/types';

interface NotchProps {
  timer?: TimerState;
  media?: MediaState;
  theme?: ThemeConfig;
  onTogglePlayback?: () => void;
  onResize?: (width: number, height: number) => void;
}

export const Notch: React.FC<NotchProps> = ({
  timer,
  media,
  theme,
  onTogglePlayback,
  onResize,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [timeStr, setTimeStr] = useState('12:44');
  const [dateStr, setDateStr] = useState('24 Okt');

  // Clock updates
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setTimeStr(`${h}:${m}`);

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nop', 'Des'];
      setDateStr(`${now.getDate()} ${months[now.getMonth()]}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Blinking eyes animation every 4-6 seconds
  useEffect(() => {
    const triggerBlink = () => {
      setBlinking(true);
      setTimeout(() => {
        setBlinking(false);
      }, 140); // 140ms per DESIGN.md
    };

    const interval = setInterval(() => {
      triggerBlink();
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Determine current mode and dimensions
  const isTimerFinished = timer?.is_finished;
  let width = 116;
  let height = 36;

  if (isTimerFinished) {
    width = 280;
    height = 48;
  } else if (isHovered) {
    width = 240;
    height = 40;
  }

  // Notify backend to resize window
  useEffect(() => {
    onResize?.(width, height);
  }, [width, height, onResize]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        width: '100vw',
        height: '100vh',
        background: 'transparent',
      }}
    >
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          background: 'var(--notch-bg)',
          borderRadius: 'var(--r-notch)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          cursor: 'pointer',
          userSelect: 'none',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
          transition: 'width 220ms cubic-bezier(0.2, 0.8, 0.2, 1), height 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          padding: '0 14px',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {isTimerFinished ? (
          // Timer finished alert state
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="#FF5A52" />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              Waktu {timer.label} Habis!
            </span>
          </div>
        ) : isHovered ? (
          // Hover expanded state: Clock & Media
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>{timeStr}</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                {dateStr}
              </span>
            </div>

            {media && media.has_media && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePlayback?.();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.85)',
                    maxWidth: '90px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {media.title}
                </span>
                {media.is_playing ? <Pause size={14} /> : <Play size={14} />}
              </div>
            )}
          </div>
        ) : (
          // Idle state: Two reactive eyes ("..") with mana aura or clean white
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: theme?.accent || '#FFFFFF',
                boxShadow: theme?.id === 'grimoire' ? `0 0 8px ${theme.accent}` : undefined,
                transform: blinking ? 'scaleY(0.1)' : 'scaleY(1)',
                transition: 'transform 80ms ease-in-out, background 200ms ease',
              }}
            />
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: theme?.accent || '#FFFFFF',
                boxShadow: theme?.id === 'grimoire' ? `0 0 8px ${theme.accent}` : undefined,
                transform: blinking ? 'scaleY(0.1)' : 'scaleY(1)',
                transition: 'transform 80ms ease-in-out, background 200ms ease',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
