"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { Pixelify_Sans } from "next/font/google";
import { feedbackStats, readSignals, setFeedback } from "@/lib/personalSignals";
import type { PersonalSignal } from "@/types";

// Result 페이지·LoadingPopup과 같은 설정이라 같은 폰트 파일을 쓴다.
const pixelFont = Pixelify_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

type Props = {
  // spotify:(track|album|playlist):{id} — page.tsx에서 isSignalUri로 걸러서 넘긴다.
  uri: string;
};

// 다른 탭에서 응답한 경우도 반영한다.
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

// Figma result(node 121:52) / result_after feedback(node 121:149).
// 서버·첫 하이드레이션에서는 localStorage를 모르므로 "loading"으로 그리고, 그 뒤 저장된 응답에 따라 질문 또는 감사 문구를 보여준다.
export default function SatisfactionFeedback({ uri }: Props) {
  const stored = useSyncExternalStore(
    subscribe,
    () => readSignals().items[uri]?.feedback ?? "none",
    () => "loading",
  );
  const [answered, setAnswered] = useState(false);
  const thanksRef = useRef<HTMLParagraphElement>(null);

  const phase = answered || stored === "liked" || stored === "disliked" ? "done" : stored;

  function respond(value: NonNullable<PersonalSignal["feedback"]>) {
    if (!setFeedback(uri, value)) {
      console.warn("[MoodTune] 만족도 응답을 저장하지 못했어요 (이미 응답했거나 저장소를 쓸 수 없음).");
    }
    const { liked, total, ratio } = feedbackStats(readSignals());
    console.info(`[MoodTune] 만족도 ${liked}/${total} (${Math.round(ratio * 100)}%)`);
    setAnswered(true);
    // 누른 버튼이 사라지므로 포커스를 감사 문구로 옮긴다.
    requestAnimationFrame(() => thanksRef.current?.focus());
  }

  return (
    <section
      aria-label="추천 만족도"
      className={`${pixelFont.className} flex w-[354px] flex-col items-center justify-center gap-[16px] border border-solid border-[#8d29f2] bg-white p-[24px] leading-[normal]`}
    >
      <p className="whitespace-nowrap text-[22px] text-[#8d29f2]">
        <span aria-hidden="true">( ᵕ·̮ᵕ )♩ </span>Did You Enjoy?
      </p>
      <div aria-live="polite">
        {phase === "done" ? (
          <p ref={thanksRef} tabIndex={-1} className="whitespace-nowrap text-[16px] text-[#8793a0] outline-none">
            Thank you for feedback<span aria-hidden="true"> ヾ(◕ˇｏˇ◕)`*:;,｡･</span>
          </p>
        ) : (
          // loading 동안에는 같은 크기로 자리만 잡아 두고(invisible → 스크린리더에도 숨김), 버튼이 깜빡이지 않게 한다.
          <div className={`flex items-center gap-[16px] ${phase === "loading" ? "invisible" : ""}`}>
            <button
              type="button"
              aria-label="예, 추천이 마음에 들었어요 (Well-Tuned!)"
              onClick={() => respond("liked")}
              className="flex w-[144px] items-center justify-center border border-solid border-[#e43c98] bg-[#f91e96] px-[16px] py-[8px] text-[16px] whitespace-nowrap text-white"
            >
              Well-Tuned!
            </button>
            <button
              type="button"
              aria-label="아니오, 추천이 아쉬웠어요 (Not Enough)"
              onClick={() => respond("disliked")}
              className="flex w-[144px] items-center justify-center border border-solid border-[#0a46c7] bg-white px-[16px] py-[8px] text-[16px] whitespace-nowrap text-[#315ebf]"
            >
              Not Enough
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
