import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import catalogJson from "@/data/guest-catalog.json";
import { MOOD_OPTIONS, SITUATION_OPTIONS } from "@/lib/chipColors";
import { pickGuestCandidates, toLibraryTrack, type GuestCatalogEntry } from "@/lib/guestCatalog";
import { checkGuestLimit, createInstanceUsage, type BrowserUsage } from "@/lib/guestLimit";
import { GUEST_COUNTRIES, MAX_GUEST_GENRES, GUEST_GENRES, type GuestCountry, type GuestGenre } from "@/lib/guestSelection";
import { getRecommendation } from "@/lib/openai";
import { seal, unseal } from "@/lib/session";
import { shuffled } from "@/lib/shuffle";
import { fetchTrackAlbumArt } from "@/lib/spotify";
import { requireEnv } from "@/lib/env";
import type { UserContext, WeatherContext } from "@/types";

// 로그인 없는 추천 (add-guest-mode). 세션과 Spotify 사용자 API를 쓰지 않고, 선택값을 로그에 남기지 않는다.
const catalog = catalogJson as GuestCatalogEntry[];
const LIMIT_COOKIE = "moodtune_guest_limit";
const LIMIT_COOKIE_MAX_AGE = 60 * 60 * 24 * 2;
const instanceUsage = createInstanceUsage();
// openai.ts를 바꾸지 않고 이 경로에서만 건다. 시간이 지나면 응답만 끝내고, 진행 중인 OpenAI 요청은 취소되지 않는다.
const AI_TIMEOUT_MS = 20_000;

const badRequest = () => NextResponse.json({ error: "bad_request" }, { status: 400 });

// 공개 엔드포인트라 허용 목록의 값만 받는다. 목록 밖 문자열이 프롬프트로 들어가지 않는다.
function parseChips(body: Record<string, unknown>): UserContext | null {
  const { mood, situation } = body;
  if (mood !== undefined && !MOOD_OPTIONS.some((o) => o.label === mood)) return null;
  if (situation !== undefined && !SITUATION_OPTIONS.some((o) => o.label === situation)) return null;
  if (mood === undefined && situation === undefined) return null;
  return { mood: mood as string | undefined, situation: situation as string | undefined };
}

function parseSelection(body: Record<string, unknown>): { country: GuestCountry; genres: GuestGenre[] } | null {
  const { country, genres } = body;
  if (!GUEST_COUNTRIES.includes(country as GuestCountry)) return null;
  if (!Array.isArray(genres) || genres.length < 1 || genres.length > MAX_GUEST_GENRES) return null;
  if (new Set(genres).size !== genres.length || !genres.every((g) => GUEST_GENRES.includes(g))) return null;
  return { country: country as GuestCountry, genres };
}

// 프롬프트에는 weatherDayPhrase 결과만 들어가므로 condition은 넘기지 않는다.
function parseWeather(value: unknown): WeatherContext | undefined | null {
  if (value === undefined) return undefined;
  const w = value as Partial<WeatherContext> | null;
  if (!w || typeof w !== "object" || typeof w.temperatureC !== "number" || !Number.isFinite(w.temperatureC)) return null;
  if (w.icon !== undefined && (typeof w.icon !== "string" || !/^[0-9a-z]{2,4}$/.test(w.icon))) return null;
  if (w.city !== undefined && (typeof w.city !== "string" || w.city.length > 80)) return null;
  return { condition: "", temperatureC: w.temperatureC, city: w.city, icon: w.icon };
}

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("AI_TIMEOUT")), ms);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

// 주소 원문은 메모리에도 두지 않는다.
function addressKey(request: Request): string {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return createHash("sha256").update(`${requireEnv("SESSION_SECRET")}:${address}`).digest("base64url");
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return badRequest();
    body = parsed as Record<string, unknown>;
  } catch {
    return badRequest();
  }
  const context = parseChips(body);
  const selection = parseSelection(body);
  const weather = parseWeather(body.weather);
  if (!context || !selection || weather === null) return badRequest();

  const cookieStore = await cookies();
  const raw = cookieStore.get(LIMIT_COOKIE)?.value;
  const limit = checkGuestLimit(raw ? unseal<BrowserUsage>(raw) : null, addressKey(request), instanceUsage, new Date());
  if (!limit.ok) return NextResponse.json({ error: "guest_limit" }, { status: 429 });

  const { candidates, widened } = pickGuestCandidates(catalog, selection, (items) => shuffled(items, Math.random));
  if (!candidates.length) return NextResponse.json({ error: "recommend_failed" }, { status: 502 });

  try {
    const result = await withTimeout(
      getRecommendation({ context, weather, librarySample: candidates.map(toLibraryTrack) }),
      AI_TIMEOUT_MS,
    );
    const albumArtUrl = await fetchTrackAlbumArt(result.track.id);
    // 성공한 요청만 브라우저 하루 횟수에 넣는다. 주소·전체 한도는 비용 보호를 위해 실패도 센다.
    cookieStore.set(LIMIT_COOKIE, seal(limit.browser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: LIMIT_COOKIE_MAX_AGE,
    });
    return NextResponse.json({ ...result, track: { ...result.track, albumArtUrl }, widened });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    console.error("[guest/recommend] recommendation failed:", message);
    if (message === "OpenAI request failed (429)") return NextResponse.json({ error: "ai_busy" }, { status: 503 });
    return NextResponse.json({ error: "recommend_failed" }, { status: message === "AI_TIMEOUT" ? 504 : 502 });
  }
}
