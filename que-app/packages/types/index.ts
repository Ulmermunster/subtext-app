export type QueMode = 'AUTO' | 'PICK';
export type Reaction = 'VIBE' | 'NOPE';

export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  albumName: string;
  albumArt: string;
  duration: number;
  previewUrl: string | null;
  spotifyId: string;
  hasPreview: boolean;
}

export interface ArtistResult {
  id: string;
  name: string;
  image: string | null;
  genres: string[];
  followers: number;
}

export interface Album {
  id: string;
  name: string;
  releaseDate: string;
  image: string | null;
  tracks: Track[];
}

export interface CreateQueRequest {
  trackId: string;
  mode: QueMode;
  startSec?: number;
}

export interface CreateQueResponse {
  queId: string;
  shareUrl: string;
}

export interface QuePublicData {
  mode: QueMode;
  startSec: number | null;
  previewUrl: string | null;
  spotifyId: string;
  senderDisplayName: string;
}

export interface QueRevealData {
  title: string;
  artist: string;
  albumName: string;
  albumArt: string;
  spotifyUrl: string;
  appleMusicSearchUrl: string;
  reaction: Reaction | null;
}

export interface SessionUser {
  displayName: string;
  connected: boolean;
  accessToken?: string;
}

export interface SearchResults {
  tracks: Track[];
  artists: ArtistResult[];
}
