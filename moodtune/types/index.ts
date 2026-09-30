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
  // 02_REQUIREMENTS_SPEC.md Decisions Log: 기분 또는 상황 중 하나 이상 선택.
  mood?: string;
  situation?: string;
  freeText?: string;
};

// 트랙 ID → 그 곡이 들어 있는 본인 플레이리스트 이름 목록. 서버 내부 전용이며 응답에 포함하지 않는다.
export type SourcesByTrackId = Record<string, string[]>;

export type RecommendationRequest = {
  context: UserContext;
  weather?: WeatherContext;
  librarySample: LibraryTrack[];
  sourcesByTrackId?: SourcesByTrackId;
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

// localStorage("moodtune:signals")에 URI별로 저장하는 개인 신호. 브라우저 전용이며 서버로 보내지 않는다.
export type PersonalSignal = {
  feedback?: "liked" | "disliked";
  // ISO 8601
  feedbackAt?: string;
  // add-personal-signals에서 추가 예정: pinned?: boolean; excluded?: boolean;
};

export type PersonalSignalsStore = {
  version: 1;
  // key: spotify:(track|album|playlist):{id}
  items: Record<string, PersonalSignal>;
};

// fetchLibrary() 반환값. /api/spotify/library는 library만 응답한다.
export type LibraryFetchResult = {
  library: LibraryResponse;
  sourcesByTrackId: SourcesByTrackId;
};
