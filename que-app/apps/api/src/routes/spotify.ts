import { FastifyInstance } from 'fastify';
import { requireSession } from '../middleware/session.js';
import { searchTracks, getTrack, getArtistAlbums, spotifyFetch } from '../lib/spotify.js';

export async function spotifyRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireSession);

  app.get('/spotify/search', async (request) => {
    const { q, limit } = request.query as { q: string; limit?: string };
    if (!q) return { tracks: [], artists: [] };

    const data = await searchTracks(q, request.session!.accessToken, parseInt(limit || '8'));

    const tracks = (data.tracks?.items || []).map((t: any) => ({
      id: t.id,
      title: t.name,
      artist: t.artists.map((a: any) => a.name).join(', '),
      artistId: t.artists[0]?.id || '',
      albumName: t.album?.name || '',
      albumArt: t.album?.images?.[0]?.url || '',
      duration: t.duration_ms,
      previewUrl: t.preview_url || null,
      spotifyId: t.id,
      hasPreview: !!t.preview_url,
    }));

    const artists = (data.artists?.items || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      image: a.images?.[0]?.url || null,
      genres: a.genres || [],
      followers: a.followers?.total || 0,
    }));

    return { tracks, artists };
  });

  app.get('/spotify/track/:id', async (request) => {
    const { id } = request.params as { id: string };
    const t = await getTrack(id, request.session!.accessToken);
    return {
      id: t.id,
      title: t.name,
      artist: t.artists.map((a: any) => a.name).join(', '),
      artistId: t.artists[0]?.id || '',
      albumName: t.album?.name || '',
      albumArt: t.album?.images?.[0]?.url || '',
      duration: t.duration_ms,
      previewUrl: t.preview_url || null,
      spotifyId: t.id,
      hasPreview: !!t.preview_url,
    };
  });

  app.get('/spotify/artist/:id/albums', async (request) => {
    const { id } = request.params as { id: string };
    return getArtistAlbums(id, request.session!.accessToken);
  });
}
