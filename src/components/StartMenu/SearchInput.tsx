import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, inputRef }) => {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '38px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '12px',
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none',
          color: 'var(--text-placeholder)',
        }}
      >
        <Search size={16} />
      </div>
      <input
        ref={inputRef}
        type="text"
        className="glass-input"
        placeholder="Cari aplikasi..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          height: '100%',
          paddingLeft: '36px',
          paddingRight: '12px',
          fontSize: 'var(--fs-body)',
          fontWeight: 'var(--fw-semibold)',
        }}
      />
    </div>
  );
};
