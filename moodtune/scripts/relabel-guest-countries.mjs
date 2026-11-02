// 곡 목록의 국가 라벨을 아티스트 출신 국가(MusicBrainz의 country)로 다시 붙인다 (add-guest-mode design.md Decision 3).
// 실행: node scripts/relabel-guest-countries.mjs [--limit 10] [--dry-run]
// API 키가 필요 없고 Spotify를 호출하지 않는다. 앱 실행 중에는 쓰지 않는다.
// build-guest-catalog.mjs로 파일을 다시 만들면 이 스크립트도 다시 돌려야 한다.
import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { GENRES, normalize } from "./build-guest-catalog.mjs";

export const COUNTRY_LABELS = ["Korea", "Japan", "Western", "RoW"];
const USER_AGENT = "MoodTune/0.1 (https://github.com/unhyns/moodtune)";
const DELAY_MS = 1100;
const WESTERN = ["US", "GB", "CA"];
const RETRY_503_MS = 15_000;
const MAX_CONSECUTIVE_503 = 3;
const MAX_TOTAL_503 = 300;
// 이보다 낮은 점수의 결과에는 국가 라벨을 붙이지 않는다.
export const MIN_SCORE = 90;

export function labelFromCountry(code) {
  if (!code) return null;
  if (code === "KR") return "Korea";
  if (code === "JP") return "Japan";
  return WESTERN.includes(code) ? "Western" : "RoW";
}

// 이름이 정확히 같은(별칭 포함) 항목 중 점수가 가장 높은 쪽을 고른다. 점수가 낮으면 라벨을 붙이지 않는다.
// 최고 점수의 동명이인끼리 국가가 다르면 잘못 붙이지 않도록 모호함으로 처리한다.
export function pickArtist(artists, name) {
  if (!artists.length) return { status: "no_results", country: null, score: null };
  const want = normalize(name);
  const names = (a) => [a.name, a["sort-name"], ...(a.aliases ?? []).flatMap((x) => [x.name, x["sort-name"]])];
  const exact = artists.filter((a) => names(a).some((n) => n && normalize(n) === want));
  if (!exact.length) return { status: "not_found", country: null, score: null };
  const top = Math.max(...exact.map((a) => a.score ?? 0));
  if (top < MIN_SCORE) return { status: "low_score", country: null, score: top };
  const best = exact.filter((a) => (a.score ?? 0) === top);
  const countries = [...new Set(best.map((a) => a.country).filter(Boolean))];
  if (countries.length > 1) return { status: "ambiguous", country: null, score: top };
  if (!countries.length) return { status: "no_country", country: null, score: top };
  return { status: "ok", country: countries[0], score: top };
}

// Spotify 아티스트가 ", "로 합쳐져 있다. 이름에 쉼표가 든 경우(Tyler, The Creator)를 위해 전체 문자열을 먼저 찾고, 없으면 첫 아티스트를 찾는다.
export function lookupNames(artist) {
  const first = artist.split(", ")[0];
  return first === artist ? [artist] : [artist, first];
}

export function relabel(catalog, cache) {
  return catalog.map((t) => {
    const hit = lookupNames(t.artist).map((n) => cache[n]).find((r) => r?.status === "ok");
    const label = labelFromCountry(hit?.country);
    return { ...t, countries: label ? [label] : [] };
  });
}

// 같은 아티스트에서 3번 연속이거나 전체 누적이 10번을 넘으면 멈춘다.
export function shouldStopOn503(consecutive, total) {
  return consecutive >= MAX_CONSECUTIVE_503 || total > MAX_TOTAL_503;
}

export function assertRelabeled(catalog) {
  for (const t of catalog) {
    if (Object.keys(t).join() !== "id,name,artist,genres,countries") throw new Error(`unexpected keys: ${t.id}`);
    if (t.countries.length > 1 || !t.countries.every((c) => COUNTRY_LABELS.includes(c))) throw new Error(`bad countries: ${t.id}`);
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
class StopRun extends Error {}
class Busy503 extends Error {
  constructor(detail) {
    super("HTTP 503");
    this.detail = detail;
  }
}

async function search(name) {
  const term = name.replace(/["\\]/g, " ");
  const qs = new URLSearchParams({ query: `artist:"${term}" OR alias:"${term}"`, fmt: "json", limit: "10" });
  let res;
  try {
    res = await fetch(`https://musicbrainz.org/ws/2/artist?${qs}`, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" }, signal: AbortSignal.timeout(20_000) });
  } catch {
    throw new StopRun("네트워크 오류");
  }
  if (res.status === 429 || res.status === 503) {
    const headerNames = ["retry-after", "content-type", "server", "x-ratelimit-limit", "x-ratelimit-remaining", "x-ratelimit-reset"];
    const headers = Object.fromEntries(headerNames.map((h) => [h, res.headers.get(h)]).filter(([, v]) => v));
    const detail = JSON.stringify({ headers, body: (await res.text().catch(() => "")).slice(0, 300) });
    if (res.status === 503) throw new Busy503(detail);
    throw new StopRun(`HTTP 429 ${detail}`);
  }
  if (!res.ok) throw new StopRun(`HTTP ${res.status}`);
  return (await res.json()).artists ?? [];
}

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const limit = argv.includes("--limit") ? Number(argv[argv.indexOf("--limit") + 1]) : Infinity;
  const out = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "guest-catalog.json");
  const catalog = JSON.parse(readFileSync(out, "utf8"));
  // 조회 결과 캐시. 저장소 밖에 두고 국가 코드와 상태만 남긴다.
  const workDir = process.env.GUEST_BUILD_WORKDIR ?? join(tmpdir(), "moodtune-guest-build");
  mkdirSync(workDir, { recursive: true });
  const cachePath = join(workDir, "musicbrainz-v2.json");
  const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, "utf8")) : {};
  const save = () => writeFileSync(cachePath, JSON.stringify(cache));

  const artists = [...new Set(catalog.map((t) => t.artist))].sort();
  let calls = 0;
  let checked = 0;
  let total503 = 0;
  for (const artist of artists) {
    if (checked++ >= limit) break;
    for (const name of lookupNames(artist)) {
      if (cache[name]?.status === "ok") break;
      if (name in cache) continue;
      let consecutive503 = 0;
      for (;;) {
        calls++;
        try {
          cache[name] = pickArtist(await search(name), name);
          break;
        } catch (e) {
          save();
          let stop = e;
          if (e instanceof Busy503) {
            total503++;
            consecutive503++;
            console.log(`503: 연속 ${consecutive503}회, 누적 ${total503}회 ${e.detail}`);
            if (!shouldStopOn503(consecutive503, total503)) {
              await sleep(RETRY_503_MS);
              continue;
            }
            stop = new StopRun(`HTTP 503 연속 ${consecutive503}회, 누적 ${total503}회`);
          }
          if (!(stop instanceof StopRun)) throw stop;
          console.error(`중단: ${stop.message}. 호출 ${calls}회, 캐시 저장됨. 파일은 바꾸지 않았습니다. 다시 실행하면 이어서 합니다.`);
          process.exitCode = 3;
          return;
        }
      }
      save();
      await sleep(DELAY_MS);
      if (cache[name].status === "ok") break;
    }
    if (checked % 50 === 0) console.log(`아티스트 ${checked}/${artists.length}`);
  }
  console.log(`호출 ${calls}회, 503 ${total503}회`);
  if (limit !== Infinity) {
    console.log(JSON.stringify(artists.slice(0, limit).map((a) => [a, lookupNames(a).map((n) => cache[n]?.country ?? cache[n]?.status)])));
    return;
  }

  const next = relabel(catalog, cache);
  assertRelabeled(next);
  if (dryRun) return console.log("dry-run: 파일을 쓰지 않습니다");
  writeFileSync(`${out}.tmp`, JSON.stringify(next, null, 1) + "\n");
  renameSync(`${out}.tmp`, out);
  const rows = {};
  for (const c of [...COUNTRY_LABELS, null]) {
    const r = next.filter((t) => (c ? t.countries[0] === c : !t.countries.length));
    rows[c ?? "none"] = { total: r.length, ...Object.fromEntries(GENRES.map((g) => [g, r.filter((t) => t.genres.includes(g)).length])) };
  }
  console.log("TABLE " + JSON.stringify(rows));
  // 라벨을 못 붙인 아티스트와 마지막 조회의 상태.
  const failed = artists.filter((a) => !lookupNames(a).some((n) => cache[n]?.status === "ok"));
  const labeled = artists.length - failed.length;
  const reasons = {};
  for (const a of failed) {
    const reason = cache[lookupNames(a).at(-1)]?.status ?? "unknown";
    reasons[reason] = (reasons[reason] ?? 0) + 1;
  }
  console.log("ARTISTS " + JSON.stringify({ total: artists.length, labeled, noLabel: failed.length, reasons }));
}

if (import.meta.main) await main();
