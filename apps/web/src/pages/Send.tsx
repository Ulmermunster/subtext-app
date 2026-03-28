import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchInput from '../components/SearchInput';
import TrackResult from '../components/TrackResult';
import ArtistResult from '../components/ArtistResult';
import { api } from '../lib/api';

export default function Send() {
  const navigate = useNavigate();
  const [searchLoading, setSearchLoading] = useState(false);
  const [tracks, setTracks] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleSearch = useCallback(async (query: string) => {
    setSearchLoading(true);
    setSearchError('');
    try {
      const data = await api.search(query);
      setTracks(data.tracks);
      setArtists(data.artists);
      setSearched(true);
    } catch {
      setSearchError('Search failed. Try again.');
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleTrackSelect = useCallback((track: any) => {
    navigate('/send/clip', { state: { track } });
  }, [navigate]);

  const handleArtistSelect = useCallback((artist: any) => {
    navigate(`/send/artist/${artist.id}`, { state: { artist } });
  }, [navigate]);

  return (
    <div className="w-full max-w-md mx-auto px-5 flex flex-col" style={{ minHeight: '100dvh', paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
      {/* Back + close button */}
      <div className="flex items-center justify-between py-2">
        <button onClick={() => navigate('/')} className="text-muted text-lg w-10 h-10 flex items-center justify-center">←</button>
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-muted text-sm"
        >
          ✕
        </button>
      </div>

      <div className="mt-2">
        <SearchInput onSearch={handleSearch} isLoading={searchLoading} />
      </div>

      {searchLoading && (
        <p className="text-center text-gold text-sm font-medium mt-4">searching...</p>
      )}

      {/* Empty state with Q watermark */}
      {!searchLoading && !searched && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <span className="text-8xl font-extrabold text-gold/15">Q</span>
          <p className="text-xs text-muted">Search to Que a 30s clip.</p>
        </div>
      )}

      {searchError && (
        <p className="text-center text-coral text-sm mt-4">{searchError}</p>
      )}

      {!searchLoading && searched && tracks.length === 0 && artists.length === 0 && !searchError && (
        <div className="card p-6 text-center space-y-2 mt-4">
          <p className="text-muted text-sm">No results found</p>
          <p className="text-xs text-muted">
            Try a different search term.
          </p>
        </div>
      )}

      {/* Track results */}
      <div className="flex-1 overflow-y-auto mt-4 -mx-1 px-1" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        {tracks.length > 0 && (
          <div className="space-y-0">
            {tracks.map((track) => (
              <TrackResult
                key={track.id}
                track={track}
                onSelect={() => handleTrackSelect(track)}
              />
            ))}
          </div>
        )}

        {/* Artist results */}
        {artists.length > 0 && (
          <div className="space-y-0">
            <div className="px-1 py-2 text-xs font-semibold text-muted uppercase tracking-wider">
              Artists
            </div>
            {artists.map((artist) => (
              <ArtistResult
                key={artist.id}
                artist={artist}
                onSelect={() => handleArtistSelect(artist)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
