import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Wordmark from '../components/Wordmark';
import SearchInput from '../components/SearchInput';
import TrackResult from '../components/TrackResult';
import ArtistResult from '../components/ArtistResult';
import { api } from '../lib/api';

export default function Send() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ displayName: string; connected: boolean; accessToken: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [tracks, setTracks] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    api.getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    setSearchLoading(true);
    try {
      const data = await api.search(query);
      setTracks(data.tracks);
      setArtists(data.artists);
      setSearched(true);
    } catch {
      // show nothing
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleTrackSelect = (track: any) => {
    navigate('/send/clip', { state: { track } });
  };

  const handleArtistSelect = (artist: any) => {
    navigate(`/send/artist/${artist.id}`, { state: { artist } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  // Pre-auth: show Spotify connect
  if (!user?.connected) {
    return (
      <div className="max-w-md mx-auto px-5 py-8 space-y-6">
        <Wordmark />
        <h2 className="text-2xl font-bold text-ink">Que a song.</h2>
        <p className="text-muted text-sm">
          Connect Spotify to search songs and pick your clip. Your friend won't need it.
        </p>

        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#1DB954">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            <span className="font-semibold text-ink">One-time login</span>
          </div>
          <p className="text-muted text-sm">
            We only need your Spotify to search songs and preview clips. Nothing else.
          </p>
          <a href="/auth/spotify" className="btn-spotify w-full justify-center">
            Continue with Spotify
          </a>
        </div>

        <div className="card p-5">
          <div className="flex items-start gap-3">
            <span className="text-xl">👤</span>
            <div>
              <p className="text-sm font-medium text-ink">Your friend needs nothing</p>
              <p className="text-xs text-muted mt-1">
                They tap a link, hear the clip, react. No Spotify, no account, no app. Ever.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Post-auth: search
  return (
    <div className="max-w-md mx-auto px-5 py-8 space-y-6">
      {/* Back + close button */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/')} className="text-muted text-lg">←</button>
        <button
          onClick={() => navigate('/')}
          className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-muted text-sm"
        >
          ✕
        </button>
      </div>

      <SearchInput onSearch={handleSearch} isLoading={searchLoading} />

      {searchLoading && (
        <p className="text-center text-gold text-sm font-medium">searching...</p>
      )}

      {/* Empty state with Q watermark */}
      {!searchLoading && !searched && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <span className="text-8xl font-extrabold text-gold/15">Q</span>
          <p className="text-sm font-semibold text-muted">Spotify API</p>
          <p className="text-xs text-muted">Search to Que a 30s clip.</p>
        </div>
      )}

      {!searchLoading && searched && tracks.length === 0 && artists.length === 0 && (
        <div className="card p-6 text-center space-y-2">
          <p className="text-muted text-sm">No results found</p>
          <p className="text-xs text-muted">
            Try a different search term.
          </p>
        </div>
      )}

      {/* Track results */}
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
  );
}
