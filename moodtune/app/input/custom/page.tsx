"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import localFont from "next/font/local";
import { Pixelify_Sans } from "next/font/google";
import LoadingPopup from "@/components/LoadingPopup";
import { clearDraft, readDraft, readWeatherHandoff, writeDraft, type WeatherHandoff } from "@/lib/inputHandoff";
import { useRecommendSubmit } from "@/lib/useRecommendSubmit";
import { weatherEmoji } from "@/lib/weatherEmoji";

// 자유 텍스트 입력 페이지 (add-free-text-input). 칩은 없고, 칩 선택 상태도 읽지 않는다.
// 날씨는 새로 조회하지 않고 /input이 sessionStorage에 남긴 값만 쓴다.
// 레이아웃은 Figma 156:586(빈 상태)·156:624(입력 상태). 배경 PNG 위에 PNG 기준 %로 배치하고,
// 글자 크기는 cqw(393px 기준 px ÷ 3.93)로 둬서 화면 폭이 달라도 PNG의 흰 영역과 어긋나지 않는다 (design.md Decision 7).

// 둥근모(한글 픽셀 폰트)는 이 페이지에서만 쓴다. 서브셋 woff2 (design.md Decision 7).
const dungGeunMo = localFont({
  src: "../../../fonts/DungGeunMo-subset.woff2",
  variable: "--font-dgm",
  display: "swap",
});
const pixelFont = Pixelify_Sans({ subsets: ["latin"], weight: ["700"], variable: "--font-pixel" });

const MAX_LENGTH = 200;

const ERROR_MESSAGES = {
  failed: "추천을 가져오지 못했어요. 다시 시도해 주세요.",
  empty_library: "Spotify 라이브러리가 비어 있어요. 좋아요한 곡을 추가하거나 플레이리스트를 만든 뒤 다시 와주세요.",
} as const;

export default function CustomInputPage() {
  const [text, setText] = useState("");
  // undefined: 아직 읽기 전(서버 렌더·하이드레이션 중). null: 인계된 날씨 없음.
  const [handoff, setHandoff] = useState<WeatherHandoff | null | undefined>(undefined);
  // 마지막으로 제출한 글. 에러 메시지는 그 글을 고치기 전까지만 보여 준다.
  const [submittedText, setSubmittedText] = useState<string | null>(null);
  const { isSubmitting, recommendation, error, submit, handlePopupComplete } = useRecommendSubmit();

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messageRef = useRef<HTMLParagraphElement>(null);

  // sessionStorage는 브라우저에만 있으므로 마운트 후 한 번 읽는다 (하이드레이션 불일치 방지).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 시 브라우저 저장소에서 한 번 복원
    setText(readDraft());
    setHandoff(readWeatherHandoff());
  }, []);

  const weather = handoff?.status === "ready" ? handoff.weather : undefined;
  const canSubmit = text.trim().length > 0 && text.length <= MAX_LENGTH && !isSubmitting;
  const visibleError = error && text === submittedText ? error : null;

  // 입력창은 내부 스크롤 없이 글 길이만큼 늘어나고, 넘치면 바깥 영역(scrollRef)이 스크롤된다.
  // field-sizing 대신 JS로 맞춘다 — iOS Safari에서도 같은 동작.
  const fitHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    // 높이를 잠깐 0으로 줄이면 바깥 영역의 scrollTop이 0으로 잘린다. 되돌려야 중간 편집·폭 변경 때 화면이 위로 튀지 않는다.
    const box = scrollRef.current;
    const scrollTop = box?.scrollTop ?? 0;
    ta.style.height = "0px";
    ta.style.height = `${ta.scrollHeight}px`;
    if (box) box.scrollTop = scrollTop;
  }, []);

  useLayoutEffect(() => {
    fitHeight();
    // 글 끝에서 입력 중이면 커서 줄이 영역 아래로 밀리지 않게 따라 내려간다. 중간 편집은 브라우저가 커서를 보이게 스크롤한다.
    const ta = textareaRef.current;
    const box = scrollRef.current;
    if (!ta || !box || document.activeElement !== ta || ta.selectionEnd !== ta.value.length) return;
    const bottom = ta.offsetTop + ta.offsetHeight;
    if (bottom > box.scrollTop + box.clientHeight) box.scrollTop = bottom - box.clientHeight;
  }, [text, fitHeight]);

  // 화면 폭이 바뀌면 글자 크기(cqw)와 줄 수가 바뀌므로 높이를 다시 맞춘다.
  useEffect(() => {
    const box = scrollRef.current;
    if (!box) return;
    const observer = new ResizeObserver(fitHeight);
    observer.observe(box);
    return () => observer.disconnect();
  }, [fitHeight]);

  // 메시지가 생기면 보이는 위치까지 스크롤한다.
  useEffect(() => {
    if (visibleError) messageRef.current?.scrollIntoView({ block: "nearest" });
  }, [visibleError]);

  const updateText = (value: string) => {
    setText(value);
    writeDraft(value);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmittedText(text);
    // 칩 값과 resultParams는 넘기지 않는다 — 결과 URL에도 텍스트 원문이 실리지 않는다.
    submit({ body: { freeText: text.trim(), weather }, onSuccess: clearDraft });
  };

  return (
    <main
      className={`${dungGeunMo.variable} ${pixelFont.variable} relative min-h-dvh w-full overflow-x-hidden bg-[#ea7eb9]`}
    >
      {/* Figma 상단 상태바(21:30)는 다른 화면처럼 그리지 않고, PNG 위치(y=42)만 Figma대로 둔다. */}
      <div className="mx-auto w-full max-w-[393px] pb-[40px] pt-[42px]">
        <div className="group @container relative aspect-[393/850] w-full">
          {/* 안테나·배터리·제목 바·메뉴/OK/보내기 키는 모두 이 그림의 일부인 장식이다. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- 고정 비율 장식용 배경 이미지 (Figma 156:647) */}
          <img
            src="/input/custom-phone.png"
            alt=""
            aria-hidden="true"
            draggable={false}
            className="pointer-events-none absolute inset-0 size-full select-none"
          />

          {/* 포커스 표시: 흰 영역 안쪽 1px 분홍 점선 */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[calc(8.95%+1.018cqw)] left-[calc(3.87%+1.018cqw)] right-[calc(3.87%+1.018cqw)] top-[calc(12.2%+1.018cqw)] hidden border border-dashed border-[#f91e96] group-has-[textarea:focus]:block"
          />

          {/* 인사 문구(고정) + 첫 줄 오른쪽 끝의 현재 날씨 */}
          <div className="absolute left-[8.651%] right-[6.870%] top-[14.353%] text-[5.089cqw] font-bold leading-[6.107cqw] [font-family:var(--font-pixel),var(--font-dgm)]">
            <h1 id="free-text-heading" className="whitespace-nowrap text-[#ea7eb9]">
              <span className="block">Hi (｡･ω･)ﾉﾞ</span>
              <span className="block">Tell me how your day goin:</span>
            </h1>
            {handoff !== undefined && (
              <div className="absolute inset-x-0 top-0 flex items-baseline">
                {/* 첫 줄 폭만큼 자리를 비워 날씨가 인사 문구와 겹치지 않게 하고, 같은 기준선을 잡는다.
                    날씨 글자는 14px(12px은 1배율에서 숫자가 뭉개짐). 도시 이름은 overflow-clip이라 기준선이 유지된 채 말줄임된다. */}
                <span aria-hidden="true" className="invisible shrink-0 whitespace-nowrap pr-[2.036cqw]">
                  Hi (｡･ω･)ﾉﾞ
                </span>
                <div
                  role="group"
                  aria-label="현재 날씨"
                  data-testid="weather-badge"
                  className="flex min-w-0 flex-1 items-baseline justify-end gap-[1.018cqw] whitespace-nowrap text-[3.562cqw] text-[#b0b0b6]"
                >
                  {weather ? (
                    <>
                      {weather.city && <span className="min-w-0 overflow-clip text-ellipsis">{weather.city}</span>}
                      <span className="shrink-0">{weatherEmoji(weather.icon)}</span>
                      <span className="shrink-0 tabular-nums">{weather.temperatureC}°C</span>
                    </>
                  ) : (
                    <span>날씨 정보 없음</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 입력 글 + 시스템 메시지. 21줄(y 230~650)을 넘으면 이 영역 전체가 스크롤된다. */}
          <div
            ref={scrollRef}
            className="absolute left-[8.651%] right-[6.870%] top-[22.118%] h-[49.412%] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {/* Enter는 줄바꿈이다. 제출은 버튼으로만 해서 한글 조합 중 Enter로 인한 중복 제출 경로가 없다. */}
            {/* 폭은 둥근모 한글 15자(302/393). 글자 단위로 꺾고 우측 정렬한다.
                빈 상태 안내(Pixelify)는 Figma보다 2px 위에 그려져서 placeholder가 보일 때만 위 여백 2px을 준다. */}
            <textarea
              ref={textareaRef}
              id="free-text"
              value={text}
              maxLength={MAX_LENGTH}
              rows={1}
              onChange={(e) => {
                // 조합 중에는 자르지 않는다. 일부 브라우저에서 조합 중 maxLength를 넘긴 경우 조합이 끝난 뒤 자른다.
                const composing = (e.nativeEvent as InputEvent).isComposing;
                updateText(composing ? e.target.value : e.target.value.slice(0, MAX_LENGTH));
              }}
              onCompositionEnd={(e) => updateText(e.currentTarget.value.slice(0, MAX_LENGTH))}
              placeholder="Text here what you feel..."
              aria-labelledby="free-text-heading"
              aria-describedby="free-text-notice free-text-count"
              className="ml-auto block w-[76.845cqw] resize-none overflow-hidden break-all border-0 bg-transparent p-0 text-right text-[5.089cqw] leading-[5.089cqw] text-[#f91e96] caret-[#f91e96] outline-none [font-family:var(--font-dgm)] [overflow-wrap:anywhere] placeholder:font-bold placeholder:text-[#b0b0b6] placeholder:[font-family:var(--font-pixel)] placeholder-shown:pt-[0.509cqw]"
            />
            {visibleError && (
              // 간격은 Figma 인사 문구 아래 끝(y212)~입력 첫 줄 위 끝(y230) = 18px = PNG 높이의 2.118%.
              <p
                ref={messageRef}
                role="alert"
                className="mt-[4.580cqw] w-[76.845cqw] break-keep text-[5.089cqw] font-bold leading-[6.107cqw] text-[#ea7eb9] [font-family:var(--font-pixel),var(--font-dgm)]"
              >
                {ERROR_MESSAGES[visibleError]}
              </p>
            )}
          </div>

          {/* 안내 문구·글자 수는 14px. 처음 정한 12px은 1배율 스크린샷에서 숫자가 뭉개져 키웠다. 16px은 한 줄에 안 들어간다. */}
          <div className="absolute left-[8.651%] right-[6.870%] top-[72.235%] flex items-baseline justify-between gap-[2.036cqw] text-[3.562cqw] text-[#b0b0b6]">
            <p id="free-text-notice" className="[font-family:var(--font-dgm)]">
              입력한 내용은 추천 생성에 사용돼요
            </p>
            <p id="free-text-count" className="shrink-0 font-bold tabular-nums [font-family:var(--font-pixel)]">
              {text.length}/{MAX_LENGTH}
            </p>
          </div>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="absolute left-1/2 top-[79.176%] -translate-x-1/2 whitespace-nowrap bg-[#f91e96] px-[6.107cqw] py-[3.053cqw] text-[5.089cqw] font-bold leading-[6.107cqw] text-[#fafafa] [font-family:var(--font-pixel)] disabled:cursor-not-allowed disabled:bg-[#b0b0b6]"
          >
            Tune Mine!
          </button>
        </div>

        <div className="mt-[18px] flex justify-center">
          <Link
            href="/input"
            className="border border-solid border-[#e43c98] bg-white px-[10px] py-[4px] text-[14px] font-bold text-[#e43c98] [font-family:var(--font-pixel)]"
          >
            ← Back to Choose
          </Link>
        </div>
      </div>

      {isSubmitting && <LoadingPopup ready={recommendation !== null} onComplete={handlePopupComplete} />}
    </main>
  );
}
