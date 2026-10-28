"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LoadingPopup from "@/components/LoadingPopup";
import { clearDraft, readDraft, readWeatherHandoff, writeDraft, type WeatherHandoff } from "@/lib/inputHandoff";
import { useRecommendSubmit } from "@/lib/useRecommendSubmit";
import { weatherEmoji } from "@/lib/weatherEmoji";

// 자유 텍스트 입력 페이지 (add-free-text-input). 칩은 없고, 칩 선택 상태도 읽지 않는다.
// 날씨는 새로 조회하지 않고 /input이 sessionStorage에 남긴 값만 쓴다.
// Figma 디자인이 없어 /input의 색·태그 스타일을 따르는 세로 흐름 레이아웃으로 둔다.

const MAX_LENGTH = 200;

export default function CustomInputPage() {
  const [text, setText] = useState("");
  // undefined: 아직 읽기 전(서버 렌더·하이드레이션 중). null: 인계된 날씨 없음.
  const [handoff, setHandoff] = useState<WeatherHandoff | null | undefined>(undefined);
  const { isSubmitting, recommendation, error, submit, handlePopupComplete } = useRecommendSubmit();

  // sessionStorage는 브라우저에만 있으므로 마운트 후 한 번 읽는다 (하이드레이션 불일치 방지).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 시 브라우저 저장소에서 한 번 복원
    setText(readDraft());
    setHandoff(readWeatherHandoff());
  }, []);

  const weather = handoff?.status === "ready" ? handoff.weather : undefined;
  const canSubmit = text.trim().length > 0 && text.length <= MAX_LENGTH && !isSubmitting;

  const updateText = (value: string) => {
    setText(value);
    writeDraft(value);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    // 칩 값과 resultParams는 넘기지 않는다 — 결과 URL에도 텍스트 원문이 실리지 않는다.
    submit({ body: { freeText: text.trim(), weather }, onSuccess: clearDraft });
  };

  return (
    <main className="relative min-h-dvh w-full overflow-x-hidden bg-[#ea7eb9]">
      <div className="mx-auto flex w-full max-w-[393px] flex-col gap-6 px-[24px] pb-16 pt-[61px] font-['Helvetica'] text-black">
        {/* eslint-disable-next-line @next/next/no-img-element -- /input과 같은 로고 에셋 */}
        <img src="/input/moodtune-logo.png" alt="MoodTune" className="h-[38px] w-[129.59px]" />

        <h1 className="self-start border border-solid border-black bg-white px-[10px] py-[4px] text-[20px] font-normal">
          지금 상태를 직접 적어주세요
        </h1>

        <section className="flex flex-col items-start gap-2">
          <h2 className="border border-solid border-black bg-white px-[10px] py-[4px] text-[20px] font-normal">Weather?</h2>
          {handoff !== undefined &&
            (weather ? (
              <div
                data-testid="weather-badge"
                className="inline-flex min-h-11 items-center gap-2 border border-solid border-[#F91E96] bg-white px-[10px] py-[4px] text-[20px]"
              >
                {weather.city && <span>{weather.city}</span>}
                <span aria-hidden="true" className="text-2xl">
                  {weatherEmoji(weather.icon)}
                </span>
                <span>{weather.temperatureC}°C</span>
              </div>
            ) : (
              <p
                data-testid="weather-badge"
                className="inline-flex min-h-11 items-center border border-solid border-black bg-white px-[10px] py-[4px] text-[16px] text-[#626262]"
              >
                날씨 정보 없음
              </p>
            ))}
        </section>

        <section className="flex flex-col gap-2">
          <label
            htmlFor="free-text"
            className="self-start border border-solid border-black bg-white px-[10px] py-[4px] text-[20px]"
          >
            How are you now?
          </label>
          {/* Enter는 줄바꿈이다. 제출은 버튼으로만 해서 한글 조합 중 Enter로 인한 중복 제출 경로가 없다. */}
          <textarea
            id="free-text"
            value={text}
            maxLength={MAX_LENGTH}
            rows={5}
            onChange={(e) => {
              // 조합 중에는 자르지 않는다. 일부 브라우저에서 조합 중 maxLength를 넘긴 경우 조합이 끝난 뒤 자른다.
              const composing = (e.nativeEvent as InputEvent).isComposing;
              updateText(composing ? e.target.value : e.target.value.slice(0, MAX_LENGTH));
            }}
            onCompositionEnd={(e) => updateText(e.currentTarget.value.slice(0, MAX_LENGTH))}
            placeholder="예: 비 오는데 늦잠 자서 급하게 나가는 중"
            aria-describedby="free-text-notice free-text-count"
            className="w-full resize-none border border-solid border-black bg-white p-3 text-[16px] leading-snug outline-none placeholder:text-gray-400 focus-visible:border-[#f91e96]"
          />
          <div className="flex items-start justify-between gap-3 text-[13px]">
            <p id="free-text-notice">입력한 내용은 추천 생성에 사용됩니다.</p>
            <p id="free-text-count" className="shrink-0 tabular-nums">
              {text.length}/{MAX_LENGTH}
            </p>
          </div>
        </section>

        {error && (
          <p role="alert" className="border border-solid border-black bg-white px-3 py-2 text-center text-xs">
            {error === "empty_library"
              ? "Spotify 라이브러리가 비어 있어요. 좋아요한 곡을 추가하거나 플레이리스트를 만든 뒤 다시 와주세요."
              : "추천을 가져오지 못했어요. 다시 시도해 주세요."}
          </p>
        )}

        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="self-center whitespace-nowrap bg-[#f91e96] px-[24px] py-[12px] text-[20px] font-bold text-[#fafafa] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Tune Mine!
        </button>

        <Link
          href="/input"
          className="self-center border border-solid border-[#e43c98] bg-white px-[10px] py-[4px] text-[14px] text-[#e43c98]"
        >
          기분·상황 버튼으로 돌아가기
        </Link>
      </div>

      {isSubmitting && <LoadingPopup ready={recommendation !== null} onComplete={handlePopupComplete} />}
    </main>
  );
}
