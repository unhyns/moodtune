"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import WeatherBadge from "@/components/WeatherBadge";
import { MOOD_OPTIONS, SITUATION_OPTIONS } from "@/lib/chipColors";
import type { LibraryResponse, RecommendationResult, WeatherContext } from "@/types";

// Goal 1 확인용 페이지: 인증 상태, 실제 라이브러리, 실제 날씨를 한 화면에서 보여준다.
export default function VerifyPage() {
  const router = useRouter();
  const [state, setState] = useState<
    { status: "loading" } | { status: "ready"; data: LibraryResponse } | { status: "error" }
  >({ status: "loading" });
  const [weather, setWeather] = useState<WeatherContext | null>(null);
  const [mood, setMood] = useState("");
  const [situation, setSituation] = useState("");
  const [recommendState, setRecommendState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "ready"; data: RecommendationResult }
    | { status: "error"; message: string }
  >({ status: "idle" });

  const requestRecommendation = async () => {
    if (!mood && !situation) return;
    setRecommendState({ status: "loading" });
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: mood || undefined,
          situation: situation || undefined,
          weather: weather ?? undefined,
        }),
      });
      if (res.status === 401) return router.replace("/");
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setRecommendState({ status: "error", message: body.error ?? `HTTP ${res.status}` });
        return;
      }
      setRecommendState({ status: "ready", data: (await res.json()) as RecommendationResult });
    } catch {
      setRecommendState({ status: "error", message: "network error" });
    }
  };

  useEffect(() => {
    fetch("/api/spotify/library")
      .then(async (res) => {
        if (res.status === 401) return router.replace("/");
        if (!res.ok) return setState({ status: "error" });
        setState({ status: "ready", data: (await res.json()) as LibraryResponse });
      })
      .catch(() => setState({ status: "error" }));
  }, [router]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-6 py-10">
      <h1 className="text-xl font-semibold">연동 확인</h1>

      <section aria-label="Spotify 인증">
        <h2 className="mb-2 text-sm font-medium text-zinc-500">Spotify 인증</h2>
        {state.status === "loading" && <p className="text-sm text-zinc-400">확인 중…</p>}
        {state.status === "error" && (
          <p className="text-sm text-red-600">라이브러리를 불러오지 못했어요.</p>
        )}
        {state.status === "ready" && (
          <p data-testid="auth-status" className="text-sm">
            ✅ {state.data.user.displayName} 로 로그인됨
          </p>
        )}
      </section>

      <section aria-label="라이브러리">
        <h2 className="mb-2 text-sm font-medium text-zinc-500">라이브러리</h2>
        {state.status === "ready" && (
          <div className="flex flex-col gap-3 text-sm">
            <p data-testid="library-summary">
              Liked Songs {state.data.likedCount}곡 · 내 플레이리스트 {state.data.playlists.length}개 ·
              전체(중복 제외) {state.data.tracks.length}곡
            </p>
            {state.data.playlists.length > 0 && (
              <ul className="list-disc pl-5 text-zinc-600 dark:text-zinc-300">
                {state.data.playlists.map((p) => (
                  <li key={p.id}>
                    {p.name} ({p.trackCount}곡)
                  </li>
                ))}
              </ul>
            )}
            <ol className="flex flex-col gap-1 text-zinc-600 dark:text-zinc-300">
              {state.data.tracks.slice(0, 10).map((t) => (
                <li key={t.id}>
                  {t.name} — {t.artist}
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      <section aria-label="날씨">
        <h2 className="mb-2 text-sm font-medium text-zinc-500">날씨</h2>
        <WeatherBadge onChange={setWeather} />
      </section>

      <section aria-label="AI 추천 테스트">
        <h2 className="mb-2 text-sm font-medium text-zinc-500">AI 추천 (/api/recommend) 테스트</h2>
        <div className="flex flex-col gap-3 text-sm">
          <label className="flex flex-col gap-1">
            기분
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="min-h-11 rounded-md border border-zinc-300 bg-transparent px-2 dark:border-zinc-700"
            >
              <option value="">(선택 안 함)</option>
              {MOOD_OPTIONS.map((o) => (
                <option key={o.label} value={o.label}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            상황
            <select
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              className="min-h-11 rounded-md border border-zinc-300 bg-transparent px-2 dark:border-zinc-700"
            >
              <option value="">(선택 안 함)</option>
              {SITUATION_OPTIONS.map((o) => (
                <option key={o.label} value={o.label}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={requestRecommendation}
            disabled={(!mood && !situation) || recommendState.status === "loading"}
            className="min-h-11 rounded-full bg-black px-6 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-black"
          >
            추천 요청 보내기
          </button>

          {recommendState.status === "loading" && (
            <p className="text-zinc-400">추천 생성 중…</p>
          )}
          {recommendState.status === "error" && (
            <p className="text-red-600">실패: {recommendState.message}</p>
          )}
          {recommendState.status === "ready" && (
            <div data-testid="recommend-result" className="flex flex-col gap-1 rounded-md border border-zinc-300 p-3 dark:border-zinc-700">
              <p>
                <strong>{recommendState.data.track.name}</strong> — {recommendState.data.track.artist}
              </p>
              <p className="text-zinc-500">{recommendState.data.reason}</p>
              <p className="text-xs text-zinc-400">
                uri: {recommendState.data.track.uri} · isFallback: {String(recommendState.data.isFallback)}
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
