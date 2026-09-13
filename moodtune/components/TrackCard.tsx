type TrackCardProps = {
  name: string;
  artist: string;
  albumArtUrl?: string;
  reason: string;
};

export default function TrackCard({
  name,
  artist,
  albumArtUrl,
  reason,
}: TrackCardProps) {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-black">
      <div className="mx-auto mb-4 h-40 w-40 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
        {albumArtUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- 앨범아트는 외부 도메인 placeholder URL이라 next/image 설정은 다음 세션(실제 연동)에서 다룬다.
          <img
            src={albumArtUrl}
            alt={`${name} - ${artist}`}
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <h2 className="text-center text-lg font-semibold">{name}</h2>
      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        {artist}
      </p>
      <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-300">
        {reason}
      </p>
    </div>
  );
}
