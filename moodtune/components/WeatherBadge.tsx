"use client";

import { useEffect, useState } from "react";
import type { WeatherContext } from "@/types";
import SecondaryButton from "@/components/SecondaryButton";
import { weatherEmoji } from "@/lib/weatherEmoji";

type Props = {
  // 날씨를 못 가져오면 null. 추천 흐름은 날씨 없이 계속된다 (NFR-2).
  onChange?: (weather: WeatherContext | null) => void;
};

type State =
  | { status: "loading" }
  | { status: "ready"; weather: WeatherContext }
  | { status: "manual" };

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

export default function WeatherBadge({ onChange }: Props) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [city, setCity] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const done = (weather: WeatherContext) => {
      setState({ status: "ready", weather });
      onChange?.(weather);
    };
    const manual = () => {
      setState({ status: "manual" });
      onChange?.(null);
    };

    if (!("geolocation" in navigator)) {
      manual();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          done(await requestWeather(`lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`));
        } catch {
          manual();
        }
      },
      () => manual(),
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
    } catch {
      setState({ status: "manual" });
    } finally {
      setSubmitting(false);
    }
  };

  if (state.status === "loading") {
    return (
      <p
        data-testid="weather-badge"
        className="inline-flex min-h-11 items-center justify-center border border-solid border-black bg-white px-[10px] py-[4px] font-['Helvetica'] text-[20px] text-black"
      >
        날씨 확인 중…
      </p>
    );
  }

  if (state.status === "ready") {
    const { weather } = state;
    return (
      <div
        data-testid="weather-badge"
        className="inline-flex min-h-11 items-center gap-2 border border-solid border-[#F91E96] bg-white px-[10px] py-[4px] font-['Helvetica'] text-[20px] text-black"
      >
        {weather.city && <span>{weather.city}</span>}
        <span aria-hidden="true" className="text-2xl">
          {weatherEmoji(weather.icon)}
        </span>
        <span>{weather.temperatureC}°C</span>
      </div>
    );
  }

  return (
    <div
      data-testid="weather-badge"
      className="flex w-full flex-col gap-0 break-words border border-solid border-[#f91e22] bg-white px-[10px] py-[4px] font-['Helvetica'] text-[20px] leading-tight text-[#626262]"
    >
      <p>Cannot find location.</p>
      <p>Search yours:</p>
      <div className="mt-1 flex items-center gap-2">
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitCity()}
          placeholder="예: Seoul"
          aria-label="도시 이름"
          className="min-h-11 min-w-0 flex-1 border-0 border-b border-black bg-transparent text-black outline-none placeholder:text-xs placeholder:text-gray-400"
        />
        <span className="shrink-0">
          <SecondaryButton onClick={submitCity} disabled={submitting || !city.trim()}>
            확인
          </SecondaryButton>
        </span>
      </div>
    </div>
  );
}
