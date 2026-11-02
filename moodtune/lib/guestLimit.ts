// 게스트 호출 제한 판정 (add-guest-mode design.md Decision 7). 순수 함수이고 시각을 주입한다.
// 공유 저장소가 없어 주소·전체 한도는 인스턴스 메모리 기준이다. 엄밀한 전역 보장이 아니다.
// 검증: guestLimit.test.mjs (`node --test lib/guestLimit.test.mjs`).
export const BROWSER_DAILY_LIMIT = 5;
export const ADDRESS_PER_MINUTE_LIMIT = 3;
export const GLOBAL_DAILY_LIMIT = 20;
const MINUTE_MS = 60_000;

export type BrowserUsage = { date: string; count: number };
export type InstanceUsage = { date: string; count: number; hitsByAddress: Map<string, number[]> };

export function kstDate(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(now);
}

export function createInstanceUsage(): InstanceUsage {
  return { date: "", count: 0, hitsByAddress: new Map() };
}

// 쿠키 값은 복호화에 실패하면 null로 온다. 날짜가 지났거나 형식이 틀리면 0회로 본다.
export function browserCount(usage: BrowserUsage | null, now: Date): number {
  return usage && usage.date === kstDate(now) && Number.isInteger(usage.count) && usage.count >= 0 ? usage.count : 0;
}

// 통과하면 인스턴스 사용량을 올리고 쿠키에 쓸 값을 돌려준다. 막히면 아무것도 세지 않는다.
export function checkGuestLimit(
  browser: BrowserUsage | null,
  address: string,
  instance: InstanceUsage,
  now: Date,
): { ok: true; browser: BrowserUsage } | { ok: false; reason: "browser" | "address" | "global" } {
  const date = kstDate(now);
  if (instance.date !== date) {
    instance.date = date;
    instance.count = 0;
    instance.hitsByAddress.clear();
  }
  const used = browserCount(browser, now);
  if (used >= BROWSER_DAILY_LIMIT) return { ok: false, reason: "browser" };
  const recent = (instance.hitsByAddress.get(address) ?? []).filter((t) => now.getTime() - t < MINUTE_MS);
  if (recent.length >= ADDRESS_PER_MINUTE_LIMIT) {
    instance.hitsByAddress.set(address, recent);
    return { ok: false, reason: "address" };
  }
  if (instance.count >= GLOBAL_DAILY_LIMIT) return { ok: false, reason: "global" };
  recent.push(now.getTime());
  instance.hitsByAddress.set(address, recent);
  instance.count += 1;
  return { ok: true, browser: { date, count: used + 1 } };
}
