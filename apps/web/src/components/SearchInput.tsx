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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-accent-yellow/30 rounded-full blur-md opacity-20 group-focus-within:opacity-40 transition duration-500" />
      <div className="relative flex items-center bg-zinc-900/50 backdrop-blur-xl rounded-full px-6 py-4 border border-white/10">
        <span className="material-symbols-outlined mr-3 text-white/50">search</span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search tracks, artists..."
          className="bg-transparent border-none focus:ring-0 focus:outline-none w-full text-white font-medium placeholder:text-white/30"
        />
        {isLoading && (
          <div className="ml-2">
            <div className="spinner" />
          </div>
        )}
      </div>
    </div>
  );
}
