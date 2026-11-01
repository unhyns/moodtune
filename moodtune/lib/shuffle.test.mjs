// shuffle.ts 검증. 실행: node --test lib/shuffle.test.mjs (Node가 .ts를 직접 읽는다)
import { test } from "node:test";
import assert from "node:assert/strict";
import { shuffled } from "./shuffle.ts";

const items = Array.from({ length: 50 }, (_, i) => `t${i}`);
// 고정 시드 난수 (선형 합동법)
const seeded = (seed) => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
};

test("원소 집합과 개수가 입력과 같다 (중복·누락 없음)", () => {
  const out = shuffled(items, seeded(1));
  assert.equal(out.length, items.length);
  assert.deepEqual([...out].sort(), [...items].sort());
});

test("입력 배열을 바꾸지 않는다", () => {
  const input = [...items];
  shuffled(input, seeded(1));
  assert.deepEqual(input, items);
});

test("같은 고정 난수는 같은 결과를 낸다", () => {
  assert.deepEqual(shuffled(items, seeded(7)), shuffled(items, seeded(7)));
});

test("다른 고정 난수는 순서가 달라진다", () => {
  assert.notDeepEqual(shuffled(items, seeded(1)), shuffled(items, seeded(2)));
  assert.notDeepEqual(shuffled(items, seeded(1)), items);
});

test("1에 가까운 난수는 원래 순서를 유지한다", () => {
  assert.deepEqual(shuffled(items, () => 0.9999999), items);
});

test("빈 배열과 1개 배열", () => {
  assert.deepEqual(shuffled([], Math.random), []);
  assert.deepEqual(shuffled(["a"], Math.random), ["a"]);
});
