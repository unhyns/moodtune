"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QuickReplyChip from "@/components/QuickReplyChip";
import WeatherBadge from "@/components/WeatherBadge";
import LiveClock from "@/components/LiveClock";
import LoadingPopup from "@/components/LoadingPopup";
import { MOOD_OPTIONS, SITUATION_OPTIONS } from "@/lib/chipColors";
import { readGuestSelection, type GuestSelection } from "@/lib/guestSelection";
import { useRecommendSubmit } from "@/lib/useRecommendSubmit";
import type { WeatherContext } from "@/types";

// 게스트 입력 화면 (add-guest-mode). Figma가 없어 /input의 디자인을 그대로 쓴다.
// 라이브러리·세션을 읽지 않고, 국가·장르는 랜딩의 바텀시트에서 넘어온 값을 쓴다.
export default function GuestInputPage() {
  const router = useRouter();
  const [mood, setMood] = useState<string | null>(null);
  const [situation, setSituation] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherContext | null>(null);
  const [selection, setSelection] = useState<GuestSelection | null>(null);
  const { isSubmitting, recommendation, error: submitError, guestNotice, submit, handlePopupComplete } = useRecommendSubmit();

  // sessionStorage는 브라우저에만 있으므로 마운트 후 읽는다. 선택 없이 직접 들어오면 랜딩으로 돌려보낸다.
  useEffect(() => {
    const saved = readGuestSelection();
    if (!saved) {
      router.replace("/");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 시 브라우저 저장소에서 한 번 복원
    setSelection(saved);
  }, [router]);

  const canSubmit = selection !== null && (mood !== null || situation !== null) && !isSubmitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    submit({
      endpoint: "/api/guest/recommend",
      guest: true,
      body: {
        mood: mood ?? undefined,
        situation: situation ?? undefined,
        weather: weather ?? undefined,
        country: selection.country,
        genres: selection.genres,
      },
      resultParams: { mood: mood ?? undefined, situation: situation ?? undefined },
    });
  };

  if (!selection) return <main className="min-h-dvh w-full bg-[#ea7eb9]" />;

  return (
    <main className="relative min-h-dvh w-full overflow-x-hidden bg-[#ea7eb9]">
      <div className="relative mx-auto min-h-[1420px] w-full max-w-[393px] overflow-x-hidden">
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

        {/* 게스트는 Spotify 연동이 없어 그 자리에 선택 요약을 둔다. 누르면 랜딩의 시트로 돌아가 바꾼다. */}
        <Link
          href="/?guest=1"
          aria-label={`선택 바꾸기: ${selection.country}, ${selection.genres.join(", ")}`}
          className="absolute left-[90px] top-[105px] whitespace-nowrap border border-solid border-[#e43c98] bg-white px-[10px] py-[4px] font-['Helvetica'] text-[12px] leading-[14px] text-black before:absolute before:left-0 before:top-1/2 before:h-10 before:w-full before:-translate-y-1/2 before:content-['']"
        >
          {selection.country} · {selection.genres.join(", ")}
        </Link>

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

        {submitError !== null && (
          <p
            role="alert"
            className="absolute left-1/2 top-[1190px] w-[280px] -translate-x-1/2 border border-solid border-black bg-white px-3 py-2 text-center text-xs text-black"
          >
            {guestNotice === "limit"
              ? "오늘 체험 횟수를 다 썼어요. 내일 다시 와주세요."
              : guestNotice === "busy"
                ? "지금 요청이 많아요. 잠시 후 다시 시도해 주세요."
                : "추천을 가져오지 못했어요. 다시 시도해 주세요."}
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

        <a
          href="https://www.last.fm"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute left-1/2 top-[1350px] -translate-x-1/2 whitespace-nowrap border border-solid border-[#e43c98] bg-white px-[10px] py-[4px] font-['Helvetica'] text-[12px] leading-[14px] text-black underline"
        >
          곡 선정 참고: Last.fm
        </a>
      </div>

      {isSubmitting && <LoadingPopup ready={recommendation !== null} onComplete={handlePopupComplete} />}
    </main>
  );
}
