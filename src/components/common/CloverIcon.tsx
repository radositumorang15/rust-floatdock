import React from 'react';

interface CloverProps {
  size?: number;
  color?: string;
  className?: string;
}

export const GeometricClover: React.FC<CloverProps> = ({
  size = 20,
  color = '#7CFFB2',
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={{ filter: `drop-shadow(0 0 6px ${color})` }}
    >
      {/* Top Leaf */}
      <path
        d="M12 2C9.5 2 8 4 8 6.5C8 8.5 10 11 12 12C14 11 16 8.5 16 6.5C16 4 14.5 2 12 2Z"
        fill={color}
      />
      {/* Bottom Leaf */}
      <path
        d="M12 22C9.5 22 8 20 8 17.5C8 15.5 10 13 12 12C14 13 16 15.5 16 17.5C16 20 14.5 22 12 22Z"
        fill={color}
      />
      {/* Left Leaf */}
      <path
        d="M2 12C2 9.5 4 8 6.5 8C8.5 8 11 10 12 12C11 14 8.5 16 6.5 16C4 16 2 14.5 2 12Z"
        fill={color}
      />
      {/* Right Leaf */}
      <path
        d="M22 12C22 9.5 20 8 17.5 8C15.5 8 13 10 12 12C13 14 15.5 16 17.5 16C20 16 22 14.5 22 12Z"
        fill={color}
      />
      {/* Core Mana Jewel */}
      <circle cx="12" cy="12" r="2.5" fill="#FFFFFF" />
    </svg>
  );
};
