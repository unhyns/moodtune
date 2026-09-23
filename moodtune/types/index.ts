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
  icon?: string;
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
  // Result 화면에서 "Artist" 자리에 아티스트명(track) 또는 생성자명(playlist)을 구분해 보여주기 위한 필드.
  type: "track" | "playlist";
  creator?: string;
};

export type LibraryResponse = {
  user: { id: string; displayName: string };
  tracks: LibraryTrack[];
  likedCount: number;
  playlists: { id: string; name: string; trackCount: number }[];
};
