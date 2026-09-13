// 04_TECHNICAL_DESIGN.md §4 Data Model — 오늘 범위(mock)에 필요한 타입만 정의.
// WeatherContext / RecommendationRequest는 외부 API 연동 시점(다음 세션)에 추가한다.

export type LibraryTrack = {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArtUrl: string;
  uri: string;
};

export type UserContext = {
  mood: string;
  situation: string;
  freeText?: string;
};

export type RecommendationResult = {
  track: LibraryTrack;
  reason: string;
  isFallback: boolean;
};
