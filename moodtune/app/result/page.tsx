import { redirect } from "next/navigation";
import { Pixelify_Sans } from "next/font/google";
import IpodPlayer from "@/components/IpodPlayer";
import LiveClock from "@/components/LiveClock";
import { weatherEmoji } from "@/lib/weatherEmoji";
import { MOOD_OPTIONS, SITUATION_OPTIONS } from "@/lib/chipColors";

// 로딩 팝업(LoadingPopup)과 동일한 픽셀 폰트.
const pixelFont = Pixelify_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

// Next.js 15+(본 프로젝트는 16)부터 `searchParams`는 Promise로 전달된다.
// (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md 확인)
type ResultSearchParams = {
  uri?: string;
  name?: string;
  artist?: string;
  art?: string;
  reason?: string;
  type?: string;
  creator?: string;
  mood?: string;
  situation?: string;
  weatherCity?: string;
  weatherIcon?: string;
  weatherTempC?: string;
};

type Badge = { label: string; border: string; text: string };

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

  const { uri, name, artist = "", art, creator } = params;
  const isPlaylist = params.type === "playlist";
  const byline = isPlaylist ? (creator ?? artist) : artist;

  // 날씨 → 기분 → 상황 순서. 선택되지 않은 항목은 배열에 아예 안 넣어서, 몇 개가 남든
  // 첫 배지는 항상 같은 y좌표(top-[779px])에서 시작한다.
  const badges: Badge[] = [];
  if (params.weatherTempC) {
    const label = `${params.weatherCity ? `${params.weatherCity} ` : ""}${weatherEmoji(params.weatherIcon)} ${params.weatherTempC}°C`;
    badges.push({ label, border: "#f91e22", text: "#000000" });
  }
  if (params.mood) {
    const option = MOOD_OPTIONS.find((o) => o.label === params.mood);
    if (option) badges.push({ label: option.label, border: option.border, text: option.text });
  }
  if (params.situation) {
    const option = SITUATION_OPTIONS.find((o) => o.label === params.situation);
    if (option) badges.push({ label: option.label, border: option.border, text: option.text });
  }

  return (
    <main className="relative min-h-dvh w-full overflow-x-hidden bg-[#ea7eb9]">
      <div className="relative mx-auto min-h-[1330px] w-full max-w-[393px] overflow-x-hidden">
        {/* 순수 장식용 배경 이미지 — Input 화면과 동일한 에셋을 그대로 재사용 (클릭/기능 없음) */}
        {/* eslint-disable-next-line @next/next/no-img-element -- 장식용 배경 SVG */}
        <img
          src="/input/stars.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-[22px] top-[70px] h-[1201.337px] w-[350.337px]"
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- 장식용 스티커 */}
        <img
          src="/input/disc.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-[289px] top-[448px] size-[98px] object-cover"
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- 장식용 스티커 */}
        <img
          src="/input/cassette-tapes.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-[-10px] top-[58px] size-[117px] object-cover"
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- 장식용 스티커 */}
        <img
          src="/input/sourced-from-tumblr.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-[28px] top-[1090px] h-[157px] w-[135px] object-cover"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute flex h-[258.264px] w-[211.421px] items-center justify-center left-[-55px] top-[643px]"
        >
          <div className="flex-none rotate-[18.18deg]">
            {/* eslint-disable-next-line @next/next/no-img-element -- 장식용 스티커 */}
            <img src="/input/floppy-1.png" alt="" className="block h-[222.782px] w-[149.365px] object-cover" />
          </div>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute flex h-[259.268px] w-[238.565px] items-center justify-center left-[224px] top-[920px]"
        >
          <div className="flex-none rotate-[21.66deg]">
            {/* eslint-disable-next-line @next/next/no-img-element -- 장식용 스티커 */}
            <img src="/input/floppy-2.png" alt="" className="block h-[210.171px] w-[173.221px] object-cover" />
          </div>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute flex size-[369.929px] items-center justify-center left-[-125px] top-[236px]"
        >
          <div className="flex-none rotate-[31.36deg]">
            {/* eslint-disable-next-line @next/next/no-img-element -- 장식용 스티커 */}
            <img src="/input/phone-sticker.png" alt="" className="block size-[269.168px] object-cover" />
          </div>
        </div>

        {/* 헤더 — Input 화면과 동일한 로고/배지 재사용 */}
        {/* eslint-disable-next-line @next/next/no-img-element -- Figma 로고 에셋 재사용 */}
        <img
          src="/input/moodtune-logo.png"
          alt="MoodTune"
          className="absolute left-[23px] top-[61px] h-[38px] w-[129.59px]"
        />
        <div className="absolute left-[90px] top-[105px] inline-flex items-center justify-center border border-solid border-[#1ed760] bg-white px-[10px] py-[4px]">
          <p className="whitespace-nowrap font-['Helvetica'] text-[16px] text-black">
            with <span className="text-[#1ed760]">Spotify</span>
          </p>
        </div>

        {/* 시계·날짜 — Input 화면과 동일한 컴포넌트 재사용 */}
        <div className="absolute left-1/2 top-[168px] -translate-x-1/2">
          <LiveClock />
        </div>

        <div className="absolute left-1/2 top-[508px] w-[341px] -translate-x-1/2 border border-solid border-[#f91e96] bg-white px-[10px] py-[4px] text-center">
          <p className={`${pixelFont.className} whitespace-nowrap text-[22px] text-[#f91e96]`}>
            This is for You ♬*•*¨*•.¸¸♬
          </p>
        </div>

        <div className="absolute left-[57px] top-[569px]">
          <IpodPlayer title={name} byline={byline} albumArtUrl={art || undefined} />
        </div>

        {badges.map((badge, index) => (
          <div
            key={badge.label}
            className="absolute left-[32px] inline-flex items-center justify-center whitespace-nowrap border border-solid bg-white px-[10px] py-[4px] font-['Helvetica'] text-[12px]"
            style={{ top: 779 + index * 34, borderColor: badge.border, color: badge.text }}
          >
            {badge.label}
          </div>
        ))}

        <a
          href={uri}
          className="absolute left-1/2 top-[1066px] -translate-x-1/2 whitespace-nowrap border border-solid border-black bg-[#1ed760] px-[24px] py-[12px] font-['Helvetica'] text-[20px] font-bold text-black"
        >
          Listen in Spotify!
        </a>
      </div>
    </main>
  );
}
