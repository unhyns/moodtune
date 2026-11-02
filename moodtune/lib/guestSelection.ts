// 게스트 바텀시트의 선택 (add-guest-mode design.md Decision 1). 같은 탭의 sessionStorage로 /guest/input에 넘긴다.
export const GUEST_COUNTRIES = ["Korea", "Western", "Japan", "RoW"] as const;
export const GUEST_GENRES = ["Pop", "Hip-Hop", "R&B", "Rock", "Indie", "EDM", "Ballad", "Jazz", "K-POP"] as const;
export const MAX_GUEST_GENRES = 3;

export type GuestCountry = (typeof GUEST_COUNTRIES)[number];
export type GuestGenre = (typeof GUEST_GENRES)[number];
export type GuestSelection = { country: GuestCountry; genres: GuestGenre[] };

const KEY = "moodtune:guestSelection";

export function isGuestSelection(value: unknown): value is GuestSelection {
  const v = value as Partial<GuestSelection> | null;
  return (
    !!v &&
    GUEST_COUNTRIES.includes(v.country as GuestCountry) &&
    Array.isArray(v.genres) &&
    v.genres.length >= 1 &&
    v.genres.length <= MAX_GUEST_GENRES &&
    new Set(v.genres).size === v.genres.length &&
    v.genres.every((g) => GUEST_GENRES.includes(g))
  );
}

// 저장소가 막혀 있거나 값이 손상됐으면 선택 없음으로 본다.
export function readGuestSelection(): GuestSelection | null {
  try {
    const parsed: unknown = JSON.parse(window.sessionStorage.getItem(KEY) ?? "null");
    return isGuestSelection(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeGuestSelection(selection: GuestSelection): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(selection));
  } catch {
    // 저장소가 막혀 있으면 /guest/input이 랜딩으로 돌려보낸다.
  }
}

export function clearGuestSelection(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // 저장소가 막혀 있으면 지울 것도 없다.
  }
}
