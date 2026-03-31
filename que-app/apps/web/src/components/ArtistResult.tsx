import { memo } from 'react';

interface Props {
  artist: {
    id: string;
    name: string;
    image: string | null;
    genres: string[];
  };
  onSelect: () => void;
}

export default memo(function ArtistResult({ artist, onSelect }: Props) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-4 p-4 rounded-card glass-card hover:shadow-card-hover transition-all text-left mb-3"
    >
      {artist.image ? (
        <img src={artist.image} alt="" loading="lazy" className="w-14 h-14 rounded-full object-cover flex-shrink-0 shadow-sm" />
      ) : (
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
          🎤
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-ink text-sm font-headline">{artist.name}</div>
        <div className="text-muted text-xs truncate font-body">
          {artist.genres.slice(0, 2).join(', ') || 'Artist'}
        </div>
      </div>
      <span className="text-primary text-sm font-bold">→</span>
    </button>
  );
});
