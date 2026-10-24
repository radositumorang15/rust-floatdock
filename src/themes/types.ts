export type ManaAttribute = 'wind' | 'fire' | 'water' | 'earth' | 'light' | 'dark';

export interface ManaPalette {
  id: ManaAttribute;
  name: string;
  color: string;
  auraColor: string;
}

export const MANA_PALETTES: Record<ManaAttribute, ManaPalette> = {
  wind: {
    id: 'wind',
    name: 'Angin (Wind)',
    color: '#7CFFB2',
    auraColor: 'rgba(124, 255, 178, 0.45)',
  },
  fire: {
    id: 'fire',
    name: 'Api (Fire)',
    color: '#FF5757',
    auraColor: 'rgba(255, 87, 87, 0.45)',
  },
  water: {
    id: 'water',
    name: 'Air (Water)',
    color: '#5BE2FF',
    auraColor: 'rgba(91, 226, 255, 0.45)',
  },
  earth: {
    id: 'earth',
    name: 'Bumi (Earth)',
    color: '#E5B869',
    auraColor: 'rgba(229, 184, 105, 0.45)',
  },
  light: {
    id: 'light',
    name: 'Cahaya (Light)',
    color: '#FFE66D',
    auraColor: 'rgba(255, 230, 109, 0.45)',
  },
  dark: {
    id: 'dark',
    name: 'Kegelapan (Dark)',
    color: '#A855F7',
    auraColor: 'rgba(168, 85, 247, 0.45)',
  },
};

export interface SegmentTints {
  start: string;
  apps: string;
  info: string;
  system: string;
  notify: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  version?: string;
  mode?: 'dark' | 'light';
  accent: string;
  accent2?: string;
  manaAttribute?: ManaAttribute;
  tints?: SegmentTints;
  videoBackdrop?: boolean;
  glow: {
    enabled: boolean;
    flow: boolean;
    color: string;
  };
  liquidGlass: {
    enabled: boolean;
    specular: boolean;
    tint: string;
  };
  glass?: {
    blur: number;
    saturate: number;
    noise?: number;
    sheen?: boolean;
  };
  particles: {
    enabled: boolean;
    type: 'mana' | 'none';
  };
  startMenu: {
    style: 'standard' | 'grimoire' | 'pages';
    cloverMotif: boolean;
  };
  notch: {
    eyesStyle: 'dots' | 'mana-spark';
  };
  iconOverrides?: Record<string, string>;
}
