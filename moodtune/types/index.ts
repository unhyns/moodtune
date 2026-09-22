// 04_TECHNICAL_DESIGN.md §4 Data Model.

export type LibraryTrack = {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArtUrl: string;
  uri: string;
};

export type SpotifySession = {
  accessToken: string;
  refreshToken: string;
  // epoch ms
  expiresAt: number;
};

export type WeatherContext = {
  condition: string;
  temperatureC: number;
  city?: string;
};

export type UserContext = {
  mood: string;
  situation: string;
  freeText?: string;
};

export type RecommendationRequest = {
  context: UserContext;
  weather?: WeatherContext;
  librarySample: LibraryTrack[];
};

export type RecommendationResult = {
  track: LibraryTrack;
  reason: string;
  isFallback: boolean;
};

export type LibraryResponse = {
  user: { id: string; displayName: string };
  tracks: LibraryTrack[];
  likedCount: number;
  playlists: { id: string; name: string; trackCount: number }[];
};
