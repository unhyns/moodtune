// OpenWeather 아이콘 코드(앞 2자리)를 시스템 이모지로 매핑한다. 외부 아이콘 이미지는 쓰지 않는다.
// components/WeatherBadge.tsx(client)와 app/result/page.tsx(server) 양쪽에서 쓰기 때문에
// "use client" 모듈이 아닌 별도 파일로 둔다.
export function weatherEmoji(icon?: string): string {
  const map: Record<string, string> = {
    "01": "☀️",
    "02": "⛅",
    "03": "☁️",
    "04": "☁️",
    "09": "🌧️",
    "10": "🌦️",
    "11": "⛈️",
    "13": "❄️",
    "50": "🌫️",
  };
  return map[icon?.slice(0, 2) ?? ""] ?? "🌡️";
}
