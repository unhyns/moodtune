import type { WeatherContext } from "@/types";

// /input → /input/custom 인계용 sessionStorage (add-free-text-input design.md Decision 2·3).
// 탭 안에서만 유지되고 서버로 보내지 않는다. 저장소 접근이 막혀 있으면 "없음"으로 동작한다.

const WEATHER_KEY = "moodtune:weather";
const DRAFT_KEY = "moodtune:freeTextDraft";

export type WeatherHandoff = { status: "ready"; weather: WeatherContext } | { status: "failed" };

function read(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, value);
  } catch {
    // 저장소 차단 — 인계 없이 동작한다.
  }
}

export function clearWeatherHandoff() {
  write(WEATHER_KEY, null);
}

// WeatherBadge의 onChange 값 그대로: 날씨면 ready, null(조회 실패)이면 failed.
export function writeWeatherHandoff(weather: WeatherContext | null) {
  const value: WeatherHandoff = weather ? { status: "ready", weather } : { status: "failed" };
  write(WEATHER_KEY, JSON.stringify(value));
}

// 키가 없거나(로딩 중 이동, 직접 진입) 형식이 맞지 않으면 null.
export function readWeatherHandoff(): WeatherHandoff | null {
  const raw = read(WEATHER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<WeatherHandoff>;
    if (parsed.status === "failed") return { status: "failed" };
    if (parsed.status === "ready") {
      const w = (parsed as { weather?: Partial<WeatherContext> }).weather;
      if (w && typeof w.condition === "string" && typeof w.temperatureC === "number") {
        return { status: "ready", weather: w as WeatherContext };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function readDraft(): string {
  return read(DRAFT_KEY) ?? "";
}

export function writeDraft(text: string) {
  write(DRAFT_KEY, text);
}

export function clearDraft() {
  write(DRAFT_KEY, null);
}
