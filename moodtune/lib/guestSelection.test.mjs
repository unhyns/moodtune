// guestSelection.ts 검증. 실행: node --test lib/guestSelection.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { isGuestSelection, readGuestSelection } from "./guestSelection.ts";

test("국가 1개와 장르 1~3개만 유효하다", () => {
  assert.equal(isGuestSelection({ country: "Korea", genres: ["Pop"] }), true);
  assert.equal(isGuestSelection({ country: "RoW", genres: ["Pop", "Rock", "K-POP"] }), true);
  for (const bad of [null, {}, { country: "Korea", genres: [] }, { country: "kr", genres: ["Pop"] }, { country: "Korea", genres: ["Trot"] }, { country: "Korea", genres: ["Pop", "Rock", "Jazz", "EDM"] }, { country: "Korea", genres: ["Pop", "Pop"] }, { country: "Korea", genres: "Pop" }]) {
    assert.equal(isGuestSelection(bad), false, JSON.stringify(bad));
  }
});

test("저장소가 없으면 선택 없음으로 본다", () => {
  assert.equal(readGuestSelection(), null);
});
