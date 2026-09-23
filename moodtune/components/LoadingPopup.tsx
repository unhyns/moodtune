"use client";

import { useEffect, useState } from "react";
import { Pixelify_Sans } from "next/font/google";

// DungGeunMo(둥근모)는 Google Fonts에 없는 한국 인디 폰트라 next/font/google로 바로 못 불러온다.
// Pixelify Sans는 같은 "둥근 픽셀" 계열이라 느낌이 비슷해 대체로 쓴다 (일부 특수 기호는 깨져도 무방).
const pixelFont = Pixelify_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// Figma input_loading(node 97:1236) 팝업 텍스트 시퀀스.
const DOT_STEPS = ["", " .", " . .", " . . ."];
const FACE_LINES = ["◖|•ᴗ•|◗♪", "◖| ˘ω˘ |◗♪♫", "◖| ˶˘꒳˘˶ |◗♪•*¨*•.¸¸♬︎"];

const STEP_MS = 600;
const HOLD_MS = 900;

type Props = {
  onComplete: () => void;
};

export default function LoadingPopup({ onComplete }: Props) {
  const [dotStep, setDotStep] = useState(0);
  const [faceCount, setFaceCount] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (let i = 1; i <= 3; i++) {
      timers.push(setTimeout(() => setDotStep(i), STEP_MS * i));
    }
    const dotsDoneAt = STEP_MS * 3;
    for (let i = 1; i <= 3; i++) {
      timers.push(setTimeout(() => setFaceCount(i), dotsDoneAt + STEP_MS * i));
    }
    const allDoneAt = dotsDoneAt + STEP_MS * 3 + HOLD_MS;
    timers.push(setTimeout(onComplete, allDoneAt));

    return () => {
      timers.forEach(clearTimeout);
    };
    // 마운트 시 한 번만 시퀀스를 예약한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div aria-hidden="true" className="absolute inset-0 bg-[#0c0c0c] opacity-45" />
      <div
        role="status"
        aria-live="polite"
        className={`${pixelFont.className} relative flex h-[200px] w-[340px] flex-col items-center justify-center gap-2 border border-solid border-[#ea7eb9] bg-white p-4 text-[16px] leading-tight`}
      >
        <p className="whitespace-nowrap text-[#f91e96]">Tuning Your Mood{DOT_STEPS[dotStep]}</p>
        {FACE_LINES.slice(0, faceCount).map((line) => (
          <p key={line} className="whitespace-nowrap text-[#e43c98]">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
