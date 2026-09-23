"use client";

import { useRef, useState } from "react";

type Props = {
  title: string;
  byline: string;
  albumArtUrl?: string;
};

const DEFAULT_BG = "#6d6d6d";
const DEFAULT_TEXT = "#ffffff";
const DEFAULT_BAR = "#d9d9d9";

// 단순 평균 밝기 기준 대비 판단 (WCAG 공식 대신 이 화면 용도에 맞는 가벼운 근사치).
function relativeLuminance(r: number, g: number, b: number) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function Triangle({ direction, color }: { direction: "left" | "right"; color: string }) {
  const border = direction === "left" ? "borderRight" : "borderLeft";
  return (
    <span
      style={{
        width: 0,
        height: 0,
        borderTop: "5px solid transparent",
        borderBottom: "5px solid transparent",
        [border]: `8px solid ${color}`,
      }}
    />
  );
}

export default function IpodPlayer({ title, byline, albumArtUrl }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [colors, setColors] = useState({ bg: DEFAULT_BG, text: DEFAULT_TEXT, bar: DEFAULT_BAR });

  // 앨범아트 평균 색을 뽑아 화면 배경으로 쓰고, 그 배경과 대비가 가장 잘 되는 텍스트(흑/백)·
  // 재생바(그레이스케일) 톤을 고른다. 캔버스 픽셀 추출이 막히면(CORS 등) 그냥 기본값을 유지한다.
  const handleAlbumArtLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 24;
      canvas.height = 24;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 24, 24);
      const { data } = ctx.getImageData(0, 0, 24, 24);
      let r = 0;
      let g = 0;
      let b = 0;
      const count = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      const luminance = relativeLuminance(r, g, b);
      setColors({
        bg: `rgb(${r}, ${g}, ${b})`,
        text: luminance > 128 ? "#000000" : "#ffffff",
        bar: luminance > 128 ? "#4d4d4d" : "#e5e5e5",
      });
    } catch {
      // 캔버스가 오염되면(getImageData 실패) Figma 기본값을 그대로 쓴다.
    }
  };

  return (
    <div className="relative h-[465px] w-[280px]">
      {/* eslint-disable-next-line @next/next/no-img-element -- 고정 비율 장식용 iPod 바디 이미지 */}
      <img src="/result/ipod.png" alt="" aria-hidden="true" className="absolute inset-0 size-full" />

      {/* iPod 이미지 기준 상대 위치(%)로 배치 — 이미지 크기가 바뀌어도 화면 영역과 어긋나지 않는다. */}
      <div
        className="absolute overflow-hidden rounded-[8px] border-[6px] border-solid border-[#2f2f2f]"
        style={{
          left: "7.857%",
          top: "3.871%",
          width: "84.643%",
          height: "38.710%",
          backgroundColor: colors.bg,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- 장식용 화면 유광 반사 */}
        <img
          src="/result/screen-light.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-[74.97px] top-0 h-[168px] w-[150.031px] opacity-40"
        />

        {albumArtUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- 캔버스로 픽셀을 읽어야 해서 next/image 대상이 아님
          <img
            ref={imgRef}
            src={albumArtUrl}
            alt=""
            crossOrigin="anonymous"
            onLoad={handleAlbumArtLoad}
            className="absolute left-[19px] top-[17px] size-[74px] object-cover"
          />
        ) : (
          <div className="absolute left-[19px] top-[17px] size-[74px] bg-[#d9d9d9]" />
        )}

        <p
          className="absolute left-[101px] top-[26.5px] max-w-[110px] -translate-y-1/2 truncate text-[16px] font-bold"
          style={{ color: colors.text }}
        >
          {title}
        </p>
        <p
          className="absolute left-[101px] top-[45.5px] max-w-[110px] -translate-y-1/2 truncate text-[14px] font-medium opacity-90"
          style={{ color: colors.text }}
        >
          {byline}
        </p>

        {/* 재생바 — 정적 장식(클릭 무동작), 색은 배경 대비로 계산한 그레이스케일 톤. 화면 가로축 중앙에 오도록
            래퍼 자체를 left-1/2 -translate-x-1/2로 중앙 정렬해, 화면 실제 콘텐츠 폭과 무관하게 항상 중앙에 온다. */}
        <div className="absolute left-1/2 top-[109px] w-[185.83px] -translate-x-1/2">
          <div
            aria-hidden="true"
            className="pointer-events-none h-[7px] w-full rounded-full"
            style={{ backgroundColor: colors.bar, opacity: 0.3 }}
          >
            <div className="h-full rounded-full" style={{ width: "24%", backgroundColor: colors.bar }} />
          </div>
          <p
            className="absolute left-0 top-[17px] text-[10px] font-medium"
            style={{ color: colors.bar }}
          >
            0:42
          </p>
          <p
            className="absolute right-0 top-[17px] text-[10px] font-medium"
            style={{ color: colors.bar }}
          >
            -2:42
          </p>
        </div>

        {/* 이전/재생/다음 — 전부 정적 장식(클릭 무동작) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[48px] top-[128px] flex size-[24px] items-center justify-center gap-[2px]"
        >
          <Triangle direction="left" color={colors.text} />
          <Triangle direction="left" color={colors.text} />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute left-[101px] top-[128px] size-[24px]">
          <div
            className="absolute inset-y-[12.5%] left-[16.67%] w-[16.67%] rounded-[2px]"
            style={{ backgroundColor: colors.text }}
          />
          <div
            className="absolute inset-y-[12.5%] left-[58.33%] w-[16.67%] rounded-[2px]"
            style={{ backgroundColor: colors.text }}
          />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[154px] top-[128px] flex size-[24px] items-center justify-center gap-[2px]"
        >
          <Triangle direction="right" color={colors.text} />
          <Triangle direction="right" color={colors.text} />
        </div>
      </div>
    </div>
  );
}
