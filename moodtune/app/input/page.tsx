"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QuickReplyChip from "@/components/QuickReplyChip";
import WeatherBadge from "@/components/WeatherBadge";
import LiveClock from "@/components/LiveClock";
import LoadingPopup from "@/components/LoadingPopup";
import { MOOD_OPTIONS, SITUATION_OPTIONS } from "@/lib/chipColors";
import type { LibraryResponse, WeatherContext } from "@/types";

// 오늘은 API 연동 없이 mock 데이터로 Result 화면 흐름만 확인한다.
const MOCK_RESULT = {
  uri: "spotify:track:mock",
  name: "Mock Song",
  artist: "Mock Artist",
  art: "",
  reason: "지금 기분과 상황에 잘 어울리는 곡이에요.",
};

export default function InputPage() {
  const router = useRouter();
  const [mood, setMood] = useState<string | null>(null);
  const [situation, setSituation] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherContext | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const [library, setLibrary] = useState<
    { status: "loading" } | { status: "ready"; total: number } | { status: "error" }
  >({ status: "loading" });

  // 만료·무효 세션이면 Landing으로 보내 재인증시킨다 (spotify-auth: Session Expiry Handling).
  useEffect(() => {
    fetch("/api/spotify/library")
      .then(async (res) => {
        if (res.status === 401) return router.replace("/");
        if (!res.ok) return setLibrary({ status: "error" });
        const data = (await res.json()) as LibraryResponse;
        setLibrary({ status: "ready", total: data.tracks.length });
      })
      .catch(() => setLibrary({ status: "error" }));
  }, [router]);

  const libraryEmpty = library.status === "ready" && library.total === 0;
  const canSubmit = (mood !== null || situation !== null) && !libraryEmpty;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const params = new URLSearchParams({
      uri: MOCK_RESULT.uri,
      name: MOCK_RESULT.name,
      artist: MOCK_RESULT.artist,
      art: MOCK_RESULT.art,
      reason: MOCK_RESULT.reason,
      type: "track",
    });
    if (mood) params.set("mood", mood);
    if (situation) params.set("situation", situation);
    if (weather) {
      if (weather.city) params.set("weatherCity", weather.city);
      if (weather.icon) params.set("weatherIcon", weather.icon);
      params.set("weatherTempC", String(weather.temperatureC));
    }
    // 추천이 이미 준비돼 있어도 로딩 팝업 시퀀스가 끝날 때까지는 이동하지 않는다 (체감 신뢰도).
    setResultUrl(`/result?${params.toString()}`);
  };

  return (
    <main className="relative min-h-dvh w-full overflow-x-hidden bg-[#ea7eb9]">
      <div className="relative mx-auto min-h-[1360px] w-full max-w-[393px] overflow-x-hidden">
        <h1 className="sr-only">지금 기분과 상황을 알려주세요</h1>

        {/* 순수 장식용 배경 이미지 — 클릭/기능 없음 */}
        {/* eslint-disable-next-line @next/next/no-img-element -- 장식용 배경 SVG */}
        <img
          src="/input/stars.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-[22px] top-[70px] h-[1201.337px] w-[350.337px]"
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- 장식용 스티커, next/image 불필요 */}
        <img
          src="/input/disc.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-[289px] top-[448px] size-[98px] object-cover"
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- 장식용 스티커 */}
        <img
          src="/input/cassette-tapes.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-[-10px] top-[58px] size-[117px] object-cover"
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- 장식용 스티커 */}
        <img
          src="/input/sourced-from-tumblr.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-[28px] top-[1090px] h-[157px] w-[135px] object-cover"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute flex h-[258.264px] w-[211.421px] items-center justify-center left-[-55px] top-[643px]"
        >
          <div className="flex-none rotate-[18.18deg]">
            {/* eslint-disable-next-line @next/next/no-img-element -- 장식용 스티커 */}
            <img
              src="/input/floppy-1.png"
              alt=""
              className="block h-[222.782px] w-[149.365px] object-cover"
            />
          </div>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute flex h-[259.268px] w-[238.565px] items-center justify-center left-[224px] top-[920px]"
        >
          <div className="flex-none rotate-[21.66deg]">
            {/* eslint-disable-next-line @next/next/no-img-element -- 장식용 스티커 */}
            <img
              src="/input/floppy-2.png"
              alt=""
              className="block h-[210.171px] w-[173.221px] object-cover"
            />
          </div>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute flex size-[369.929px] items-center justify-center left-[-125px] top-[236px]"
        >
          <div className="flex-none rotate-[31.36deg]">
            {/* eslint-disable-next-line @next/next/no-img-element -- 장식용 스티커 */}
            <img
              src="/input/phone-sticker.png"
              alt=""
              className="block size-[269.168px] object-cover"
            />
          </div>
        </div>

        {/* 실제 콘텐츠 */}
        {/* eslint-disable-next-line @next/next/no-img-element -- Figma 최신 로고 에셋 */}
        <img
          src="/input/moodtune-logo.png"
          alt="MoodTune"
          className="absolute left-[23px] top-[61px] h-[38px] w-[129.59px]"
        />

        <div className="absolute left-[90px] top-[105px] inline-flex items-center justify-center border border-solid border-[#1ed760] bg-white px-[10px] py-[4px]">
          <p className="whitespace-nowrap font-['Helvetica'] text-[16px] text-black">
            with <span className="text-[#1ed760]">Spotify</span>
          </p>
        </div>

        <div className="absolute left-1/2 top-[168px] -translate-x-1/2">
          <LiveClock />
        </div>

        <h2 className="absolute left-[32px] top-[490px] inline-flex items-center justify-center whitespace-nowrap border border-solid border-black bg-white px-[10px] py-[4px] font-['Helvetica'] text-[20px] font-normal text-black">
          Weather?
        </h2>
        <div className="absolute left-[96px] top-[544px] w-[290px]">
          <WeatherBadge onChange={setWeather} />
        </div>

        <h2 className="absolute left-[32px] top-[662px] inline-flex items-center justify-center whitespace-nowrap border border-solid border-black bg-white px-[10px] py-[4px] font-['Helvetica'] text-[20px] font-normal text-black">
          Mood?
        </h2>
        {MOOD_OPTIONS.map((option) => (
          <div key={option.label} className="absolute" style={{ left: option.left, top: option.top }}>
            <QuickReplyChip
              label={option.label}
              selected={mood === option.label}
              dimmed={mood !== null && mood !== option.label}
              borderColor={option.border}
              textColor={option.text}
              onClick={() => setMood(mood === option.label ? null : option.label)}
            />
          </div>
        ))}

        <h2 className="absolute left-[32px] top-[940px] inline-flex items-center justify-center whitespace-nowrap border border-solid border-black bg-white px-[10px] py-[4px] font-['Helvetica'] text-[20px] font-normal text-black">
          And Now you’re?
        </h2>
        {SITUATION_OPTIONS.map((option) => (
          <div key={option.label} className="absolute" style={{ left: option.left, top: option.top }}>
            <QuickReplyChip
              label={option.label}
              selected={situation === option.label}
              dimmed={situation !== null && situation !== option.label}
              borderColor={option.border}
              textColor={option.text}
              onClick={() => setSituation(situation === option.label ? null : option.label)}
            />
          </div>
        ))}

        {libraryEmpty && (
          <p
            role="alert"
            className="absolute left-1/2 top-[1190px] w-[280px] -translate-x-1/2 border border-solid border-black bg-white px-3 py-2 text-center text-xs text-black"
          >
            Spotify 라이브러리가 비어 있어요. 좋아요한 곡을 추가하거나 플레이리스트를 만든 뒤 다시 와주세요.
          </p>
        )}

        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="absolute left-1/2 top-[1280px] -translate-x-1/2 whitespace-nowrap bg-[#f91e96] px-[24px] py-[12px] font-['Helvetica'] text-[20px] font-bold text-[#fafafa] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Tune Mine!
        </button>
      </div>

      {resultUrl && <LoadingPopup onComplete={() => router.push(resultUrl)} />}
    </main>
  );
}
