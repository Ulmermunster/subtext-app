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

export default function TrackResult({ track, onSelect, selected }: Props) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-4 p-4 rounded-card transition-all text-left mb-3 ${
        selected
          ? 'bg-navy text-white shadow-card-hover'
          : 'card hover:shadow-card-hover'
      }`}
    >
      <img
        src={track.albumArt}
        alt=""
        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className={`font-bold text-sm truncate ${selected ? 'text-white' : 'text-ink'}`}>
          {track.title}
        </div>
        <div className={`text-xs truncate ${selected ? 'text-gold' : 'text-muted'}`}>
          {track.artist}
        </div>
        {!track.hasPreview && (
          <div className="text-[10px] text-coral mt-0.5">No preview available</div>
        )}
      </div>
      {selected && (
        <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8L6.5 11.5L13 5" stroke="#1A1A2E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </button>
  );
}
