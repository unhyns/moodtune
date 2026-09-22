"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QuickReplyChip from "@/components/QuickReplyChip";
import PrimaryButton from "@/components/PrimaryButton";
import WeatherBadge from "@/components/WeatherBadge";
import type { LibraryResponse } from "@/types";

// 02_REQUIREMENTS_SPEC.md Decisions Log에서 확정된 값.
const MOOD_OPTIONS = ["신남", "차분함", "우울함", "집중", "설렘"];
const SITUATION_OPTIONS = ["출근길", "산책", "카페", "운동", "드라이브"];

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
  const canSubmit = mood !== null && situation !== null && !libraryEmpty;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const params = new URLSearchParams({
      uri: MOCK_RESULT.uri,
      name: MOCK_RESULT.name,
      artist: MOCK_RESULT.artist,
      art: MOCK_RESULT.art,
      reason: MOCK_RESULT.reason,
    });
    router.push(`/result?${params.toString()}`);
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-6 py-10">
      <h1 className="text-xl font-semibold">지금 기분과 상황을 알려주세요</h1>

      <section aria-label="날씨">
        <h2 className="mb-3 text-sm font-medium text-zinc-500">날씨</h2>
        <WeatherBadge />
      </section>

      <section aria-label="기분">
        <h2 className="mb-3 text-sm font-medium text-zinc-500">기분</h2>
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((option) => (
            <QuickReplyChip
              key={option}
              label={option}
              selected={mood === option}
              onClick={() => setMood(mood === option ? null : option)}
            />
          ))}
        </div>
      </section>

      <section aria-label="상황">
        <h2 className="mb-3 text-sm font-medium text-zinc-500">상황</h2>
        <div className="flex flex-wrap gap-2">
          {SITUATION_OPTIONS.map((option) => (
            <QuickReplyChip
              key={option}
              label={option}
              selected={situation === option}
              onClick={() =>
                setSituation(situation === option ? null : option)
              }
            />
          ))}
        </div>
      </section>

      {libraryEmpty && (
        <p role="alert" className="text-sm text-zinc-500">
          Spotify 라이브러리가 비어 있어요. 좋아요한 곡을 추가하거나 플레이리스트를 만든 뒤 다시 와주세요.
        </p>
      )}

      <PrimaryButton disabled={!canSubmit} onClick={handleSubmit}>
        추천받기
      </PrimaryButton>
    </main>
  );
}
