"use client";

import { useEffect, useState } from "react";
import { Jockey_One } from "next/font/google";

const jockeyOne = Jockey_One({ subsets: ["latin"], weight: "400" });

function formatTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    weekday: "short",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("month")} ${get("day")}, ${get("year")} (${get("weekday")})`;
}

export default function LiveClock() {
  // 서버 렌더링 시각과 클라이언트 시각이 어긋나 하이드레이션 경고가 나지 않도록,
  // 마운트 전에는 아무것도 그리지 않고 클라이언트에서만 채운다.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // 서버/클라이언트 시각 차이로 인한 하이드레이션 불일치를 피하려고 마운트 시 한 번만 동기화한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const msToNextMinute = 60_000 - (Date.now() % 60_000);
    const timeoutId = setTimeout(() => {
      setNow(new Date());
      intervalId = setInterval(() => setNow(new Date()), 60_000);
    }, msToNextMinute);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  if (!now) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none flex flex-col items-center">
      <p
        className={`${jockeyOne.className} mb-[112px] origin-top scale-y-[1.8] whitespace-nowrap text-[150px] leading-[0.85] text-transparent`}
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 45%, rgba(255,255,255,0.45) 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextStroke: "1px rgba(255,255,255,0.45)",
          filter: "drop-shadow(0 8px 14px rgba(31,38,135,0.25))",
        }}
      >
        {formatTime(now)}
      </p>
      <p className={`${jockeyOne.className} text-[24px] text-[#f5f5f5]`}>{formatDate(now)}</p>
    </div>
  );
}
