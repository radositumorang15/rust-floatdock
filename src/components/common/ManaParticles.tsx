import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speedY: number;
}

interface ManaParticlesProps {
  active: boolean;
  color: string;
  cursorX: number | null;
}

export const ManaParticles: React.FC<ManaParticlesProps> = ({ active, color, cursorX }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active || cursorX === null) return;

    // Spawn a gentle particle
    const newParticle: Particle = {
      id: Date.now() + Math.random(),
      x: cursorX + (Math.random() * 24 - 12),
      y: 50 + (Math.random() * 10 - 5),
      size: Math.random() * 3 + 2,
      opacity: 0.9,
      speedY: Math.random() * 0.8 + 0.4,
    };

    setParticles((prev) => [...prev.slice(-12), newParticle]);
  }, [active, cursorX]);

  useEffect(() => {
    if (particles.length === 0) return;

    const frame = requestAnimationFrame(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            y: p.y - p.speedY,
            opacity: p.opacity - 0.025,
          }))
          .filter((p) => p.opacity > 0)
      );
    });

    return () => cancelAnimationFrame(frame);
  }, [particles]);

  if (!active || particles.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 10,
      }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 8px ${color}`,
            opacity: p.opacity,
            transform: 'translate3d(0, 0, 0)',
          }}
        />
      ))}
    </div>
  );
};
