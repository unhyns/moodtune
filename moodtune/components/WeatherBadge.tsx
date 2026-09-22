"use client";

import { useEffect, useState } from "react";
import type { WeatherContext } from "@/types";
import SecondaryButton from "@/components/SecondaryButton";

type Props = {
  // 날씨를 못 가져오면 null. 추천 흐름은 날씨 없이 계속된다 (NFR-2).
  onChange?: (weather: WeatherContext | null) => void;
};

type State =
  | { status: "loading" }
  | { status: "ready"; weather: WeatherContext }
  | { status: "manual"; message: string };

// city 검색 실패 시 원인(404 vs 그 외)에 따라 다른 안내 문구를 보여주기 위해 상태 코드를 들고 다닌다.
class WeatherFetchError extends Error {
  constructor(public status: number) {
    super(String(status));
  }
}

async function requestWeather(query: string): Promise<WeatherContext> {
  const res = await fetch(`/api/weather?${query}`);
  if (!res.ok) throw new WeatherFetchError(res.status);
  return (await res.json()) as WeatherContext;
}

// 도시 입력창 아래에 항상 보이는 가이드. "서울"처럼 OpenWeatherMap 무료 지오코딩이 인식 못 하는
// 한글 지명이 있어서(카카오/네이버 로컬 API 등은 도입하지 않기로 함), 영문 검색을 먼저 권한다.
const CITY_GUIDE_TEXT = "찾는 도시가 안 나오면 영문 지명으로 검색해보세요 (예: Seoul, Busan)";

export default function WeatherBadge({ onChange }: Props) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [city, setCity] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const done = (weather: WeatherContext) => {
      setState({ status: "ready", weather });
      onChange?.(weather);
    };
    const manual = (message: string) => {
      setState({ status: "manual", message });
      onChange?.(null);
    };

    if (!("geolocation" in navigator)) {
      manual("위치 정보를 사용할 수 없어요. 도시를 직접 입력해 주세요.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          done(await requestWeather(`lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`));
        } catch {
          manual("날씨를 불러오지 못했어요. 도시를 직접 입력해 주세요.");
        }
      },
      () => manual("위치 권한이 없어요. 도시를 직접 입력해 주세요."),
      { timeout: 10_000 },
    );
    // 마운트 시 한 번만 실행한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitCity = async () => {
    const name = city.trim();
    if (!name) return;
    setSubmitting(true);
    try {
      const weather = await requestWeather(`city=${encodeURIComponent(name)}`);
      setState({ status: "ready", weather });
      onChange?.(weather);
    } catch (e) {
      const notFound = e instanceof WeatherFetchError && e.status === 404;
      setState({
        status: "manual",
        message: notFound
          ? `'${name}'을(를) 찾을 수 없어요. 영문 지명으로 다시 시도해보세요.`
          : "날씨를 불러오지 못했어요. 잠시 후 다시 시도해주세요.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (state.status === "loading") {
    return <p className="text-sm text-zinc-400">날씨 확인 중…</p>;
  }

  if (state.status === "ready") {
    const { weather } = state;
    return (
      <p
        data-testid="weather-badge"
        className="inline-flex rounded-full bg-zinc-100 px-4 py-2 text-sm dark:bg-zinc-800"
      >
        {weather.city ? `${weather.city} · ` : ""}
        {weather.condition} · {weather.temperatureC}°C
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-zinc-500">{state.message}</p>
      <div className="flex gap-2">
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitCity()}
          placeholder="예: Seoul"
          aria-label="도시 이름"
          className="min-h-11 flex-1 rounded-full border border-zinc-300 bg-transparent px-4 text-sm dark:border-zinc-700"
        />
        <SecondaryButton onClick={submitCity} disabled={submitting || !city.trim()}>
          확인
        </SecondaryButton>
      </div>
      <p className="text-xs text-zinc-400">{CITY_GUIDE_TEXT}</p>
    </div>
  );
}
