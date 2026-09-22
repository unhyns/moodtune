"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import WeatherBadge from "@/components/WeatherBadge";
import type { LibraryResponse } from "@/types";

// Goal 1 확인용 페이지: 인증 상태, 실제 라이브러리, 실제 날씨를 한 화면에서 보여준다.
export default function VerifyPage() {
  const router = useRouter();
  const [state, setState] = useState<
    { status: "loading" } | { status: "ready"; data: LibraryResponse } | { status: "error" }
  >({ status: "loading" });

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
        <WeatherBadge />
      </section>
    </main>
  );
}
