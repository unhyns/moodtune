// weatherPhrase.ts 경계값 검증. 실행: node --test lib/weatherPhrase.test.mjs (Node가 .ts를 직접 읽는다)
import { test } from "node:test";
import assert from "node:assert/strict";
import { conditionPhrase, temperaturePhrase, weatherDayPhrase } from "./weatherPhrase.ts";

test("기온 5단계 경계값", () => {
  const cases = [
    [25, "더운"],
    [24.6, "더운"], // 반올림하면 25
    [24, "따뜻한"],
    [17, "따뜻한"],
    [16, "시원한"],
    [12, "시원한"],
    [11, "쌀쌀한"],
    [6, "쌀쌀한"],
    [5, "추운"],
    [0, "추운"],
    [-3, "추운"],
  ];
  for (const [t, expected] of cases) assert.equal(temperaturePhrase(t), expected, `${t}°C`);
});

test("icon 앞 두 자리 → 상태", () => {
  const cases = [
    ["01d", "맑고"],
    ["02n", "구름 끼고"],
    ["03d", "흐리고"],
    ["04n", "흐리고"],
    ["09d", "비 오고"],
    ["10n", "비 오고"],
    ["11d", "비 오고"],
    ["13d", "눈 오고"],
    ["50n", "안개 끼고"],
  ];
  for (const [icon, expected] of cases) assert.equal(conditionPhrase(icon), expected, icon);
});

test("매핑에 없거나 없는 icon은 상태 생략", () => {
  assert.equal(conditionPhrase("99d"), null);
  assert.equal(conditionPhrase(undefined), null);
  assert.equal(conditionPhrase(""), null);
  assert.equal(weatherDayPhrase({ condition: "x", temperatureC: 3, icon: "99d" }), "추운 날");
  assert.equal(weatherDayPhrase({ condition: "x", temperatureC: 3 }), "추운 날");
});

test("상태 + 기온표현 조합", () => {
  assert.equal(weatherDayPhrase({ condition: "맑음", temperatureC: 18, icon: "01d" }), "맑고 따뜻한 날");
  assert.equal(weatherDayPhrase({ condition: "실 비", temperatureC: 12.4, icon: "10d" }), "비 오고 시원한 날");
});
