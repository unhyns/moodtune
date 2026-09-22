import { NextResponse, type NextRequest } from "next/server";
import { requireEnv } from "@/lib/env";
import type { WeatherContext } from "@/types";

type OpenWeatherResponse = {
  name?: string;
  weather?: { description: string }[];
  main?: { temp: number };
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const city = searchParams.get("city")?.trim();

  const params = new URLSearchParams({ units: "metric", lang: "kr" });
  if (lat && lon && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lon))) {
    params.set("lat", lat);
    params.set("lon", lon);
  } else if (city) {
    // 국가 코드(KR)를 붙이면 영문 지명 검색 정확도가 올라간다. 다만 "서울"처럼 OpenWeatherMap
    // 무료 지오코딩 DB에 한글로 등록되지 않은 지명은 국가 코드를 붙여도 그대로 404다 — 이건
    // 이 API의 한계이며, 클라이언트 쪽 안내 문구로 보완한다(카카오/네이버 로컬 API 등 추가 연동은 하지 않음).
    params.set("q", city.includes(",") ? city : `${city},KR`);
  } else {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  try {
    params.set("appid", requireEnv("OPENWEATHER_API_KEY"));
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?${params}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return res.status === 404
        ? NextResponse.json({ error: "not_found" }, { status: 404 })
        : NextResponse.json({ error: "weather_failed" }, { status: 502 });
    }
    const data = (await res.json()) as OpenWeatherResponse;
    if (!data.weather?.[0] || !data.main) {
      return NextResponse.json({ error: "weather_failed" }, { status: 502 });
    }
    const weather: WeatherContext = {
      condition: data.weather[0].description,
      temperatureC: Math.round(data.main.temp),
      city: data.name,
    };
    return NextResponse.json(weather);
  } catch {
    return NextResponse.json({ error: "weather_failed" }, { status: 502 });
  }
}
