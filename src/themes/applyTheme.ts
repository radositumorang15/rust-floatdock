import { ThemeConfig } from './types';

export function applyThemeToCss(theme: ThemeConfig) {
  if (!theme || typeof document === 'undefined') return;
  const root = document.documentElement;

  if (theme.accent) root.style.setProperty('--accent', theme.accent);
  if (theme.accent2) root.style.setProperty('--accent-2', theme.accent2);
  if (theme.glow?.color) root.style.setProperty('--glow', theme.glow.color);

  if (theme.tints) {
    if (theme.tints.start) root.style.setProperty('--tint-start', theme.tints.start);
    if (theme.tints.apps) root.style.setProperty('--tint-apps', theme.tints.apps);
    if (theme.tints.info) root.style.setProperty('--tint-info', theme.tints.info);
    if (theme.tints.system) root.style.setProperty('--tint-system', theme.tints.system);
    if (theme.tints.notify) root.style.setProperty('--tint-notify', theme.tints.notify);
  }

  if (theme.glass?.blur) {
    root.style.setProperty('--glass-blur', `${theme.glass.blur}px`);
    root.style.setProperty('--blur-dock', `${theme.glass.blur}px`);
  }
  if (theme.glass?.saturate) {
    root.style.setProperty('--glass-saturate', `${theme.glass.saturate}`);
  }

  if (theme.liquidGlass?.tint) {
    root.style.setProperty('--glass-bg', theme.liquidGlass.tint);
    root.style.setProperty('--glass-bg-strong', theme.liquidGlass.tint);
  }

  if (theme.mode === 'light') {
    root.style.setProperty('--text-primary', '#0F172A');
    root.style.setProperty('--text-secondary', 'rgba(15, 23, 42, 0.7)');
    root.style.setProperty('--glass-border', 'rgba(0, 0, 0, 0.12)');
  } else {
    root.style.setProperty('--text-primary', '#FFFFFF');
    root.style.setProperty('--text-secondary', 'rgba(255, 255, 255, 0.75)');
    root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.30)');
  }
}
