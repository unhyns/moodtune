const ERROR_MESSAGES: Record<string, string> = {
  denied: "Spotify 연동이 취소되었어요. 다시 시도해 주세요.",
  failed: "Spotify 로그인에 실패했어요. 다시 시도해 주세요.",
  config: "서버 설정에 문제가 있어요. 잠시 후 다시 시도해 주세요.",
};

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.failed) : null;

  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div>
        <h1 className="text-3xl font-bold">MoodTune</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          내 손 안의 DJ, 무드튠
        </p>
      </div>
      <p className="max-w-xs text-sm text-zinc-600 dark:text-zinc-300">
        기분·날씨·상황에 맞춰 내 라이브러리 안에서 지금 들을 곡을 추천해드려요.
      </p>
      {errorMessage && (
        <p role="alert" className="max-w-xs text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      )}
      {/* 인증은 서버 리다이렉트이므로 링크로 이동한다. */}
      <a
        href="/api/auth/spotify/login"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white dark:bg-white dark:text-black"
      >
        {errorMessage ? "다시 시도" : "Spotify로 시작하기"}
      </a>
    </main>
  );
}
