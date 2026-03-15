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
    <div>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search a track..."
          className="w-full py-3 text-3xl font-bold text-ink placeholder:text-muted/40 bg-transparent border-none focus:outline-none"
        />
        {isLoading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="spinner" />
          </div>
        )}
      </div>
      <div className="gold-underline" />
    </div>
  );
}
