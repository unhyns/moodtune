// contextHints.ts 경계값 검증. 실행: node --test lib/contextHints.test.mjs (Node가 .ts를 직접 읽는다)
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildContextHints } from "./contextHints.ts";

const kst = (s) => new Date(`${s}+09:00`);
const weather = (icon) => ({ condition: "x", temperatureC: 15, icon });
const hints = (o) => buildContextHints({ isFreeText: false, now: kst("2026-04-15T12:00:00"), ...o });

const SPRING = "가볍고 행복한 느낌";
const SUMMER = "빠르고 열정적인 느낌";
const AUTUMN_DAY = "가볍고 잔잔한 느낌";
const LYRICAL = "차분하고 서정적인 느낌";
const CHRISTMAS = "설레고 따뜻한 크리스마스 느낌";

test("날씨 icon 범주 → 날씨 힌트", () => {
  const cases = [
    ["01d", "밝고 경쾌한 느낌"],
    ["02n", "밝고 경쾌한 느낌"],
    ["03d", "차분한 느낌"],
    ["04d", "차분한 느낌"],
    ["50d", "차분한 느낌"],
    ["09d", "잔잔한 느낌"],
    ["10n", "잔잔한 느낌"],
    ["11d", "잔잔한 느낌"],
    ["13d", "따뜻하고 설레는 느낌"],
    ["99x", null],
    [undefined, null],
  ];
  for (const [icon, expected] of cases) assert.equal(hints({ weather: weather(icon) }).weatherHint, expected, String(icon));
});

test("날씨가 없으면 날씨 힌트는 null이고 계절 힌트는 있다", () => {
  const h = hints({ now: kst("2026-07-15T12:00:00") });
  assert.equal(h.weatherHint, null);
  assert.equal(h.seasonHint, SUMMER);
});

test("월 경계 (KST)", () => {
  const cases = [
    ["2026-02-28T12:00:00", LYRICAL],
    ["2026-03-01T00:00:00", SPRING],
    ["2026-05-31T23:59:00", SPRING],
    ["2026-06-01T00:00:00", SUMMER],
    ["2026-08-31T23:59:00", SUMMER],
    ["2026-09-01T12:00:00", AUTUMN_DAY],
    ["2026-11-30T12:00:00", AUTUMN_DAY],
    ["2026-12-01T00:00:00", LYRICAL],
  ];
  for (const [t, expected] of cases) assert.equal(hints({ now: kst(t) }).seasonHint, expected, t);
});

test("가을 낮·밤 경계", () => {
  const cases = [
    ["05:59", LYRICAL],
    ["06:00", AUTUMN_DAY],
    ["17:59", AUTUMN_DAY],
    ["18:00", LYRICAL],
    ["00:00", LYRICAL],
  ];
  for (const [t, expected] of cases) assert.equal(hints({ now: kst(`2026-10-15T${t}:00`) }).seasonHint, expected, t);
});

test("시간대 구분은 가을에만 적용한다", () => {
  for (const [day, expected] of [["2026-04-15", SPRING], ["2026-07-15", SUMMER], ["2026-01-15", LYRICAL]]) {
    assert.equal(hints({ now: kst(`${day}T03:00:00`) }).seasonHint, expected);
    assert.equal(hints({ now: kst(`${day}T14:00:00`) }).seasonHint, expected);
  }
});

test("계절은 Asia/Seoul 기준이다 (UTC 11/30 15:30 = KST 12/1 00:30)", () => {
  assert.equal(hints({ now: new Date("2026-11-30T15:30:00Z"), mood: "Excited" }).seasonHint, CHRISTMAS);
  assert.equal(hints({ now: new Date("2026-11-30T14:59:00Z"), mood: "Excited" }).seasonHint, LYRICAL); // KST 11/30 23:59 가을 밤
});

test("겨울 칩 경로: 눈 또는 Excited·Romantic이면 크리스마스", () => {
  const now = kst("2026-01-15T12:00:00");
  for (const [mood, icon, expected] of [
    ["Excited", "01d", CHRISTMAS],
    ["Romantic", "01d", CHRISTMAS],
    ["Calm", "01d", LYRICAL],
    ["Excited", "13d", CHRISTMAS],
    ["Romantic", "13d", CHRISTMAS],
    ["Calm", "13d", CHRISTMAS],
    [undefined, "04d", LYRICAL],
  ]) {
    assert.equal(hints({ now, mood, weather: weather(icon) }).seasonHint, expected, `${mood} ${icon}`);
  }
});

test("겨울 자유 텍스트: 눈일 때만 크리스마스 (칩 값이 와도 무시)", () => {
  const now = kst("2026-02-15T12:00:00");
  assert.equal(hints({ now, isFreeText: true, weather: weather("13d") }).seasonHint, CHRISTMAS);
  assert.equal(hints({ now, isFreeText: true, weather: weather("01d") }).seasonHint, LYRICAL);
  assert.equal(hints({ now, isFreeText: true, mood: "Excited", weather: weather("01d") }).seasonHint, LYRICAL);
  assert.equal(hints({ now, isFreeText: true }).seasonHint, LYRICAL);
});

test("경로별 우선순위 문장", () => {
  assert.equal(hints({}).priority, "mood/situation > weather > season");
  assert.equal(hints({ isFreeText: true }).priority, "note > weather > season");
});
