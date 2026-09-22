import type { LibraryResponse, LibraryTrack, SpotifySession } from "@/types";
import { requireEnv } from "@/lib/env";

const AUTH_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API = "https://api.spotify.com/v1";

// 읽기 전용 scope만 요청한다 (spotify-auth: Minimal OAuth Scope).
export const SPOTIFY_SCOPES = ["user-library-read", "playlist-read-private"];

// 라이브러리 조회 상한 (Vercel 서버리스 시간 제한 안에서 끝나도록).
const LIKED_LIMIT = 200;
const PLAYLIST_LIMIT = 10;
const PLAYLIST_TRACK_LIMIT = 100;

export class SpotifyAuthError extends Error {}

export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("SPOTIFY_CLIENT_ID"),
    response_type: "code",
    redirect_uri: requireEnv("SPOTIFY_REDIRECT_URI"),
    scope: SPOTIFY_SCOPES.join(" "),
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

async function tokenRequest(body: Record<string, string>): Promise<Response> {
  const basic = Buffer.from(
    `${requireEnv("SPOTIFY_CLIENT_ID")}:${requireEnv("SPOTIFY_CLIENT_SECRET")}`,
  ).toString("base64");
  return fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body),
    cache: "no-store",
  });
}

type TokenResponse = { access_token: string; refresh_token?: string; expires_in: number };

export async function exchangeCode(code: string): Promise<SpotifySession> {
  const res = await tokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: requireEnv("SPOTIFY_REDIRECT_URI"),
  });
  if (!res.ok) throw new SpotifyAuthError(`token exchange failed (${res.status})`);
  const t = (await res.json()) as TokenResponse;
  if (!t.refresh_token) throw new SpotifyAuthError("no refresh token returned");
  return {
    accessToken: t.access_token,
    refreshToken: t.refresh_token,
    expiresAt: Date.now() + t.expires_in * 1000,
  };
}

export async function refreshSession(session: SpotifySession): Promise<SpotifySession> {
  const res = await tokenRequest({
    grant_type: "refresh_token",
    refresh_token: session.refreshToken,
  });
  if (!res.ok) throw new SpotifyAuthError(`token refresh failed (${res.status})`);
  const t = (await res.json()) as TokenResponse;
  return {
    accessToken: t.access_token,
    refreshToken: t.refresh_token ?? session.refreshToken,
    expiresAt: Date.now() + t.expires_in * 1000,
  };
}

async function api<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401) throw new SpotifyAuthError("access token expired or invalid");
  if (!res.ok) throw new Error(`Spotify API ${path} failed (${res.status})`);
  return (await res.json()) as T;
}

type RawTrack = {
  id: string | null;
  name: string;
  uri: string;
  is_local?: boolean;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
};

function toTrack(t: RawTrack | null | undefined): LibraryTrack | null {
  // 삭제된 트랙·로컬 파일·에피소드는 Spotify로 재생할 수 없으므로 제외한다.
  if (!t || !t.id || t.is_local || !t.uri?.startsWith("spotify:track:")) return null;
  return {
    id: t.id,
    name: t.name,
    artist: t.artists.map((a) => a.name).join(", "),
    album: t.album.name,
    albumArtUrl: t.album.images[0]?.url ?? "",
    uri: t.uri,
  };
}

async function fetchLiked(token: string): Promise<LibraryTrack[]> {
  const out: LibraryTrack[] = [];
  for (let offset = 0; offset < LIKED_LIMIT; offset += 50) {
    // 응답은 최근에 좋아요한 순서 (design.md Decision 2).
    const page = await api<{ items: { track: RawTrack }[]; next: string | null }>(
      token,
      `/me/tracks?limit=50&offset=${offset}`,
    );
    for (const it of page.items) {
      const track = toTrack(it.track);
      if (track) out.push(track);
    }
    if (!page.next) break;
  }
  return out;
}

type PlaylistItemsPage = {
  items: { track?: RawTrack | null; item?: RawTrack | null }[];
};

async function fetchPlaylistTracks(token: string, id: string): Promise<LibraryTrack[]> {
  const query = `?limit=${PLAYLIST_TRACK_LIMIT}`;
  let page: PlaylistItemsPage;
  try {
    page = await api<PlaylistItemsPage>(token, `/playlists/${id}/tracks${query}`);
  } catch (e) {
    if (e instanceof SpotifyAuthError) throw e;
    // 일부 Spotify API 버전은 /items 엔드포인트를 쓴다.
    page = await api<PlaylistItemsPage>(token, `/playlists/${id}/items${query}`);
  }
  const out: LibraryTrack[] = [];
  for (const it of page.items) {
    const track = toTrack(it.track ?? it.item);
    if (track) out.push(track);
  }
  return out;
}

export async function fetchLibrary(token: string): Promise<LibraryResponse> {
  const me = await api<{ id: string; display_name: string | null }>(token, "/me");
  const liked = await fetchLiked(token);

  // 본인이 만든 플레이리스트만 (팔로우한 타인 플레이리스트 제외).
  const lists = await api<{ items: { id: string; name: string; owner: { id: string } }[] }>(
    token,
    "/me/playlists?limit=50",
  );
  const own = lists.items.filter((p) => p.owner.id === me.id).slice(0, PLAYLIST_LIMIT);

  const playlists: LibraryResponse["playlists"] = [];
  const seen = new Set(liked.map((t) => t.id));
  const tracks = [...liked];
  for (const p of own) {
    let list: LibraryTrack[] = [];
    try {
      list = await fetchPlaylistTracks(token, p.id);
    } catch (e) {
      if (e instanceof SpotifyAuthError) throw e;
      // 한 플레이리스트가 실패해도 나머지 라이브러리 조회는 계속한다.
    }
    playlists.push({ id: p.id, name: p.name, trackCount: list.length });
    for (const t of list) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        tracks.push(t);
      }
    }
  }

  return {
    user: { id: me.id, displayName: me.display_name ?? me.id },
    tracks,
    likedCount: liked.length,
    playlists,
  };
}
