import { NextResponse } from "next/server";
import { fetchLibrary, refreshSession, SpotifyAuthError } from "@/lib/spotify";
import { getRecommendation } from "@/lib/openai";
import { clearSession, readSession, writeSession } from "@/lib/session";
import type { LibraryResponse, RecommendationResult, UserContext, WeatherContext } from "@/types";

// design.md Decision 2: 최근 좋아요 우선, 최대 50곡. fetchLibrary()는 liked를 먼저 담고
// 부족하면 본인 플레이리스트 트랙으로 채우므로, 앞에서 50개만 잘라도 그 우선순위가 유지된다.
const LIBRARY_SAMPLE_SIZE = 50;

type RequestBody = {
  mood?: string;
  situation?: string;
  weather?: WeatherContext;
};

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!body.mood && !body.situation) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  try {
    let activeSession = session;
    if (activeSession.expiresAt - Date.now() < 60_000) {
      activeSession = await refreshSession(activeSession);
      await writeSession(activeSession);
    }

    let library: LibraryResponse;
    try {
      library = await fetchLibrary(activeSession.accessToken);
    } catch (e) {
      console.error("[recommend] library fetch failed:", e);
      throw e;
    }
    if (library.tracks.length === 0) {
      return NextResponse.json({ error: "empty_library" }, { status: 422 });
    }

    const context: UserContext = { mood: body.mood, situation: body.situation };
    let result: RecommendationResult;
    try {
      result = await getRecommendation({
        context,
        weather: body.weather,
        librarySample: library.tracks.slice(0, LIBRARY_SAMPLE_SIZE),
      });
    } catch (e) {
      console.error("[recommend] OpenAI recommendation failed:", e);
      throw e;
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("[recommend]", e);
    if (e instanceof SpotifyAuthError) {
      await clearSession();
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "recommend_failed" }, { status: 502 });
  }
}
