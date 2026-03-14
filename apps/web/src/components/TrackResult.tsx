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
}

function formatDuration(ms: number) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function TrackResult({ track, onSelect }: Props) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-violet/5 transition-colors text-left"
    >
      <img
        src={track.albumArt}
        alt=""
        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-ink text-sm truncate">{track.title}</div>
        <div className="text-muted text-xs truncate">
          {track.artist} · {track.albumName}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-muted">{formatDuration(track.duration)}</span>
        {!track.hasPreview && (
          <span className="text-xs bg-amber/10 text-amber px-2 py-0.5 rounded-full">no clip</span>
        )}
      </div>
    </button>
  );
}
