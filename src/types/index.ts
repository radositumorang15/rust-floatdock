export interface TrackedWindow {
  hwnd: number;
  title: string;
  process_id: number;
  app_name: string;
  is_active: boolean;
  is_minimized: boolean;
}

export interface AppEntry {
  id: string;
  name: string;
  exec_path: string;
  icon_name: string;
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
