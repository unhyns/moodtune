import type { WeatherContext } from "@/types";

// 날씨를 자연어 표현으로 바꾸는 공용 함수 (add-free-text-input design.md Decision 8).
// 지금은 자유 텍스트 경로의 고정 reason에만 쓴다. 칩 경로도 날씨·계절 반영 작업에서 같은 함수를 쓰도록 바꿀 예정이다.
// 경계값 검증: weatherPhrase.test.mjs (`node --test lib/weatherPhrase.test.mjs`).

// OpenWeather icon 코드 앞 두 자리 → 상태 표현.
const CONDITION_BY_ICON_PREFIX: Record<string, string> = {
  "01": "맑고",
  "02": "구름 끼고",
  "03": "흐리고",
  "04": "흐리고",
  "09": "비 오고",
  "10": "비 오고",
  "11": "비 오고",
  "13": "눈 오고",
  "50": "안개 끼고",
};

// 매핑에 없거나 icon이 없으면 null을 반환한다.
export function conditionPhrase(icon: string | undefined): string | null {
  if (!icon) return null;
  const prefix = icon.slice(0, 2);
  return Object.hasOwn(CONDITION_BY_ICON_PREFIX, prefix) ? CONDITION_BY_ICON_PREFIX[prefix] : null;
}

// 반올림한 정수 기온 → 5단계 기온 표현. 가장 낮은 단계를 기본값으로 두고
// 이상(>=) 비교를 아래에서 위로 이어 써서 어떤 값에도 빈 구간이 없게 한다.
export function temperaturePhrase(temperatureC: number): string {
  const t = Math.round(temperatureC);
  let phrase = "추운"; // 5 이하(영하 포함)
  if (t >= 6) phrase = "쌀쌀한";
  if (t >= 12) phrase = "시원한";
  if (t >= 17) phrase = "따뜻한";
  if (t >= 25) phrase = "더운";
  return phrase;
}

// "{상태} {기온표현} 날". 상태가 없으면 "{기온표현} 날".
export function weatherDayPhrase(weather: WeatherContext): string {
  const condition = conditionPhrase(weather.icon);
  const temperature = temperaturePhrase(weather.temperatureC);
  return condition ? `${condition} ${temperature} 날` : `${temperature} 날`;
}
