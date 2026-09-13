import { redirect } from "next/navigation";
import TrackCard from "@/components/TrackCard";

// Next.js 15+(본 프로젝트는 16)부터 `searchParams`는 Promise로 전달된다.
// (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md 확인)
type ResultSearchParams = {
  uri?: string;
  name?: string;
  artist?: string;
  art?: string;
  reason?: string;
};

export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<ResultSearchParams>;
}) {
  const params = await searchParams;

  // 필수 파라미터(uri, name) 없이 진입 시 /input으로 리다이렉트 (04_TECHNICAL_DESIGN.md §5)
  if (!params.uri || !params.name) {
    redirect("/input");
  }

  const { uri, name, artist = "", art, reason = "" } = params;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 px-6 py-10">
      <TrackCard name={name} artist={artist} albumArtUrl={art} reason={reason} />
      <a
        href={uri}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white dark:bg-white dark:text-black"
      >
        Spotify에서 재생하기
      </a>
    </main>
  );
}
