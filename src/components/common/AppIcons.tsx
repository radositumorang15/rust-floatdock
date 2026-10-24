import React from 'react';
import { ThemeConfig } from '../../themes/types';

interface IconProps {
  size?: number;
  className?: string;
  parallaxX?: number;
  parallaxY?: number;
}

/**
 * Standardized Squircle Tile Container
 * Provides 1px specular highlight, 8-10% inner depth gradient, and 0 4px 10px soft shadow.
 */
export const SquircleTile: React.FC<{
  size?: number;
  bgGradient: string;
  className?: string;
  parallaxX?: number;
  parallaxY?: number;
  children: React.ReactNode;
}> = ({
  size = 44,
  bgGradient,
  className = '',
  parallaxX = 0,
  parallaxY = 0,
  children,
}) => {
  // Clamped parallax: -2px to +2px
  const clampedX = Math.max(-2, Math.min(2, parallaxX));
  const clampedY = Math.max(-2, Math.min(2, parallaxY));

  return (
    <div
      className={`squircle-icon-tile ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: bgGradient,
      }}
    >
      <div
        className="icon-glyph-parallax"
        style={{
          transform: `translate3d(${clampedX}px, ${clampedY}px, 0)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ==========================================
// 1. BUILT-IN APPLICATION ICONS (Fluent Color / 3D)
// ==========================================

export const ExplorerIcon: React.FC<IconProps> = ({ size = 44, parallaxX = 0, parallaxY = 0 }) => (
  <SquircleTile size={size} bgGradient="linear-gradient(145deg, #FCD34D 0%, #D97706 100%)" parallaxX={parallaxX} parallaxY={parallaxY}>
    <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 32 32" fill="none">
      {/* Back folder flap */}
      <path d="M4 8C4 6.89543 4.89543 6 6 6H13.2C14.0485 6 14.8622 6.33714 15.4627 6.9377L17.0627 8.5377C17.6633 9.13826 18.477 9.4754 19.3255 9.4754H26C27.1046 9.4754 28 10.37 28 11.4754V21C28 22.1046 27.1046 23 26 23H6C4.89543 23 4 22.1046 4 21V8Z" fill="#B45309" fillOpacity="0.4" />
      {/* Document Sheet inside */}
      <rect x="7" y="10" width="18" height="12" rx="1.5" fill="#E0F2FE" />
      <rect x="10" y="13" width="7" height="2" rx="1" fill="#0284C7" />
      <rect x="10" y="17" width="12" height="2" rx="1" fill="#BAE6FD" />
      {/* Front folder flap with 3D gradient */}
      <path d="M3 13.5C3 12.3954 3.89543 11.5 5 11.5H27C28.1046 11.5 29 12.3954 29 13.5V23C29 24.1046 28.1046 25 27 25H5C3.89543 25 3 24.1046 3 23V13.5Z" fill="url(#exp_front)" />
      <defs>
        <linearGradient id="exp_front" x1="16" y1="11.5" x2="16" y2="25" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE68A" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
    </svg>
  </SquircleTile>
);

export const MusicIcon: React.FC<IconProps> = ({ size = 44, parallaxX = 0, parallaxY = 0 }) => (
  <SquircleTile size={size} bgGradient="linear-gradient(145deg, #F43F5E 0%, #BE123C 100%)" parallaxX={parallaxX} parallaxY={parallaxY}>
    <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 32 32" fill="none">
      <path
        d="M23 7.5V19.8C22.2 19.3 21.1 19 20 19C17.8 19 16 20.6 16 22.5C16 24.4 17.8 26 20 26C22.2 26 24 24.4 24 22.5V11H26.5C27.3 11 28 10.3 28 9.5V8.2C28 7.5 27.2 7 26.5 7.2L23 7.5Z"
        fill="#FFFFFF"
        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))"
      />
      <circle cx="10" cy="22.5" r="3.5" fill="#FFFFFF" fillOpacity="0.85" />
      <path d="M13.5 13V22.5" stroke="#FFFFFF" strokeWidth="2.5" strokeOpacity="0.85" strokeLinecap="round" />
      <path d="M13.5 13L23 10.5" stroke="#FFFFFF" strokeWidth="2.5" strokeOpacity="0.85" strokeLinecap="round" />
    </svg>
  </SquircleTile>
);

export const NotesIcon: React.FC<IconProps> = ({ size = 44, parallaxX = 0, parallaxY = 0 }) => (
  <SquircleTile size={size} bgGradient="linear-gradient(145deg, #FBBF24 0%, #D97706 100%)" parallaxX={parallaxX} parallaxY={parallaxY}>
    <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 32 32" fill="none">
      {/* Paper Card */}
      <rect x="6" y="5" width="20" height="23" rx="2.5" fill="#FFFFFF" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.2))" />
      {/* Top Clip */}
      <rect x="12" y="4" width="8" height="3" rx="1.5" fill="#D97706" />
      {/* Ruled lines */}
      <rect x="10" y="11" width="12" height="2" rx="1" fill="#F59E0B" />
      <rect x="10" y="16" width="12" height="2" rx="1" fill="#FCD34D" />
      <rect x="10" y="21" width="8" height="2" rx="1" fill="#FDE68A" />
    </svg>
  </SquircleTile>
);

export const CalendarIcon: React.FC<IconProps> = ({ size = 44, parallaxX = 0, parallaxY = 0 }) => {
  const now = new Date();
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOP', 'DES'];
  const monthStr = months[now.getMonth()];
  const dateNum = now.getDate();

  return (
    <SquircleTile size={size} bgGradient="linear-gradient(145deg, #FFFFFF 0%, #F1F5F9 100%)" parallaxX={parallaxX} parallaxY={parallaxY}>
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Red Header Bar */}
        <div
          style={{
            height: '35%',
            background: 'linear-gradient(180deg, #EF4444 0%, #DC2626 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          <span style={{ fontSize: `${Math.round(size * 0.2)}px`, fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.5px' }}>
            {monthStr}
          </span>
        </div>
        {/* Date Number in Center */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: `${Math.round(size * 0.42)}px`, fontWeight: 800, color: '#1E293B', lineHeight: 1 }}>
            {dateNum}
          </span>
        </div>
      </div>
    </SquircleTile>
  );
};

export const SettingsIcon: React.FC<IconProps> = ({ size = 44, parallaxX = 0, parallaxY = 0 }) => (
  <SquircleTile size={size} bgGradient="linear-gradient(145deg, #64748B 0%, #334155 100%)" parallaxX={parallaxX} parallaxY={parallaxY}>
    <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="4.5" stroke="#FFFFFF" strokeWidth="2.5" />
      <path
        d="M16 4.5V7M16 25V27.5M4.5 16H7M25 16H27.5M7.87 7.87L9.64 9.64M22.36 22.36L24.13 24.13M7.87 24.13L9.64 22.36M22.36 9.64L24.13 7.87"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  </SquircleTile>
);

// ==========================================
// 2. THIRD-PARTY APPS (Normalized Squircle Containers)
// ==========================================

export const BraveIcon: React.FC<IconProps> = ({ size = 44, parallaxX = 0, parallaxY = 0 }) => (
  <SquircleTile size={size} bgGradient="linear-gradient(145deg, #2D3139 0%, #18191E 100%)" parallaxX={parallaxX} parallaxY={parallaxY}>
    <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 32 32" fill="none">
      {/* Outer Lion Shield */}
      <path d="M16 4L6 9V17C6 22.5 10.2 27.2 16 28.5C21.8 27.2 26 22.5 26 17V9L16 4Z" fill="url(#brave_lion)" />
      {/* Inner Bevel */}
      <path d="M16 7L8.5 11V16.8C8.5 21 11.7 24.8 16 26C20.3 24.8 23.5 21 23.5 16.8V11L16 7Z" fill="#FF5500" />
      <path d="M16 11L11.5 14V17.5C11.5 19.8 13.4 22.2 16 23C18.6 22.2 20.5 19.8 20.5 17.5V14L16 11Z" fill="#FFFFFF" />
      <defs>
        <linearGradient id="brave_lion" x1="6" y1="4" x2="26" y2="28.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF7700" />
          <stop offset="1" stopColor="#D93800" />
        </linearGradient>
      </defs>
    </svg>
  </SquircleTile>
);

export const EdgeIcon: React.FC<IconProps> = ({ size = 44, parallaxX = 0, parallaxY = 0 }) => (
  <SquircleTile size={size} bgGradient="linear-gradient(145deg, #F8FAFC 0%, #E2E8F0 100%)" parallaxX={parallaxX} parallaxY={parallaxY}>
    <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="11" fill="url(#edge_grad1)" />
      <path d="M16 6C10.5 6 6 10.5 6 16C6 21 9.8 25.1 14.5 25.9C13.2 24.5 12.5 22.5 12.5 20.5C12.5 16.5 15.8 13.2 19.8 13.2C21.1 13.2 22.3 13.6 23.3 14.1C23.4 13.5 23.5 12.9 23.5 12.3C23.5 8.8 20.1 6 16 6Z" fill="url(#edge_grad2)" />
      <circle cx="18" cy="17" r="6" fill="#0284C7" />
      <defs>
        <linearGradient id="edge_grad1" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" />
          <stop offset="0.5" stopColor="#06B6D4" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="edge_grad2" x1="6" y1="6" x2="23.5" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="1" stopColor="#0284C7" />
        </linearGradient>
      </defs>
    </svg>
  </SquircleTile>
);

export const DiscordIcon: React.FC<IconProps> = ({ size = 44, parallaxX = 0, parallaxY = 0 }) => (
  <SquircleTile size={size} bgGradient="linear-gradient(145deg, #5865F2 0%, #4338CA 100%)" parallaxX={parallaxX} parallaxY={parallaxY}>
    <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 32 32" fill="none">
      <path
        d="M24.5 9.5C22.8 8.7 20.9 8.2 19 8C18.8 8.4 18.5 8.9 18.4 9.4C16.4 9.1 14.4 9.1 12.4 9.4C12.2 8.9 12 8.4 11.7 8C9.8 8.2 8 8.7 6.2 9.5C2.8 14.6 1.9 19.7 2.3 24.6C4.6 26.3 6.8 27.4 9 28.1C9.5 27.3 10 26.5 10.4 25.7C9.6 25.4 8.8 25 8.1 24.5C8.3 24.3 8.4 24.2 8.6 24C12.9 26 17.7 26 22 24C22.2 24.2 22.3 24.3 22.5 24.5C21.8 25 21 25.4 20.2 25.7C20.6 26.5 21.1 27.3 21.6 28.1C23.8 27.4 26 26.3 28.3 24.6C28.8 18.8 27.4 13.9 24.5 9.5ZM10.5 20.8C9.4 20.8 8.6 19.8 8.6 18.7C8.6 17.5 9.4 16.6 10.5 16.6C11.6 16.6 12.4 17.6 12.4 18.7C12.4 19.8 11.6 20.8 10.5 20.8ZM20.1 20.8C19 20.8 18.2 19.8 18.2 18.7C18.2 17.5 19 16.6 20.1 16.6C21.2 16.6 22 17.6 22 18.7C22 19.8 21.2 20.8 20.1 20.8Z"
        fill="#FFFFFF"
        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))"
      />
    </svg>
  </SquircleTile>
);

export const WhatsAppIcon: React.FC<IconProps> = ({ size = 44, parallaxX = 0, parallaxY = 0 }) => (
  <SquircleTile size={size} bgGradient="linear-gradient(145deg, #22C55E 0%, #15803D 100%)" parallaxX={parallaxX} parallaxY={parallaxY}>
    <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 32 32" fill="none">
      <path
        d="M16 5C9.9 5 5 9.9 5 16C5 18.2 5.7 20.3 6.9 22.1L5.8 27L10.9 26C12.5 26.9 14.2 27.4 16 27.4C22.1 27.4 27 22.5 27 16.4C27 10.3 22.1 5 16 5Z"
        fill="#FFFFFF"
        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
      />
      <path
        d="M21.2 19.8C20.6 20.4 19.6 20.9 18.6 20.5C16.8 19.7 15 17.9 14.1 16.2C13.7 15.2 14.1 14.2 14.7 13.6C15 13.3 15.3 13.3 15.5 13.7L16.5 15.8C16.7 16 16.6 16.4 16.3 16.6L16 17C16.4 17.9 17.1 18.6 18.1 19L18.4 18.7C18.6 18.5 19 18.4 19.2 18.6L21.4 19.6C21.8 19.8 21.8 20.1 21.2 19.8Z"
        fill="#16A34A"
      />
    </svg>
  </SquircleTile>
);

export const EmailIcon: React.FC<IconProps> = ({ size = 44, parallaxX = 0, parallaxY = 0 }) => (
  <SquircleTile size={size} bgGradient="linear-gradient(145deg, #3B82F6 0%, #1D4ED8 100%)" parallaxX={parallaxX} parallaxY={parallaxY}>
    <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 32 32" fill="none">
      {/* White Envelope base */}
      <rect x="5" y="8" width="22" height="16" rx="2.5" fill="#FFFFFF" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))" />
      {/* Blue envelope fold */}
      <path d="M6 10L16 17.5L26 10" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </SquircleTile>
);

export const PureRefIcon: React.FC<IconProps> = ({ size = 44, parallaxX = 0, parallaxY = 0 }) => (
  <SquircleTile size={size} bgGradient="linear-gradient(145deg, #272A30 0%, #141619 100%)" parallaxX={parallaxX} parallaxY={parallaxY}>
    <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="10" fill="#32373F" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      <text x="16" y="21.5" fontSize="15" fontWeight="800" fontFamily="sans-serif" fill="#FFFFFF" textAnchor="middle">
        P
      </text>
    </svg>
  </SquircleTile>
);

export const PureToolsIcon: React.FC<IconProps> = ({ size = 44, parallaxX = 0, parallaxY = 0 }) => (
  <SquircleTile size={size} bgGradient="linear-gradient(145deg, #0284C7 0%, #0369A1 100%)" parallaxX={parallaxX} parallaxY={parallaxY}>
    <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 32 32" fill="none">
      <rect x="7" y="8" width="18" height="16" rx="2" fill="#0F172A" />
      <path d="M10 13L13 16L10 19" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="15" y="18" width="5" height="2" rx="0.5" fill="#38BDF8" />
    </svg>
  </SquircleTile>
);

export const ChromeIcon: React.FC<IconProps> = ({ size = 44, parallaxX = 0, parallaxY = 0 }) => (
  <SquircleTile size={size} bgGradient="linear-gradient(145deg, #FFFFFF 0%, #F1F5F9 100%)" parallaxX={parallaxX} parallaxY={parallaxY}>
    <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 32 32" fill="none">
      <path d="M16 5C19.8 5 23.2 7 25 10.2L19.4 19.8C18.6 18.7 17.4 18 16 18H5.5C6.7 10.5 13.2 5 16 5Z" fill="#EA4335" />
      <path d="M26.8 13.5C27.6 15.2 28 17 28 19C28 24.5 24.3 29.1 19.3 30.5L13.8 21C14.5 21.6 15.4 22 16.5 22C18.2 22 19.7 20.9 20.3 19.3L26.8 13.5Z" fill="#FBBC05" />
      <path d="M5.5 18H16.8L11.2 27.6C6.8 25.8 4 21.3 4 16C4 14.3 4.4 12.6 5.1 11L10.6 20.5C10.8 21.6 11.7 22.5 12.8 22.8L5.5 18Z" fill="#34A853" />
      <circle cx="16" cy="16" r="6" fill="#FFFFFF" />
      <circle cx="16" cy="16" r="4.6" fill="#4285F4" />
    </svg>
  </SquircleTile>
);

export const IllustratorIcon: React.FC<IconProps> = ({ size = 44, parallaxX = 0, parallaxY = 0 }) => (
  <SquircleTile size={size} bgGradient="linear-gradient(145deg, #261300 0%, #150A00 100%)" parallaxX={parallaxX} parallaxY={parallaxY}>
    <div
      style={{
        width: `${size * 0.74}px`,
        height: `${size * 0.74}px`,
        borderRadius: '7px',
        border: '1.5px solid #FF9A00',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1F0F00',
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
      }}
    >
      <span style={{ color: '#FF9A00', fontSize: `${Math.round(size * 0.35)}px`, fontWeight: 800, fontFamily: 'system-ui, sans-serif', letterSpacing: '-0.5px' }}>
        Ai
      </span>
    </div>
  </SquircleTile>
);

export const CreativeCloudIcon: React.FC<IconProps> = ({ size = 44, parallaxX = 0, parallaxY = 0 }) => (
  <SquircleTile size={size} bgGradient="linear-gradient(145deg, #FF1400 0%, #D40000 100%)" parallaxX={parallaxX} parallaxY={parallaxY}>
    <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 32 32" fill="none">
      <path
        d="M23 18.5C23 16.6 21.6 15 19.8 14.6C19.4 12 17.2 10 14.5 10C12.3 10 10.4 11.4 9.6 13.4C7.5 13.8 6 15.6 6 17.8C6 20.3 8 22.3 10.5 22.3H22.5C24.4 22.3 26 20.7 26 18.8C26 17 24.7 15.5 23 15.1V18.5Z"
        fill="#FFFFFF"
        fillOpacity="0.25"
      />
      <path
        d="M10.2 21C8.4 21 7 19.6 7 17.8C7 16.1 8.2 14.7 9.8 14.5C10.5 12.5 12.3 11 14.5 11C16.8 11 18.8 12.7 19.1 15C20.7 15.3 22 16.7 22 18.5C22 20.4 20.4 22 18.5 22H10.5"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </SquircleTile>
);

export const CursorIcon: React.FC<IconProps> = ({ size = 44, parallaxX = 0, parallaxY = 0 }) => (
  <SquircleTile size={size} bgGradient="linear-gradient(145deg, #1E1E24 0%, #0D0D11 100%)" parallaxX={parallaxX} parallaxY={parallaxY}>
    <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 32 32" fill="none">
      <path d="M16 6L25 11.2V21.6L16 26.8L7 21.6V11.2L16 6Z" fill="#1C1C22" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <path d="M16 6L25 11.2L16 16.4L7 11.2L16 6Z" fill="#2E2E38" />
      <path d="M16 16.4L25 11.2V21.6L16 26.8V16.4Z" fill="#23232C" />
      <path d="M7 11.2L16 16.4V26.8L7 21.6V11.2Z" fill="#17171D" />
      <path d="M16 11L21 13.8L16 16.6L11 13.8L16 11Z" fill="#FFFFFF" />
      <path d="M16 16.6L21 13.8V18.8L16 21.6V16.6Z" fill="#E2E8F0" />
      <path d="M11 13.8L16 16.6V21.6L11 18.8V13.8Z" fill="#94A3B8" />
    </svg>
  </SquircleTile>
);

export const GitHubIcon: React.FC<IconProps> = ({ size = 44, parallaxX = 0, parallaxY = 0 }) => (
  <SquircleTile size={size} bgGradient="linear-gradient(145deg, #24292F 0%, #0F1419 100%)" parallaxX={parallaxX} parallaxY={parallaxY}>
    <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 32 32" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16 5C9.9 5 5 9.9 5 16C5 20.9 8.2 25 12.6 26.5C13.2 26.6 13.4 26.2 13.4 25.9C13.4 25.6 13.4 24.8 13.4 23.8C10.3 24.5 9.7 22.3 9.7 22.3C9.2 21 8.5 20.7 8.5 20.7C7.5 20 8.6 20 8.6 20C9.7 20.1 10.3 21.2 10.3 21.2C11.3 22.9 12.9 22.4 13.5 22.1C13.6 21.4 13.9 20.9 14.2 20.6C11.7 20.3 9.1 19.3 9.1 15C9.1 13.8 9.5 12.8 10.2 12C10.1 11.7 9.7 10.6 10.3 9.1C10.3 9.1 11.2 8.8 13.3 10.2C14.2 10 15.1 9.9 16 9.9C16.9 9.9 17.8 10 18.7 10.2C20.8 8.8 21.7 9.1 21.7 9.1C22.3 10.6 21.9 11.7 21.8 12C22.5 12.8 22.9 13.8 22.9 15C22.9 19.3 20.3 20.3 17.8 20.6C18.2 21 18.6 21.7 18.6 22.8C18.6 24.4 18.6 25.6 18.6 25.9C18.6 26.2 18.8 26.6 19.4 26.5C23.8 25 27 20.9 27 16C27 9.9 22.1 5 16 5Z"
        fill="#FFFFFF"
        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
      />
    </svg>
  </SquircleTile>
);

export const TerminalIcon: React.FC<IconProps> = ({ size = 44, parallaxX = 0, parallaxY = 0 }) => (
  <SquircleTile size={size} bgGradient="linear-gradient(145deg, #1E222A 0%, #0F1216 100%)" parallaxX={parallaxX} parallaxY={parallaxY}>
    <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 32 32" fill="none">
      <rect x="5" y="6" width="22" height="20" rx="3" fill="#0C0E12" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <path d="M9 11L14 16L9 21" stroke="#38BDF8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" y1="21" x2="22" y2="21" stroke="#F1F5F9" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  </SquircleTile>
);

export const AntigravityIcon: React.FC<IconProps> = ({ size = 44, parallaxX = 0, parallaxY = 0 }) => (
  <SquircleTile size={size} bgGradient="linear-gradient(145deg, #1E1B4B 0%, #0F172A 100%)" parallaxX={parallaxX} parallaxY={parallaxY}>
    <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="agy_grad" x1="16" y1="5" x2="16" y2="27" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60A5FA" />
          <stop offset="0.5" stopColor="#38BDF8" />
          <stop offset="1" stopColor="#818CF8" />
        </linearGradient>
      </defs>
      <path d="M16 6L26 25H21.5L16 14L10.5 25H6L16 6Z" fill="url(#agy_grad)" filter="drop-shadow(0 0 6px rgba(56,189,248,0.5))" />
      <path d="M12.5 20.5H19.5L16 13.5L12.5 20.5Z" fill="#0F172A" />
      <circle cx="16" cy="18" r="1.8" fill="#38BDF8" />
    </svg>
  </SquircleTile>
);

// ==========================================
// 3. GRIMOIRE THEME ORIGINAL MAGIC ICONS
// ==========================================

export const GrimoireScrollIcon: React.FC<IconProps> = ({ size = 44, parallaxX = 0, parallaxY = 0 }) => (
  <SquircleTile size={size} bgGradient="linear-gradient(145deg, #10B981 0%, #064E3B 100%)" parallaxX={parallaxX} parallaxY={parallaxY}>
    <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 32 32" fill="none">
      {/* Ancient Scroll */}
      <path d="M8 7C6.9 7 6 7.9 6 9V23C6 24.1 6.9 25 8 25H24C25.1 25 26 24.1 26 23V9C26 7.9 25.1 7 24 7H8Z" fill="#FDE68A" />
      <rect x="9" y="11" width="14" height="2" rx="1" fill="#D97706" />
      <rect x="9" y="15" width="10" height="2" rx="1" fill="#D97706" />
      <rect x="9" y="19" width="12" height="2" rx="1" fill="#D97706" />
      {/* Glowing Mana Ribbon */}
      <rect x="15" y="7" width="2" height="18" fill="#7CFFB2" filter="drop-shadow(0 0 3px #7CFFB2)" />
    </svg>
  </SquircleTile>
);

export const MagicQuillIcon: React.FC<IconProps> = ({ size = 44, parallaxX = 0, parallaxY = 0 }) => (
  <SquircleTile size={size} bgGradient="linear-gradient(145deg, #059669 0%, #064E3B 100%)" parallaxX={parallaxX} parallaxY={parallaxY}>
    <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 32 32" fill="none">
      <path d="M25 6C19 8 13 13 10 20L8 25L13 23C19 20 24 13 25 6Z" fill="#FFFFFF" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))" />
      <path d="M10 20L18 12" stroke="#7CFFB2" strokeWidth="2" strokeLinecap="round" />
      <circle cx="8" cy="25" r="1.5" fill="#7CFFB2" filter="drop-shadow(0 0 4px #7CFFB2)" />
    </svg>
  </SquircleTile>
);

export const ManaHarpIcon: React.FC<IconProps> = ({ size = 44, parallaxX = 0, parallaxY = 0 }) => (
  <SquircleTile size={size} bgGradient="linear-gradient(145deg, #0D9488 0%, #115E59 100%)" parallaxX={parallaxX} parallaxY={parallaxY}>
    <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 32 32" fill="none">
      <path d="M10 6V25M10 6C15 6 22 10 22 18C22 22 19 25 10 25" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 9V24M18 12V22" stroke="#7CFFB2" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1 2" />
    </svg>
  </SquircleTile>
);

// ==========================================
// 4. UI ICONS (Start Menu, Raycast, Power)
// ==========================================

export const Windows11Logo: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 20,
  color = '#FFFFFF',
  className = '',
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M3 4.5L10.5 3.5V11H3V4.5Z" fill={color} />
    <path d="M12 3.3L21 2V11H12V3.3Z" fill={color} />
    <path d="M3 13H10.5V20.5L3 19.5V13Z" fill={color} />
    <path d="M12 13H21V22L12 20.7V13Z" fill={color} />
  </svg>
);

export const WordIcon: React.FC<IconProps> = ({ size = 44, parallaxX = 0, parallaxY = 0 }) => (
  <SquircleTile size={size} bgGradient="linear-gradient(145deg, #2B579A 0%, #18325A 100%)" parallaxX={parallaxX} parallaxY={parallaxY}>
    <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 32 32" fill="none">
      <rect x="8" y="5" width="18" height="22" rx="2" fill="#E2E8F0" />
      <rect x="12" y="9" width="10" height="2" rx="1" fill="#94A3B8" />
      <rect x="12" y="13" width="10" height="2" rx="1" fill="#94A3B8" />
      <rect x="12" y="17" width="10" height="2" rx="1" fill="#94A3B8" />
      <rect x="12" y="21" width="6" height="2" rx="1" fill="#94A3B8" />
      {/* Front flap with W */}
      <rect x="4" y="8" width="14" height="16" rx="2" fill="#185ABD" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))" />
      <text x="11" y="20.5" fill="#FFFFFF" fontSize="11" fontWeight="800" fontFamily="sans-serif" textAnchor="middle">W</text>
    </svg>
  </SquircleTile>
);

export const PowerPointIcon: React.FC<IconProps> = ({ size = 44, parallaxX = 0, parallaxY = 0 }) => (
  <SquircleTile size={size} bgGradient="linear-gradient(145deg, #D24726 0%, #9B2C13 100%)" parallaxX={parallaxX} parallaxY={parallaxY}>
    <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 32 32" fill="none">
      <rect x="8" y="5" width="18" height="22" rx="2" fill="#FED7AA" />
      <circle cx="17" cy="16" r="6" fill="#F97316" />
      <path d="M17 10A6 6 0 0 1 23 16H17V10Z" fill="#EA580C" />
      {/* Front flap with P */}
      <rect x="4" y="8" width="14" height="16" rx="2" fill="#C43E1C" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))" />
      <text x="11" y="20.5" fill="#FFFFFF" fontSize="11" fontWeight="800" fontFamily="sans-serif" textAnchor="middle">P</text>
    </svg>
  </SquircleTile>
);

export const SteamIcon: React.FC<IconProps> = ({ size = 44, parallaxX = 0, parallaxY = 0 }) => (
  <SquircleTile size={size} bgGradient="linear-gradient(145deg, #171A21 0%, #0F1217 100%)" parallaxX={parallaxX} parallaxY={parallaxY}>
    <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="12" fill="url(#steam_grad)" />
      <circle cx="21" cy="11" r="3.5" fill="#FFFFFF" />
      <circle cx="21" cy="11" r="2.2" fill="#171A21" />
      <path d="M12.5 19.5L18.5 13" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="11.5" cy="20.5" r="4.5" fill="#FFFFFF" />
      <circle cx="11.5" cy="20.5" r="3" fill="#171A21" />
      <defs>
        <linearGradient id="steam_grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1B2838" />
          <stop offset="1" stopColor="#101822" />
        </linearGradient>
      </defs>
    </svg>
  </SquircleTile>
);

export const StoreIcon: React.FC<IconProps> = ({ size = 44, parallaxX = 0, parallaxY = 0 }) => (
  <SquircleTile size={size} bgGradient="linear-gradient(145deg, #FFFFFF 0%, #E2E8F0 100%)" parallaxX={parallaxX} parallaxY={parallaxY}>
    <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 32 32" fill="none">
      {/* Bag Handle */}
      <path d="M11 11V9C11 6.8 12.8 5 15 5H17C19.2 5 21 6.8 21 9V11" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
      {/* Bag Body */}
      <rect x="6" y="10" width="20" height="17" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))" />
      {/* 4 Colored Squares */}
      <rect x="11.5" y="14.5" width="4" height="4" rx="0.5" fill="#F25022" />
      <rect x="16.5" y="14.5" width="4" height="4" rx="0.5" fill="#7FBA00" />
      <rect x="11.5" y="19.5" width="4" height="4" rx="0.5" fill="#00A4EF" />
      <rect x="16.5" y="19.5" width="4" height="4" rx="0.5" fill="#FFB900" />
    </svg>
  </SquircleTile>
);

export const TelegramIcon: React.FC<IconProps> = ({ size = 44, parallaxX = 0, parallaxY = 0 }) => (
  <SquircleTile size={size} bgGradient="linear-gradient(145deg, #2AABEE 0%, #229ED9 100%)" parallaxX={parallaxX} parallaxY={parallaxY}>
    <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 32 32" fill="none">
      <path
        d="M26 7.5L5 15.5L12 18.5L14.5 25.5L18 21.5L23 25L26 7.5ZM12.8 17.8L21.5 11.5L14.5 19.2V22.2L12.8 17.8Z"
        fill="#FFFFFF"
        filter="drop-shadow(0 2px 3px rgba(0,0,0,0.2))"
      />
    </svg>
  </SquircleTile>
);

// ==========================================
// 4. UI ICONS (Start Menu, Raycast, Power)
// ==========================================

export const StartIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
    <rect x="1.5" y="1.5" width="6.5" height="6.5" rx="1.5" fill="white" />
    <rect x="10" y="1.5" width="6.5" height="6.5" rx="1.5" fill="white" />
    <rect x="1.5" y="10" width="6.5" height="6.5" rx="1.5" fill="white" />
    <rect x="10" y="10" width="6.5" height="6.5" rx="1.5" fill="white" />
  </svg>
);

// ==========================================
// 5. MASTER RENDERER WITH THEME OVERRIDES & PARALLAX
// ==========================================

export const AppIconRenderer: React.FC<{
  iconName: string;
  size?: number;
  className?: string;
  theme?: ThemeConfig;
  parallaxX?: number;
  parallaxY?: number;
}> = ({
  iconName,
  size = 44,
  className = '',
  theme,
  parallaxX = 0,
  parallaxY = 0,
}) => {
  const effectiveName = theme?.iconOverrides?.[iconName] || iconName;

  switch (effectiveName.toLowerCase()) {
    case 'explorer':
      return <ExplorerIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
    case 'brave':
      return <BraveIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
    case 'edge':
      return <EdgeIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
    case 'word':
      return <WordIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
    case 'powerpoint':
      return <PowerPointIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
    case 'steam':
      return <SteamIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
    case 'store':
      return <StoreIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
    case 'telegram':
      return <TelegramIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
    case 'puretools':
      return <PureToolsIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
    case 'pureref':
      return <PureRefIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
    case 'email':
      return <EmailIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
    case 'whatsapp':
      return <WhatsAppIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
    case 'discord':
      return <DiscordIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
    case 'music':
      return <MusicIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
    case 'notes':
      return <NotesIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
    case 'calendar':
      return <CalendarIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
    case 'settings':
      return <SettingsIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
    case 'chrome':
      return <ChromeIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
    case 'illustrator':
      return <IllustratorIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
    case 'creativecloud':
    case 'creative-cloud':
      return <CreativeCloudIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
    case 'cursor':
      return <CursorIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
    case 'github':
    case 'githubdesktop':
      return <GitHubIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
    case 'terminal':
    case 'cmd':
      return <TerminalIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
    case 'antigravity':
      return <AntigravityIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
    // Theme custom icons
    case 'grimoire-scroll':
      return <GrimoireScrollIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
    case 'magic-quill':
      return <MagicQuillIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
    case 'mana-harp':
      return <ManaHarpIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
    default:
      return <PureToolsIcon size={size} className={className} parallaxX={parallaxX} parallaxY={parallaxY} />;
  }
};

