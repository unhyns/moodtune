// 빌드 스크립트의 외부 호출 없는 함수 검증. 실행: node --test scripts/build-guest-catalog.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { assertCatalogShape, countTable, findMatchingTrack, genresFromTags, normalize, toCatalog } from "./build-guest-catalog.mjs";

test("정규화는 대소문자·괄호·feat.·꼬리표·문장부호를 지운다", () => {
  assert.equal(normalize("Don't Stop Me Now - Remastered 2011"), "dontstopmenow");
  assert.equal(normalize("Song (feat. Someone) [Live]"), "song");
  assert.equal(normalize("Song feat. Someone"), "song");
  assert.equal(normalize("밤편지"), "밤편지");
  assert.equal(normalize("ＡＢＣ"), "abc");
});

test("태그는 표에 있고 점수가 충분할 때만 장르가 된다", () => {
  const tags = [{ name: "K-Pop", count: 100 }, { name: "seen live", count: 90 }, { name: "rap", count: 10 }, { name: "Indie Pop", count: 20 }];
  assert.deepEqual(genresFromTags(tags), ["Indie", "K-POP"]);
  assert.deepEqual(genresFromTags([]), []);
});

test("제목과 아티스트가 모두 맞아야 일치한다", () => {
  const items = [
    { id: "a", name: "Song", artists: [{ name: "Other" }] },
    { id: "b", name: "Song - Remastered", artists: [{ name: "X" }, { name: "Singer" }] },
  ];
  assert.equal(findMatchingTrack(items, "Song", "Singer").id, "b");
  assert.equal(findMatchingTrack(items, "Song", "Nobody"), null);
  assert.equal(findMatchingTrack(items, "Another", "Singer"), null);
  assert.equal(findMatchingTrack(items, "", ""), null);
});

test("파일 항목은 정해진 키만 갖고 ID 순으로 정렬된다", () => {
  const byId = new Map([
    ["b", { id: "b", name: "B", artist: "X", genres: ["Rock", "Pop"], countries: ["jp", "kr"], rank: 1, playcount: 9, tags: ["x"] }],
    ["a", { id: "a", name: "A", artist: "Y", genres: ["Jazz"], countries: ["world"] }],
  ]);
  const catalog = toCatalog(byId);
  assert.deepEqual(catalog.map((t) => t.id), ["a", "b"]);
  assert.deepEqual(Object.keys(catalog[1]), ["id", "name", "artist", "genres", "countries"]);
  assert.deepEqual(catalog[1].genres, ["Pop", "Rock"]);
  assert.deepEqual(catalog[1].countries, ["kr", "jp"]);
  assertCatalogShape(catalog);
});

test("다른 키나 잘못된 라벨은 실패한다", () => {
  const base = { id: "a", name: "A", artist: "Y", genres: ["Pop"], countries: ["kr"] };
  assert.throws(() => assertCatalogShape([{ ...base, playcount: 1 }]));
  assert.throws(() => assertCatalogShape([{ ...base, genres: ["Trot"] }]));
  assert.throws(() => assertCatalogShape([{ ...base, genres: [] }]));
  assert.throws(() => assertCatalogShape([{ ...base, countries: ["us"] }]));
});

test("표는 복수 라벨을 각 칸에 센다", () => {
  const table = countTable([{ id: "a", name: "A", artist: "Y", genres: ["Pop", "Rock"], countries: ["kr", "jp"] }]);
  assert.equal(table.kr.total, 1);
  assert.equal(table.kr.Pop, 1);
  assert.equal(table.jp.Rock, 1);
  assert.equal(table.world.total, 0);
});
