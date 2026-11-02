// guestLimit.ts 검증. 실행: node --test lib/guestLimit.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { ADDRESS_PER_MINUTE_LIMIT, BROWSER_DAILY_LIMIT, browserCount, checkGuestLimit, createInstanceUsage, GLOBAL_DAILY_LIMIT, kstDate } from "./guestLimit.ts";

const noon = new Date("2026-11-02T03:00:00Z"); // KST 11/2 12:00
const later = (ms) => new Date(noon.getTime() + ms);

test("브라우저는 하루 5회까지", () => {
  const inst = createInstanceUsage();
  let b = null;
  for (let i = 0; i < BROWSER_DAILY_LIMIT; i++) {
    const r = checkGuestLimit(b, `addr${i}`, inst, later(i * 1000));
    assert.equal(r.ok, true);
    b = r.browser;
  }
  assert.deepEqual(checkGuestLimit(b, "new", inst, later(9000)), { ok: false, reason: "browser" });
  assert.equal(inst.count, BROWSER_DAILY_LIMIT);
});

test("주소는 분당 3회, 1분이 지나면 다시 된다", () => {
  const inst = createInstanceUsage();
  for (let i = 0; i < ADDRESS_PER_MINUTE_LIMIT; i++) assert.equal(checkGuestLimit(null, "a", inst, later(i)).ok, true);
  assert.deepEqual(checkGuestLimit(null, "a", inst, later(10)), { ok: false, reason: "address" });
  assert.equal(checkGuestLimit(null, "b", inst, later(11)).ok, true);
  assert.equal(checkGuestLimit(null, "a", inst, later(60_001)).ok, true);
});

test("전체는 하루 20회", () => {
  const inst = createInstanceUsage();
  for (let i = 0; i < GLOBAL_DAILY_LIMIT; i++) assert.equal(checkGuestLimit(null, `a${i}`, inst, noon).ok, true);
  assert.deepEqual(checkGuestLimit(null, "z", inst, noon), { ok: false, reason: "global" });
});

test("막힌 요청은 세지 않는다", () => {
  const inst = createInstanceUsage();
  for (let i = 0; i < 3; i++) checkGuestLimit(null, "a", inst, noon);
  const before = inst.count;
  checkGuestLimit(null, "a", inst, noon);
  checkGuestLimit({ date: kstDate(noon), count: BROWSER_DAILY_LIMIT }, "b", inst, noon);
  assert.equal(inst.count, before);
  assert.equal(inst.hitsByAddress.get("a").length, 3);
});

test("날짜 경계는 Asia/Seoul 자정이다", () => {
  const before = new Date("2026-11-02T14:59:00Z");
  const after = new Date("2026-11-02T15:00:00Z");
  assert.equal(kstDate(before), "2026-11-02");
  assert.equal(kstDate(after), "2026-11-03");
  const inst = createInstanceUsage();
  for (let i = 0; i < GLOBAL_DAILY_LIMIT; i++) checkGuestLimit(null, `a${i}`, inst, before);
  assert.equal(checkGuestLimit(null, "z", inst, before).ok, false);
  const r = checkGuestLimit({ date: "2026-11-02", count: BROWSER_DAILY_LIMIT }, "z", inst, after);
  assert.equal(r.ok, true);
  assert.deepEqual(r.browser, { date: "2026-11-03", count: 1 });
  assert.equal(inst.count, 1);
});

test("위조·손상된 값은 0회로 본다", () => {
  assert.equal(browserCount(null, noon), 0);
  assert.equal(browserCount({ date: kstDate(noon), count: -3 }, noon), 0);
  assert.equal(browserCount({ date: kstDate(noon), count: "9" }, noon), 0);
  assert.equal(browserCount({ date: "2000-01-01", count: 9 }, noon), 0);
});
