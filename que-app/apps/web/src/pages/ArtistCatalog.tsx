import { useState, useEffect } from 'react';
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
  const [expandedAlbum, setExpandedAlbum] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getArtistAlbums(id)
      .then((data) => {
        setAlbums(data);
        if (data.length > 0) setExpandedAlbum(data[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

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
      ) : (
        <div className="space-y-3">
          {albums.map((album) => (
            <div key={album.id} className="card overflow-hidden">
              <button
                onClick={() => setExpandedAlbum(expandedAlbum === album.id ? null : album.id)}
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
                    {album.releaseDate?.slice(0, 4)} · {album.tracks?.length || 0} tracks
                  </div>
                </div>
                <span className={`text-muted transition-transform ${expandedAlbum === album.id ? 'rotate-180' : ''}`}>
                  ▾
                </span>
              </button>
              {expandedAlbum === album.id && album.tracks && (
                <div className="px-2 pb-2 border-t border-border">
                  {album.tracks.map((track: any) => (
                    <TrackResult
                      key={track.id}
                      track={track}
                      onSelect={() => navigate('/send/clip', { state: { track } })}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
