import { NextResponse } from "next/server";
import { fetchLibrary, refreshSession, SpotifyAuthError } from "@/lib/spotify";
import { getRecommendation } from "@/lib/openai";
import { clearSession, readSession, writeSession } from "@/lib/session";
import type {
  LibraryFetchResult,
  RecommendationResult,
  SourcesByTrackId,
  UserContext,
  WeatherContext,
} from "@/types";

// design.md Decision 2: 최근 좋아요 우선, 최대 50곡. fetchLibrary()는 liked를 먼저 담고
// 부족하면 본인 플레이리스트 트랙으로 채우므로, 앞에서 50개만 잘라도 그 우선순위가 유지된다.
const LIBRARY_SAMPLE_SIZE = 50;

// 자유 텍스트 최대 길이 (add-free-text-input). trim 후 UTF-16 길이로 센다 — 클라이언트 textarea maxLength와 같은 기준.
const MAX_FREE_TEXT_LENGTH = 200;

type RequestBody = {
  mood?: string;
  situation?: string;
  freeText?: unknown;
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
  // freeText가 있으면 칩(mood/situation)은 무시한다 — 텍스트 경로는 칩과 함께 쓰지 않는다.
  let context: UserContext;
  if (body.freeText !== undefined) {
    if (typeof body.freeText !== "string") {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    const freeText = body.freeText.trim();
    if (!freeText || freeText.length > MAX_FREE_TEXT_LENGTH) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    context = { freeText };
  } else {
    if (!body.mood && !body.situation) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    context = { mood: body.mood, situation: body.situation };
  }

  try {
    let activeSession = session;
    if (activeSession.expiresAt - Date.now() < 60_000) {
      activeSession = await refreshSession(activeSession);
      await writeSession(activeSession);
    }

    let fetched: LibraryFetchResult;
    try {
      fetched = await fetchLibrary(activeSession.accessToken);
    } catch (e) {
      console.error("[recommend] library fetch failed:", e);
      throw e;
    }
    const { library } = fetched;
    if (library.tracks.length === 0) {
      return NextResponse.json({ error: "empty_library" }, { status: 422 });
    }

    const librarySample = library.tracks.slice(0, LIBRARY_SAMPLE_SIZE);
    // 추천 후보에 해당하는 출처만 넘긴다 (add-richer-reasons design.md Decision 1).
    const sourcesByTrackId: SourcesByTrackId = {};
    for (const t of librarySample) {
      const sources = fetched.sourcesByTrackId[t.id];
      if (sources) sourcesByTrackId[t.id] = sources;
    }

    let result: RecommendationResult;
    try {
      result = await getRecommendation({
        context,
        weather: body.weather,
        librarySample,
        sourcesByTrackId,
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
