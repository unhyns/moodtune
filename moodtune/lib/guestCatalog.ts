import type { LibraryTrack } from "@/types";

// 게스트 후보 선택 (add-guest-mode design.md Decision 4). 곡 목록 파일을 직접 읽지 않는 순수 함수다.
// 검증: guestCatalog.test.mjs (`node --test lib/guestCatalog.test.mjs`).
export type GuestCatalogEntry = { id: string; name: string; artist: string; genres: string[]; countries: string[] };

export const MIN_MATCHES = 15;
export const WIDEN_TO = 40;
export const MAX_CANDIDATES = 50;

// 맞는 곡이 15곡 이상이면 그 곡만 쓴다. 적으면 맞는 곡을 모두 넣고 같은 국가의 다른 곡으로 40곡까지 채운다.
// 섞기 함수는 호출하는 쪽에서 난수와 함께 넘긴다. 실제로 채운 곡이 있을 때만 widened가 true다.
export function pickGuestCandidates(
  catalog: readonly GuestCatalogEntry[],
  selection: { country: string; genres: readonly string[] },
  shuffle: <T>(items: readonly T[]) => T[],
): { candidates: GuestCatalogEntry[]; widened: boolean } {
  const inCountry = catalog.filter((t) => t.countries.includes(selection.country));
  const matches = (t: GuestCatalogEntry) => t.genres.some((g) => selection.genres.includes(g));
  const matched = inCountry.filter(matches);
  if (matched.length >= MIN_MATCHES) {
    return { candidates: shuffle(matched).slice(0, MAX_CANDIDATES), widened: false };
  }
  const others = shuffle(inCountry.filter((t) => !matches(t))).slice(0, Math.max(0, WIDEN_TO - matched.length));
  return { candidates: shuffle([...matched, ...others]), widened: others.length > 0 };
}

export function toLibraryTrack(entry: GuestCatalogEntry): LibraryTrack {
  return { id: entry.id, name: entry.name, artist: entry.artist, album: "", albumArtUrl: "", uri: `spotify:track:${entry.id}` };
}
