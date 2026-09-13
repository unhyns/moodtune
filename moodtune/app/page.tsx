import PrimaryButton from "@/components/PrimaryButton";

export default function LandingPage() {
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
      <PrimaryButton>Spotify로 시작하기</PrimaryButton>
    </main>
  );
}
