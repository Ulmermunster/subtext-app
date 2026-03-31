import { memo } from 'react';
import { hapticTap } from '../lib/haptics';

interface Props {
  track: {
    id: string;
    title: string;
    artist: string;
    albumName: string;
    albumArt: string;
    duration: number;
    hasPreview: boolean;
  };
  onSelect: () => void;
  selected?: boolean;
}

export default memo(function TrackResult({ track, onSelect, selected }: Props) {
  return (
    <button
      onPointerDown={hapticTap}
      onClick={onSelect}
      className={`w-full flex items-center gap-4 p-4 rounded-card transition-all text-left mb-3 ${
        selected
          ? 'bg-gradient-to-br from-primary to-primary-container text-white shadow-card-hover'
          : 'glass-card hover:shadow-card-hover'
      }`}
    >
      <img
        src={track.albumArt}
        alt=""
        loading="lazy"
        className="w-14 h-14 rounded-xl object-cover flex-shrink-0 shadow-sm"
      />
      <div className="flex-1 min-w-0">
        <div className={`font-bold text-sm truncate font-headline ${selected ? 'text-white' : 'text-ink'}`}>
          {track.title}
        </div>
        <div className={`text-xs truncate font-body ${selected ? 'text-white/80' : 'text-muted'}`}>
          {track.artist}
        </div>
      </div>
      {selected && (
        <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8L6.5 11.5L13 5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </button>
  );
});
