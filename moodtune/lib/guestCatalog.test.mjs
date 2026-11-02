// guestCatalog.ts 검증. 실행: node --test lib/guestCatalog.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_CANDIDATES, pickGuestCandidates, toLibraryTrack } from "./guestCatalog.ts";
import { shuffled } from "./shuffle.ts";

const seeded = (seed) => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
};
const shuffleWith = (seed) => {
  const random = seeded(seed);
  return (items) => shuffled(items, random);
};
const songs = (prefix, n, genres, countries = ["Korea"]) =>
  Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i}`, name: `${prefix}${i}`, artist: "A", genres, countries }));
const ids = (r) => r.candidates.map((t) => t.id);

test("맞는 곡이 많으면 최대 50곡, 다른 장르·국가는 없다", () => {
  const catalog = [...songs("p", 120, ["Pop"]), ...songs("r", 30, ["Rock"]), ...songs("j", 30, ["Pop"], ["Japan"])];
  const r = pickGuestCandidates(catalog, { country: "Korea", genres: ["Pop"] }, shuffleWith(1));
  assert.equal(r.candidates.length, MAX_CANDIDATES);
  assert.equal(r.widened, false);
  assert.ok(ids(r).every((id) => id.startsWith("p")));
  assert.equal(new Set(ids(r)).size, MAX_CANDIDATES);
});

test("15곡은 넓히지 않고, 14곡은 넓힌다", () => {
  const rest = songs("r", 100, ["Rock"]);
  const at15 = pickGuestCandidates([...songs("p", 15, ["Pop"]), ...rest], { country: "Korea", genres: ["Pop"] }, shuffleWith(1));
  assert.deepEqual([at15.candidates.length, at15.widened], [15, false]);
  const at14 = pickGuestCandidates([...songs("p", 14, ["Pop"]), ...rest], { country: "Korea", genres: ["Pop"] }, shuffleWith(1));
  assert.deepEqual([at14.candidates.length, at14.widened], [40, true]);
  assert.equal(ids(at14).filter((id) => id.startsWith("p")).length, 14);
});

test("15~39곡은 채우지 않고 그대로 쓴다", () => {
  const r = pickGuestCandidates([...songs("p", 20, ["Pop"]), ...songs("r", 100, ["Rock"])], { country: "Korea", genres: ["Pop"] }, shuffleWith(1));
  assert.deepEqual([r.candidates.length, r.widened], [20, false]);
});

test("넓혀도 다른 국가 곡은 넣지 않고, 맞는 곡은 모두 포함한다", () => {
  const catalog = [...songs("p", 8, ["Pop"]), ...songs("r", 10, ["Rock"]), ...songs("j", 50, ["Rock"], ["Japan"])];
  const r = pickGuestCandidates(catalog, { country: "Korea", genres: ["Pop"] }, shuffleWith(2));
  assert.equal(r.candidates.length, 18);
  assert.equal(ids(r).filter((id) => id.startsWith("p")).length, 8);
  assert.ok(!ids(r).some((id) => id.startsWith("j")));
  assert.equal(r.widened, true);
});

test("채울 곡이 없으면 widened는 false다", () => {
  const r = pickGuestCandidates(songs("p", 5, ["Pop"]), { country: "Korea", genres: ["Pop"] }, shuffleWith(1));
  assert.deepEqual([r.candidates.length, r.widened], [5, false]);
});

test("복수 장르는 하나만 맞아도 포함하고 중복이 없다", () => {
  const catalog = [...songs("b", 10, ["Pop", "Rock"]), ...songs("p", 10, ["Pop"]), ...songs("x", 10, ["Jazz"])];
  const r = pickGuestCandidates(catalog, { country: "Korea", genres: ["Pop", "Rock"] }, shuffleWith(3));
  assert.equal(r.candidates.length, 20);
  assert.equal(new Set(ids(r)).size, 20);
});

test("입력을 바꾸지 않고, 같은 난수는 같은 결과, 다른 난수는 다른 순서", () => {
  const catalog = songs("p", 60, ["Pop"]);
  const copy = JSON.stringify(catalog);
  const a = pickGuestCandidates(catalog, { country: "Korea", genres: ["Pop"] }, shuffleWith(7));
  const b = pickGuestCandidates(catalog, { country: "Korea", genres: ["Pop"] }, shuffleWith(7));
  const c = pickGuestCandidates(catalog, { country: "Korea", genres: ["Pop"] }, shuffleWith(8));
  assert.deepEqual(ids(a), ids(b));
  assert.notDeepEqual(ids(a), ids(c));
  assert.equal(JSON.stringify(catalog), copy);
});

test("라벨 없는 곡은 어떤 국가에도 들어가지 않는다", () => {
  const r = pickGuestCandidates(songs("n", 30, ["Pop"], []), { country: "Korea", genres: ["Pop"] }, shuffleWith(1));
  assert.equal(r.candidates.length, 0);
});

test("LibraryTrack으로 바꿀 때 uri를 만들고 아트는 비운다", () => {
  assert.deepEqual(toLibraryTrack({ id: "abc", name: "N", artist: "A", genres: ["Pop"], countries: ["Korea"] }), { id: "abc", name: "N", artist: "A", album: "", albumArtUrl: "", uri: "spotify:track:abc" });
});
