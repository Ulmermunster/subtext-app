import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Wordmark from '../components/Wordmark';
import TrackResult from '../components/TrackResult';
import { api } from '../lib/api';

export default function ArtistCatalog() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const artist = (location.state as any)?.artist;
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedAlbum, setExpandedAlbum] = useState<string | null>(null);
  const [albumTracks, setAlbumTracks] = useState<Record<string, any[]>>({});
  const [loadingTracks, setLoadingTracks] = useState<string | null>(null);

  const fetchAlbums = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      console.log('[ArtistCatalog] Fetching albums for artist:', id);
      const data = await api.getArtistAlbums(id);
      console.log('[ArtistCatalog] Got albums:', data.length);
      setAlbums(data);
    } catch (err: any) {
      console.error('[ArtistCatalog] Failed to load albums:', err);
      const detail = err.body?.detail || err.message || 'Unknown error';
      setError(`Could not load discography: ${detail}`);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  const handleExpandAlbum = async (albumId: string) => {
    if (expandedAlbum === albumId) {
      setExpandedAlbum(null);
      return;
    }
    setExpandedAlbum(albumId);

    // Already loaded
    if (albumTracks[albumId]) return;

    setLoadingTracks(albumId);
    try {
      const data = await api.getAlbumTracks(albumId);
      setAlbumTracks((prev) => ({ ...prev, [albumId]: data.tracks }));
    } catch {
      setAlbumTracks((prev) => ({ ...prev, [albumId]: [] }));
    } finally {
      setLoadingTracks(null);
    }
  };

  return (
    <div className="max-w-md mx-auto px-5 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-muted text-lg">←</button>
        <Wordmark size="sm" />
      </div>

      {/* Artist header */}
      {artist && (
        <div className="card p-5 flex items-center gap-4" style={{
          background: `linear-gradient(135deg, rgba(245,166,35,0.08), rgba(255,217,106,0.05))`
        }}>
          {artist.image ? (
            <img src={artist.image} alt="" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center text-2xl">🎤</div>
          )}
          <div>
            <h2 className="text-xl font-bold text-ink">{artist.name}</h2>
            <p className="text-muted text-sm">{artist.genres?.slice(0, 2).join(', ')}</p>
          </div>
        </div>
      )}

      <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Discography</h3>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="spinner" />
        </div>
      ) : error ? (
        <div className="card p-4 text-center">
          <p className="text-sm text-coral">{error}</p>
          <button onClick={fetchAlbums} className="text-gold text-sm font-semibold mt-2 min-h-[44px]">Try again</button>
        </div>
      ) : albums.length === 0 ? (
        <p className="text-muted text-sm text-center py-4">No albums found</p>
      ) : (
        <div className="space-y-3">
          {albums.map((album) => (
            <div key={album.id} className="card overflow-hidden">
              <button
                onClick={() => handleExpandAlbum(album.id)}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-gold/5 transition-colors"
              >
                {album.image ? (
                  <img src={album.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center">💿</div>
                )}
                <div className="flex-1">
                  <div className="font-semibold text-ink text-sm">{album.name}</div>
                  <div className="text-muted text-xs">
                    {album.releaseDate?.slice(0, 4)} · {album.totalTracks} tracks
                  </div>
                </div>
                <span className={`text-muted transition-transform ${expandedAlbum === album.id ? 'rotate-180' : ''}`}>
                  ▾
                </span>
              </button>
              {expandedAlbum === album.id && (
                <div className="px-2 pb-2 border-t border-border">
                  {loadingTracks === album.id ? (
                    <div className="flex justify-center py-4">
                      <div className="spinner" />
                    </div>
                  ) : albumTracks[album.id]?.length ? (
                    albumTracks[album.id].map((track: any) => (
                      <TrackResult
                        key={track.id}
                        track={track}
                        onSelect={() => navigate('/send/clip', { state: { track } })}
                      />
                    ))
                  ) : albumTracks[album.id] ? (
                    <p className="text-muted text-xs text-center py-3">No tracks available</p>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
