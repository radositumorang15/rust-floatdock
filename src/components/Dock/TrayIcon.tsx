import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Battery,
  BatteryCharging,
  MoreHorizontal,
} from 'lucide-react';
import { BatteryInfo, VolumeInfo, NetworkInfo, WeatherInfo } from '../../types';
import { Tooltip } from '../common/Tooltip';

interface TrayProps {
  battery: BatteryInfo;
  volume: VolumeInfo;
  network: NetworkInfo;
  weather?: WeatherInfo;
  onOpenNetwork: () => void;
  onStepVolume: (delta: number) => void;
  onToggleMute: () => void;
  onOpenCalendar: () => void;
}

export const TrayArea: React.FC<TrayProps> = ({
  battery,
  volume,
  network,
  onOpenNetwork,
  onStepVolume,
  onToggleMute,
  onOpenCalendar,
}) => {
  const [timeStr, setTimeStr] = useState('10:36 AM');
  const [dateStr, setDateStr] = useState('7/07/2026');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const m = String(now.getMinutes()).padStart(2, '0');
      setTimeStr(`${hours}:${m} ${ampm}`);

      const d = now.getDate();
      const mon = String(now.getMonth() + 1).padStart(2, '0');
      const y = now.getFullYear();
      setDateStr(`${d}/${mon}/${y}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVolumeWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      onStepVolume(5);
    } else {
      onStepVolume(-5);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        userSelect: 'none',
      }}
    >
      {/* 1. Battery Icon */}
      <Tooltip text={`Baterai: ${battery.percentage}% ${battery.is_charging ? '(Pengisian)' : ''}`}>
        <div
          onClick={onOpenNetwork}
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}
        >
          {battery.is_charging ? <BatteryCharging size={16} /> : <Battery size={16} />}
        </div>
      </Tooltip>

      {/* 2. Volume Icon */}
      <Tooltip text={`Volume: ${volume.level}% ${volume.is_muted ? '(Mute)' : ''} • Scroll: Atur • Klik: Quick Settings • Klik Kanan/Double: Mute`}>
        <div
          onClick={onOpenNetwork}
          onDoubleClick={onToggleMute}
          onContextMenu={(e) => {
            e.preventDefault();
            onToggleMute();
          }}
          onAuxClick={(e) => {
            if (e.button === 1) onToggleMute();
          }}
          onWheel={handleVolumeWheel}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: volume.is_muted ? 'var(--danger)' : 'var(--text-primary)',
          }}
        >
          {volume.is_muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </div>
      </Tooltip>

      {/* 3. Wi-Fi Icon */}
      <Tooltip text={network.is_connected ? `Terhubung: ${network.ssid}` : 'Tidak Ada Koneksi'}>
        <div
          onClick={onOpenNetwork}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: network.is_connected ? 'var(--text-primary)' : 'rgba(255,255,255,0.4)',
          }}
        >
          {network.is_connected ? <Wifi size={16} /> : <WifiOff size={16} />}
        </div>
      </Tooltip>

      {/* 4. More horizontal dots (...) */}
      <Tooltip text="Ikon lainnya">
        <div
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          <MoreHorizontal size={16} />
        </div>
      </Tooltip>

      {/* 5. Vertical Thin Glass Divider */}
      <div style={{ width: '1px', height: '22px', background: 'rgba(255, 255, 255, 0.25)' }} />

      {/* 6. Language Indicator (ENG) */}
      <div
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '0.5px',
          cursor: 'pointer',
        }}
      >
        ENG
      </div>

      {/* 7. Two-line Clock and Date */}
      <Tooltip text="Klik: Buka Kalender & Notifikasi Windows • Klik Kanan: Pengaturan Waktu">
        <div
          onClick={onOpenCalendar}
          onContextMenu={(e) => {
            e.preventDefault();
            invoke('open_date_time_settings').catch(() => {});
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'center',
            cursor: 'pointer',
            lineHeight: 1.15,
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {timeStr}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)' }}>
            {dateStr}
          </span>
        </div>
      </Tooltip>
    </div>
  );
};
