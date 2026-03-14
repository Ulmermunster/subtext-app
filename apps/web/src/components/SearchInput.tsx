import { useState, useEffect, useRef } from 'react';

interface Props {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export default function SearchInput({ onSearch, isLoading }: Props) {
  const [value, setValue] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timer.current);
    if (value.trim().length > 1) {
      timer.current = setTimeout(() => onSearch(value.trim()), 380);
    }
    return () => clearTimeout(timer.current);
  }, [value, onSearch]);

  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-lg">🔍</span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={'"Georgia Hanson" or "Blinding Lights"…'}
        className="w-full pl-12 pr-4 py-4 rounded-card border border-border bg-white text-ink placeholder:text-muted focus:outline-none focus:border-violet focus:ring-2 focus:ring-violet/20 text-base font-medium shadow-card"
      />
      {isLoading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="spinner" />
        </div>
      )}
    </div>
  );
}
