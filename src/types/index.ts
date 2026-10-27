export interface TrackedWindow {
  hwnd: number;
  title: string;
  process_id: number;
  app_name: string;
  exec_path?: string;
  icon_url?: string;
  is_active: boolean;
  is_minimized: boolean;
  profile_name?: string;
}

export interface AppEntry {
  id: string;
  name: string;
  exec_path: string;
  icon_name: string;
  icon_url?: string;
  is_pinned: boolean;
  category: string;
}

export interface BatteryInfo {
  percentage: number;
  is_charging: boolean;
  is_plugged_in: boolean;
  has_battery: boolean;
}

export interface VolumeInfo {
  level: number;
  is_muted: boolean;
}

export interface NetworkInfo {
  is_connected: boolean;
  ssid: string;
  signal_strength: number;
  is_wifi: boolean;
}

export interface WeatherInfo {
  temperature: number;
  condition: string;
  weather_code: number;
  is_day: boolean;
}

export interface TimerState {
  label: string;
  total_seconds: number;
  remaining_seconds: number;
  is_running: boolean;
  is_finished: boolean;
  formatted_time: string;
}

export interface MediaState {
  title: string;
  artist: string;
  is_playing: boolean;
  has_media: boolean;
}

export interface FullDockState {
  pinned_apps: AppEntry[];
  running_windows: TrackedWindow[];
  battery: BatteryInfo;
  volume: VolumeInfo;
  network: NetworkInfo;
  timer: TimerState;
  media: MediaState;
  weather: WeatherInfo;
}

export interface ContextMenuItem {
  label: string;
  action: () => void;
  icon?: string;
  danger?: boolean;
}

export interface ContextMenuState {
  x: number;
  y: number;
  visible: boolean;
  items: ContextMenuItem[];
}

export interface SystemPulse {
  cursor_norm_x: number;
  cursor_norm_y: number;
  cpu_usage: number;
  ram_usage: number;
  should_autohide_dock: boolean;
  cursor_near_bottom: boolean;
  recent_clips: string[];
}

export interface HardwareAudioState {
  audio_bars: number[];
  battery_percent: number;
  is_charging: boolean;
  hardware_toast?: string | null;
}

export interface WindowInstance {
  hwnd: number;
  title: string;
  is_minimized: boolean;
  profile_name?: string;
}

export interface ChromeProfileEntry {
  dir: string;
  name: string;
}

export interface ShelfFile {
  name: string;
  path: string;
}

export interface GroupedDockApp {
  group_id: string;
  app_name: string;
  profile_badge?: string;
  is_pinned: boolean;
  windows: WindowInstance[];
}
