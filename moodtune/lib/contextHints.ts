import type { WeatherContext } from "@/types";

// 날씨·계절을 곡 선택용 약한 힌트 문장으로 바꾼다 (add-weather-season-hints design.md Decision 1).
// 후보를 거르지 않고 프롬프트에만 넣는다. 경계값 검증: contextHints.test.mjs (`node --test lib/contextHints.test.mjs`).

const SNOW_ICON_PREFIX = "13";

// weatherPhrase의 상태 문구와 범주가 다르다: 02는 맑음, 50은 흐림으로 본다.
const WEATHER_HINT_BY_ICON_PREFIX: Record<string, string> = {
  "01": "밝고 경쾌한 느낌",
  "02": "밝고 경쾌한 느낌",
  "03": "차분한 느낌",
  "04": "차분한 느낌",
  "50": "차분한 느낌",
  "09": "잔잔한 느낌",
  "10": "잔잔한 느낌",
  "11": "잔잔한 느낌",
  [SNOW_ICON_PREFIX]: "따뜻하고 설레는 느낌",
};

const WINTER_EXCITED_MOODS = ["Excited", "Romantic"];

// 서버 시간대(배포 환경은 UTC)와 무관하게 서울 기준 월·시를 구한다.
const seoulClock = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Seoul",
  month: "numeric",
  hour: "numeric",
  hourCycle: "h23",
});

function seasonHint(now: Date, isSnowing: boolean, mood: string | undefined, isFreeText: boolean): string {
  const parts = seoulClock.formatToParts(now);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const hour = Number(parts.find((p) => p.type === "hour")?.value);

  if (month >= 3 && month <= 5) return "가볍고 행복한 느낌";
  if (month >= 6 && month <= 8) return "빠르고 열정적인 느낌";
  // 시간대 구분은 가을에만 둔다(의도된 결정). 낮 06:00~17:59, 밤 18:00~05:59.
  if (month >= 9 && month <= 11) {
    return hour >= 6 && hour < 18 ? "가볍고 잔잔한 느낌" : "차분하고 서정적인 느낌";
  }
  // 자유 텍스트 경로에는 기분 칩이 없으므로 눈일 때만 크리스마스 느낌이다.
  const excitedMood = !isFreeText && mood !== undefined && WINTER_EXCITED_MOODS.includes(mood);
  return isSnowing || excitedMood ? "설레고 따뜻한 크리스마스 느낌" : "차분하고 서정적인 느낌";
}

export type ContextHints = { weatherHint: string | null; seasonHint: string; priority: string };

export function buildContextHints(input: {
  weather?: WeatherContext;
  mood?: string;
  isFreeText: boolean;
  now: Date;
}): ContextHints {
  const { weather, mood, isFreeText, now } = input;
  const iconPrefix = weather?.icon?.slice(0, 2);
  const weatherHint =
    iconPrefix && Object.hasOwn(WEATHER_HINT_BY_ICON_PREFIX, iconPrefix) ? WEATHER_HINT_BY_ICON_PREFIX[iconPrefix] : null;

  return {
    weatherHint,
    seasonHint: seasonHint(now, iconPrefix === SNOW_ICON_PREFIX, mood, isFreeText),
    priority: isFreeText ? "note > weather > season" : "mood/situation > weather > season",
  };
}
