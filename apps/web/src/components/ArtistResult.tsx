interface Props {
  artist: {
    id: string;
    name: string;
    image: string | null;
    genres: string[];
  };
  onSelect: () => void;
}

export default function ArtistResult({ artist, onSelect }: Props) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-violet/5 transition-colors text-left"
    >
      {artist.image ? (
        <img src={artist.image} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-violet/10 flex items-center justify-center text-lg flex-shrink-0">
          🎤
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-ink text-sm">{artist.name}</div>
        <div className="text-muted text-xs truncate">
          {artist.genres.slice(0, 2).join(', ') || 'Artist'}
        </div>
      </div>
      <span className="text-muted text-xs">→</span>
    </button>
  );
}
