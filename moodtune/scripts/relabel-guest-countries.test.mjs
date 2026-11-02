// 국가 라벨 함수 검증. 실행: node --test scripts/relabel-guest-countries.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { assertRelabeled, labelFromCountry, lookupNames, overrideFor, pickArtist, relabel, shouldStopOn503 } from "./relabel-guest-countries.mjs";

test("국가 코드 매핑", () => {
  const cases = [["KR", "Korea"], ["JP", "Japan"], ["US", "Western"], ["GB", "Western"], ["CA", "Western"], ["AU", "RoW"], ["IE", "RoW"], ["NZ", "RoW"], ["FR", "RoW"], ["SE", "RoW"], [null, null], [undefined, null]];
  for (const [code, label] of cases) assert.equal(labelFromCountry(code), label);
});

test("이름이 정확히 같은 항목만 고른다", () => {
  assert.deepEqual(pickArtist([], "IU"), { status: "no_results", country: null, score: null });
  assert.deepEqual(pickArtist([{ name: "Other", score: 100, country: "US" }], "IU"), { status: "not_found", country: null, score: null });
  assert.deepEqual(pickArtist([{ name: "아이유", score: 90, country: "KR", aliases: [{ name: "IU" }] }], "IU"), { status: "ok", country: "KR", score: 90 });
  assert.deepEqual(pickArtist([{ name: "IU", score: 100 }], "IU"), { status: "no_country", country: null, score: 100 });
});

test("점수가 90 미만이면 국가가 있어도 라벨을 붙이지 않는다", () => {
  assert.deepEqual(pickArtist([{ name: "A", score: 89, country: "US" }], "A"), { status: "low_score", country: null, score: 89 });
  assert.equal(pickArtist([{ name: "A", score: 90, country: "US" }], "A").status, "ok");
});

test("최고 점수끼리 국가가 다르면 모호함, 점수 차이가 있으면 높은 쪽", () => {
  assert.equal(pickArtist([{ name: "A", score: 100, country: "US" }, { name: "A", score: 100, country: "FR" }], "A").status, "ambiguous");
  assert.equal(pickArtist([{ name: "A", score: 100, country: "US" }, { name: "A", score: 80, country: "FR" }], "A").country, "US");
  assert.equal(pickArtist([{ name: "A", score: 100, country: "US" }, { name: "A", score: 100, country: "US" }], "A").country, "US");
});

test("쉼표가 든 문자열은 전체 후 첫 아티스트", () => {
  assert.deepEqual(lookupNames("Lady Gaga, Bruno Mars"), ["Lady Gaga, Bruno Mars", "Lady Gaga"]);
  assert.deepEqual(lookupNames("IU"), ["IU"]);
});

test("라벨은 0개 또는 1개이고 조회 실패는 라벨이 없다", () => {
  const catalog = [{ id: "a", name: "x", artist: "Tyler, The Creator", genres: ["Pop"], countries: ["kr", "jp"] }, { id: "b", name: "y", artist: "Nobody", genres: ["Pop"], countries: ["kr"] }];
  const out = relabel(catalog, { "Tyler, The Creator": { status: "ok", country: "US" }, Nobody: { status: "not_found", country: null } });
  assert.deepEqual(out.map((t) => t.countries), [["Western"], []]);
  assertRelabeled(out);
  assert.throws(() => assertRelabeled([{ ...out[0], countries: ["kr"] }]));
});

test("503은 연속 3번 또는 누적 300번 초과에서 멈춘다", () => {
  assert.equal(shouldStopOn503(1, 1), false);
  assert.equal(shouldStopOn503(2, 300), false);
  assert.equal(shouldStopOn503(3, 3), true);
  assert.equal(shouldStopOn503(1, 301), true);
});

test("수동 보정은 MusicBrainz 결과보다 앞서고 첫 아티스트에도 적용된다", () => {
  const overrides = { "tuki.": "Japan", "Charli xcx": "Western" };
  const catalog = [
    { id: "a", name: "x", artist: "tuki.", genres: ["Pop"], countries: [] },
    { id: "b", name: "y", artist: "Charli xcx, Billie Eilish", genres: ["Pop"], countries: [] },
    { id: "c", name: "z", artist: "IU", genres: ["Pop"], countries: [] },
  ];
  const out = relabel(catalog, { "tuki.": { status: "ok", country: "SK" }, IU: { status: "ok", country: "KR" } }, overrides);
  assert.deepEqual(out.map((t) => t.countries), [["Japan"], ["Western"], ["Korea"]]);
  assert.equal(overrideFor("IU", overrides), null);
});
