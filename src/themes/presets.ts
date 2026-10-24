import { ThemeConfig } from './types';

export const THEME_GRIMOIRE_VERDANT: ThemeConfig = {
  id: 'grimoire-verdant',
  name: 'Grimoire Verdant (New Taskbar)',
  version: '0.1.0',
  mode: 'dark',
  manaAttribute: 'wind',
  tints: {
    start: 'rgba(40,150,110,0.55)',
    apps: 'rgba(70,40,130,0.55)',
    info: 'rgba(60,60,120,0.50)',
    system: 'rgba(40,130,105,0.55)',
    notify: 'rgba(100,60,170,0.60)',
  },
  videoBackdrop: true,
  accent: '#7CFFB2',
  accent2: '#9B7CFF',
  glow: {
    enabled: true,
    flow: true,
    color: 'rgba(124,255,178,0.45)',
  },
  glass: {
    blur: 26,
    saturate: 1.35,
    noise: 0.03,
    sheen: true,
  },
  liquidGlass: {
    enabled: true,
    specular: true,
    tint: 'rgba(70,40,130,0.55)',
  },
  particles: {
    enabled: true,
    type: 'mana',
  },
  startMenu: {
    style: 'pages',
    cloverMotif: true,
  },
  notch: {
    eyesStyle: 'mana-spark',
  },
  iconOverrides: {
    explorer: 'explorer',
    notes: 'notes',
    music: 'music',
  },
};

export const THEME_LIGHT_MINT: ThemeConfig = {
  id: 'light-mint',
  name: 'Light Pastel Glass (New Taskbar)',
  version: '0.1.0',
  mode: 'light',
  manaAttribute: 'wind',
  tints: {
    start: 'rgba(165, 243, 215, 0.78)',
    apps: 'rgba(230, 205, 255, 0.72)',
    info: 'rgba(245, 230, 255, 0.72)',
    system: 'rgba(250, 245, 195, 0.78)',
    notify: 'rgba(240, 250, 180, 0.85)',
  },
  videoBackdrop: true,
  accent: '#059669',
  accent2: '#7C3AED',
  glow: {
    enabled: true,
    flow: false,
    color: 'rgba(16, 185, 129, 0.35)',
  },
  glass: {
    blur: 24,
    saturate: 1.25,
    sheen: true,
  },
  liquidGlass: {
    enabled: true,
    specular: true,
    tint: 'rgba(230, 205, 255, 0.72)',
  },
  particles: {
    enabled: false,
    type: 'none',
  },
  startMenu: {
    style: 'standard',
    cloverMotif: false,
  },
  notch: {
    eyesStyle: 'dots',
  },
};

export const THEME_LIQUID_GLASS: ThemeConfig = {
  id: 'liquid-glass',
  name: 'Liquid Glass (Apple)',
  mode: 'dark',
  tints: {
    start: 'rgba(255, 255, 255, 0.22)',
    apps: 'rgba(255, 255, 255, 0.14)',
    info: 'rgba(255, 255, 255, 0.16)',
    system: 'rgba(255, 255, 255, 0.18)',
    notify: 'rgba(255, 255, 255, 0.22)',
  },
  videoBackdrop: true,
  accent: '#5B9BFF',
  glow: {
    enabled: true,
    flow: true,
    color: 'rgba(91, 155, 255, 0.45)',
  },
  glass: {
    blur: 28,
    saturate: 1.35,
    sheen: true,
  },
  liquidGlass: {
    enabled: true,
    specular: true,
    tint: 'rgba(255, 255, 255, 0.14)',
  },
  particles: {
    enabled: false,
    type: 'none',
  },
  startMenu: {
    style: 'standard',
    cloverMotif: false,
  },
  notch: {
    eyesStyle: 'dots',
  },
};

export const THEME_CRYSTAL: ThemeConfig = {
  id: 'crystal-clear',
  name: 'Crystal Clear (Transparan)',
  mode: 'dark',
  tints: {
    start: 'rgba(255, 255, 255, 0.12)',
    apps: 'rgba(255, 255, 255, 0.06)',
    info: 'rgba(255, 255, 255, 0.08)',
    system: 'rgba(255, 255, 255, 0.10)',
    notify: 'rgba(255, 255, 255, 0.12)',
  },
  videoBackdrop: true,
  accent: '#38BDF8',
  glow: {
    enabled: true,
    flow: false,
    color: 'rgba(56, 189, 248, 0.35)',
  },
  glass: {
    blur: 20,
    saturate: 1.2,
    sheen: true,
  },
  liquidGlass: {
    enabled: true,
    specular: true,
    tint: 'rgba(255, 255, 255, 0.06)',
  },
  particles: {
    enabled: false,
    type: 'none',
  },
  startMenu: {
    style: 'standard',
    cloverMotif: false,
  },
  notch: {
    eyesStyle: 'dots',
  },
};

export const THEME_OBSIDIAN: ThemeConfig = {
  id: 'obsidian-dark',
  name: 'Obsidian Dark (Kaca Gelap)',
  mode: 'dark',
  tints: {
    start: 'rgba(20, 30, 48, 0.65)',
    apps: 'rgba(15, 23, 42, 0.48)',
    info: 'rgba(24, 20, 42, 0.45)',
    system: 'rgba(20, 32, 45, 0.55)',
    notify: 'rgba(35, 25, 55, 0.60)',
  },
  videoBackdrop: true,
  accent: '#818CF8',
  glow: {
    enabled: true,
    flow: false,
    color: 'rgba(129, 140, 248, 0.35)',
  },
  glass: {
    blur: 26,
    saturate: 1.35,
    sheen: true,
  },
  liquidGlass: {
    enabled: true,
    specular: true,
    tint: 'rgba(15, 23, 42, 0.48)',
  },
  particles: {
    enabled: false,
    type: 'none',
  },
  startMenu: {
    style: 'standard',
    cloverMotif: false,
  },
  notch: {
    eyesStyle: 'dots',
  },
};

export const THEME_DEFAULT: ThemeConfig = THEME_GRIMOIRE_VERDANT;

export const AVAILABLE_THEMES: ThemeConfig[] = [
  THEME_GRIMOIRE_VERDANT,
  THEME_LIGHT_MINT,
  THEME_LIQUID_GLASS,
  THEME_CRYSTAL,
  THEME_OBSIDIAN,
];
