import VinylRecord from "@/components/VinylRecord";

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
    <main className="flex min-h-dvh flex-1 justify-center bg-[#fafafa]">
      <div className="relative flex w-full max-w-[393px] flex-col items-start gap-[10px]">
        <header className="flex w-full flex-col items-center border-b-[2px] border-[rgba(228,60,152,0.2)] bg-[#fafafa] py-[10px]">
          <div className="flex items-start gap-[2px]">
            <p className="whitespace-nowrap font-['Helvetica'] text-[20px] font-bold text-black">
              MoodTune
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element -- tiny decorative Figma asset, no benefit from next/image */}
            <img src="/landing/logo-dot.svg" alt="" className="mt-0.5 size-[10px]" />
          </div>
        </header>

        <div className="relative flex w-full flex-col items-start justify-center gap-[10px] px-[16px] py-[12px]">
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative background asset */}
          <img
            src="/landing/stars.svg"
            alt=""
            aria-hidden="true"
            className="absolute left-[16px] top-[17px] h-[666px] w-[349px]"
          />

          <h1 className="relative whitespace-nowrap font-['Helvetica'] text-[64px] font-bold leading-normal text-black">
            <span className="block">Music</span>
            <span className="block">Does</span>
            <span className="block">Matter.</span>
          </h1>

          <p className="relative whitespace-nowrap font-['Helvetica'] text-[20px] font-normal leading-normal text-black">
            <span className="block">How’s going?</span>
            <span className="block">Tune Now.</span>
          </p>

          <VinylRecord className="left-[166px] top-[198px]" />

          <div className="relative flex flex-col items-start gap-[10px] pt-[280px]">
            {errorMessage && (
              <p role="alert" className="max-w-[280px] text-sm text-red-600">
                {errorMessage}
              </p>
            )}
            <a
              href="/api/auth/spotify/login"
              className="inline-flex items-center justify-center rounded-[30px] bg-[#1ed760] px-[24px] py-[10px] font-['Helvetica'] text-[20px] font-bold text-black"
            >
              Start with Spotify
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
