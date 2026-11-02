"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearGuestSelection,
  GUEST_GENRES,
  MAX_GUEST_GENRES,
  readGuestSelection,
  writeGuestSelection,
  type GuestCountry,
  type GuestGenre,
} from "@/lib/guestSelection";

// 랜딩의 게스트 진입 버튼과 바텀시트 (Figma 170:703 비활성, 170:749 활성).
// 좌표는 393 폭 기준이고, Ballad·Jazz를 빼서 한 줄이 줄어 높이는 Figma 485에서 449로 줄였다.
const COUNTRY_CHIPS: { value: GuestCountry; label: string; left: number; top: number }[] = [
  { value: "Korea", label: "Korea", left: 28, top: 153 },
  { value: "Western", label: "Western", left: 109, top: 153 },
  { value: "Japan", label: "Japan", left: 207, top: 153 },
  { value: "RoW", label: "RoW: Rest of World", left: 28, top: 189 },
];

// 모양은 Figma대로 두고 누를 수 있는 영역만 ::before로 40px 이상 넓힌다.
const TOUCH_AREA =
  "before:absolute before:left-1/2 before:top-1/2 before:h-10 before:min-w-10 before:w-full before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']";

// 줄바꿈되는 칩이 선택될 때 옆 칩이 밀리지 않도록 굵은 글자 폭을 미리 잡아 둔다.
const BOLD_WIDTH = "after:block after:h-0 after:overflow-hidden after:font-bold after:content-[attr(data-label)]";

function Chip({
  label,
  position,
  selected,
  dimmed,
  onClick,
}: {
  label: string;
  // 국가 칩은 Figma 좌표에 두고, 장르 칩은 설정 목록에 따라 줄바꿈한다.
  position?: { left: number; top: number };
  selected: boolean;
  dimmed?: boolean;
  onClick: () => void;
}) {
  const look = selected
    ? "border border-solid border-[#e43c98] bg-[#e43c98] font-bold text-white"
    : dimmed
      ? "border border-solid border-[#b1b1b0] bg-white text-[#b1b1b0]"
      : "border border-solid border-[#6b6b73] bg-white text-[#6b6b73]";
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={dimmed}
      onClick={onClick}
      style={position}
      data-label={label}
      className={`${position ? "absolute" : "relative"} whitespace-nowrap px-[10px] py-[4px] font-['Helvetica'] text-[16px] leading-[18px] disabled:cursor-not-allowed ${position ? "" : BOLD_WIDTH} ${TOUCH_AREA} ${look}`}
    >
      {label}
    </button>
  );
}

export default function GuestModeSheet({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [country, setCountry] = useState<GuestCountry | null>(null);
  const [genres, setGenres] = useState<GuestGenre[]>([]);

  const canStart = country !== null && genres.length > 0;
  const genresFull = genres.length >= MAX_GUEST_GENRES;

  // /guest/input에서 선택을 바꾸러 돌아오면 저장된 선택을 보여 준다.
  const open = useCallback(() => {
    const saved = readGuestSelection();
    setCountry(saved?.country ?? null);
    setGenres(saved?.genres ?? []);
    dialogRef.current?.showModal();
    document.body.style.overflow = "hidden";
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- /?guest=1 진입 시 마운트 후 브라우저 저장소에서 복원하며 연다
    if (defaultOpen) open();
    return () => {
      document.body.style.overflow = "";
    };
  }, [defaultOpen, open]);

  // X와 Esc 모두 dialog의 close 이벤트로 온다.
  const handleClose = () => {
    document.body.style.overflow = "";
    clearGuestSelection();
    setCountry(null);
    setGenres([]);
  };

  const toggleGenre = (genre: GuestGenre) => {
    setGenres((current) => (current.includes(genre) ? current.filter((g) => g !== genre) : [...current, genre]));
  };

  const handleStart = () => {
    if (!canStart) return;
    writeGuestSelection({ country, genres });
    router.push("/guest/input");
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="inline-flex items-center justify-center rounded-[30px] border border-solid border-[#2f2f2f] px-[24px] py-[10px] font-['Helvetica'] text-[16px] font-normal leading-[normal] text-black"
      >
        Go to Guest mode
      </button>

      <dialog
        ref={dialogRef}
        onClose={handleClose}
        aria-labelledby="guest-sheet-title"
        className="mx-auto mb-0 mt-auto h-[449px] max-h-dvh w-full max-w-[393px] overflow-y-auto overflow-x-hidden rounded-t-[16px] bg-white p-0 text-black backdrop:bg-black/40"
      >
        <div className="relative h-[449px] w-full">
          <h2
            id="guest-sheet-title"
            className="absolute left-[16px] top-[28px] whitespace-nowrap font-['Helvetica'] text-[32px] font-bold leading-[37px]"
          >
            What’s for you?
          </h2>
          {/* eslint-disable-next-line @next/next/no-img-element -- 장식용 Figma 에셋 */}
          <img src="/landing/guest-star-filled.svg" alt="" aria-hidden="true" className="absolute left-[247px] top-[16px] size-[16px]" />
          {/* eslint-disable-next-line @next/next/no-img-element -- 장식용 Figma 에셋 */}
          <img src="/landing/guest-star-outline.svg" alt="" aria-hidden="true" className="absolute left-[263px] top-[24px] size-[16px]" />
          <p className="absolute left-[16px] top-[69px] whitespace-nowrap font-['Helvetica'] text-[12px] leading-[14px]">
            어떤 곡들 중에서 추천받을까요?
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element -- 장식용 Figma 에셋 */}
          <img src="/landing/guest-divider.svg" alt="" aria-hidden="true" className="absolute left-[16px] right-[16px] top-[98px] h-px w-[calc(100%-32px)]" />

          <button
            type="button"
            aria-label="닫기"
            onClick={() => dialogRef.current?.close()}
            className={`absolute right-[17px] top-[16px] w-[32px] border border-solid border-[#b1b1b0] bg-white py-[4px] text-center font-['Helvetica'] text-[16px] font-bold leading-[18px] text-[#b1b1b0] before:absolute before:left-1/2 before:top-1/2 before:size-10 before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']`}
          >
            X
          </button>

          <h3 className="absolute left-[28px] top-[115px] font-['Helvetica'] text-[24px] font-bold leading-[28px]">Country</h3>
          {/* Figma의 8px은 읽기 어려워 12px로 키웠다. */}
          <p className="absolute left-[125px] top-[125px] whitespace-nowrap font-['Helvetica'] text-[12px] leading-[14px] text-[#6b6b73]">
            아티스트 출신 국가 기준
          </p>
          {COUNTRY_CHIPS.map((chip) => (
            <Chip
              key={chip.value}
              label={chip.label}
              position={{ left: chip.left, top: chip.top }}
              selected={country === chip.value}
              onClick={() => setCountry(country === chip.value ? null : chip.value)}
            />
          ))}

          <h3 className="absolute left-[28px] top-[237px] font-['Helvetica'] text-[24px] font-bold leading-[28px]">Genre</h3>
          <p className="absolute left-[106px] top-[248px] font-['Helvetica'] text-[12px] leading-[14px]">
            {genres.length}/{MAX_GUEST_GENRES}
          </p>
          <div className="absolute left-[28px] right-[28px] top-[275px] flex flex-wrap gap-x-[14px] gap-y-[8px]">
            {GUEST_GENRES.map((genre) => {
              const selected = genres.includes(genre);
              return (
                <Chip
                  key={genre}
                  label={genre}
                  selected={selected}
                  dimmed={genresFull && !selected}
                  onClick={() => toggleGenre(genre)}
                />
              );
            })}
          </div>

          <button
            type="button"
            disabled={!canStart}
            onClick={handleStart}
            className="absolute left-1/2 top-[368px] -translate-x-1/2 whitespace-nowrap rounded-[30px] bg-[#e43c98] px-[24px] py-[10px] font-['Helvetica'] text-[20px] font-bold leading-[23px] text-white disabled:cursor-not-allowed disabled:bg-[#979797]"
          >
            Start Guest Mode
          </button>

          <a
            href="https://www.last.fm"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute left-1/2 top-[420px] -translate-x-1/2 whitespace-nowrap font-['Helvetica'] text-[12px] leading-[14px] text-[#6b6b73] underline"
          >
            곡 선정 참고: Last.fm
          </a>
        </div>
      </dialog>
    </>
  );
}
