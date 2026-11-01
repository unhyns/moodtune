// 게스트 곡 목록 빌드 (add-guest-mode design.md Decision 2·3). 사람이 직접 돌리고 배포 빌드에 묶지 않는다.
// 실행: node --env-file=.env.local scripts/build-guest-catalog.mjs [--country kr] [--limit 20] [--dry-run]
// 남은 검색 건너뛰기(네트워크·API 키 불필요): node scripts/build-guest-catalog.mjs --skip-remaining
// 옵션 없이 다시 실행하면 임시 파일에서 이어서 남은 곡만 검색하고 파일을 교체한다.
// Last.fm은 후보와 장르 판단에만 쓰고, 파일의 제목·아티스트는 Spotify 응답 값을 저장한다.
// API 키가 든 URL과 응답 원본은 출력하거나 저장하지 않는다.
import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const GENRES = ["Pop", "Hip-Hop", "R&B", "Rock", "Indie", "EDM", "Ballad", "Jazz", "K-POP"];

// 그룹 → Last.fm 국가 이름과 국가별 후보 수. 한국·일본은 나라가 하나뿐이라 더 많이 모은다.
export const COUNTRY_GROUPS = {
  kr: [["Korea, Republic of", 400]],
  us_uk: [["United States", 200], ["United Kingdom", 200]],
  jp: [["Japan", 400]],
  world: [["France", 200], ["Spain", 200], ["Brazil", 200], ["Sweden", 200]],
};

export const TAG_TO_GENRE = {
  pop: "Pop", "dance-pop": "Pop", "dance pop": "Pop", electropop: "Pop", synthpop: "Pop", "j-pop": "Pop", jpop: "Pop",
  "hip-hop": "Hip-Hop", "hip hop": "Hip-Hop", hiphop: "Hip-Hop", rap: "Hip-Hop", trap: "Hip-Hop", "k-hiphop": "Hip-Hop", "korean hip hop": "Hip-Hop",
  rnb: "R&B", "r&b": "R&B", "r and b": "R&B", "rhythm and blues": "R&B", soul: "R&B", "neo soul": "R&B", "neo-soul": "R&B", "contemporary r&b": "R&B", "k-r&b": "R&B",
  rock: "Rock", "alternative rock": "Rock", "classic rock": "Rock", "hard rock": "Rock", "punk rock": "Rock", "pop rock": "Rock", "j-rock": "Rock", jrock: "Rock", "k-rock": "Rock", metal: "Rock",
  indie: "Indie", "indie pop": "Indie", "indie rock": "Indie", "indie folk": "Indie", "k-indie": "Indie", "bedroom pop": "Indie", "dream pop": "Indie",
  edm: "EDM", electronic: "EDM", dance: "EDM", house: "EDM", techno: "EDM", trance: "EDM", dubstep: "EDM", electro: "EDM", "drum and bass": "EDM",
  ballad: "Ballad", ballads: "Ballad", "power ballad": "Ballad", "korean ballad": "Ballad", "k-ballad": "Ballad",
  jazz: "Jazz", "smooth jazz": "Jazz", "vocal jazz": "Jazz", "nu jazz": "Jazz", "bossa nova": "Jazz",
  "k-pop": "K-POP", kpop: "K-POP", "k pop": "K-POP", "korean pop": "K-POP", korean: "K-POP",
  // 현지 곡을 살리기 위한 근사 매핑. 국가·언어 태그는 장르가 아니라서 가장 가까운 칩에 넣는다.
  japanese: "Pop", "japanese pop": "Pop", anime: "Pop", vocaloid: "Pop", "city pop": "Pop",
  "visual kei": "Rock", "japanese rock": "Rock", "korean rock": "Rock",
  "japanese hip hop": "Hip-Hop", "korean r&b": "R&B", "korean indie": "Indie", "japanese indie": "Indie",
};

// Last.fm 태그 점수(0~100)가 이보다 낮으면 장르로 보지 않는다.
const MIN_TAG_COUNT = 20;
// 아티스트 태그는 곡보다 넓어서 기준을 높인다.
const MIN_ARTIST_TAG_COUNT = 40;
const TARGET_PER_COUNTRY = 150;
const MIN_PER_COUNTRY = 50;
const CATALOG_KEYS = ["id", "name", "artist", "genres", "countries"];
const LASTFM_DELAY_MS = 250;
// Spotify 할당량은 개발자 계정 단위로 로그인 사용자와 공유한다. 하루 약 1,000회 검색 뒤 429(Retry-After 약 23.5시간)를 받은 적이 있다.
const SPOTIFY_DELAY_MS = 2000;
export const SPOTIFY_DAILY_CAP = 300;

// 대소문자, 괄호 표기, feat., "- Remastered" 같은 꼬리표, 문장부호를 지운 비교용 문자열.
export function normalize(text) {
  return String(text)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[([{][^)\]}]*[)\]}]/g, " ")
    .replace(/\s+-\s+.*$/, " ")
    .replace(/\b(feat|ft|featuring)\b\.?.*$/, " ")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

export function genresFromTags(tags, minCount = MIN_TAG_COUNT) {
  const genres = new Set();
  for (const tag of tags) {
    if (Number(tag.count) < minCount) continue;
    const genre = TAG_TO_GENRE[String(tag.name).trim().toLowerCase()];
    if (genre) genres.add(genre);
  }
  return GENRES.filter((g) => genres.has(g));
}

export function genresFromArtistTags(tags) {
  return genresFromTags(tags, MIN_ARTIST_TAG_COUNT);
}

// Spotify가 현지 표기를 돌려주도록 후보의 글자에 맞는 언어를 요청한다.
export function acceptLanguageFor(text) {
  if (/[\uac00-\ud7a3]/.test(text)) return "ko";
  if (/[\u3040-\u30ff\u4e00-\u9fff]/.test(text)) return "ja";
  return null;
}

// 제목이 같고 Spotify 아티스트 중 하나가 후보 아티스트와 같을 때만 같은 곡으로 본다.
export function findMatchingTrack(items, title, artist) {
  const wantTitle = normalize(title);
  const wantArtist = normalize(artist);
  if (!wantTitle || !wantArtist) return null;
  return (
    items.find(
      (t) =>
        t?.id &&
        !t.is_local &&
        normalize(t.name) === wantTitle &&
        t.artists?.some((a) => normalize(a.name) === wantArtist),
    ) ?? null
  );
}

// 파일에 들어갈 항목은 정해진 키만 갖는다. 순위가 남지 않도록 ID 순으로 정렬한다.
export function toCatalog(byId) {
  return [...byId.values()]
    .map((t) => ({
      id: t.id,
      name: t.name,
      artist: t.artist,
      genres: GENRES.filter((g) => t.genres.includes(g)),
      countries: Object.keys(COUNTRY_GROUPS).filter((c) => t.countries.includes(c)),
    }))
    .sort((a, b) => (a.id < b.id ? -1 : 1));
}

export function assertCatalogShape(catalog) {
  for (const entry of catalog) {
    const keys = Object.keys(entry);
    if (keys.length !== CATALOG_KEYS.length || !CATALOG_KEYS.every((k) => keys.includes(k))) {
      throw new Error(`catalog entry has unexpected keys: ${keys.join(",")}`);
    }
    if (!entry.genres.length || !entry.genres.every((g) => GENRES.includes(g))) throw new Error(`bad genres: ${entry.id}`);
    if (!entry.countries.length || !entry.countries.every((c) => c in COUNTRY_GROUPS)) throw new Error(`bad countries: ${entry.id}`);
  }
}

export function countTable(catalog) {
  const table = {};
  for (const c of Object.keys(COUNTRY_GROUPS)) {
    const rows = catalog.filter((t) => t.countries.includes(c));
    table[c] = { total: rows.length };
    for (const g of GENRES) table[c][g] = rows.filter((t) => t.genres.includes(g)).length;
  }
  return table;
}

export function kstDate(now) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(now);
}

// 호출 전에 판단한다. 429로 받은 차단 시각이 지나지 않았거나 오늘(KST) 상한에 닿았으면 호출하지 않는다.
export function spotifyBudget(usage, now, cap = SPOTIFY_DAILY_CAP) {
  if (usage.blockedUntil && now < new Date(usage.blockedUntil)) return { ok: false, reason: `Spotify 429 차단 중 (${usage.blockedUntil}까지)` };
  if (usage.date === kstDate(now) && usage.calls >= cap) return { ok: false, reason: `오늘 Spotify 호출 상한 ${cap}회 도달` };
  return { ok: true };
}

export function recordSpotifyCall(usage, now) {
  const date = kstDate(now);
  return { ...usage, date, calls: usage.date === date ? usage.calls + 1 : 1 };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class StopBuild extends Error {}

const LASTFM_RATE_LIMIT_CODE = 29;

// 429는 어느 서비스든 재시도 없이 바로 멈춘다.
async function fetchJson(url, init, label, { checkLastfmBody = false, on429 } = {}) {
  for (let attempt = 1; ; attempt++) {
    let res;
    try {
      res = await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
    } catch {
      if (attempt >= 3) throw new StopBuild(`${label}: 네트워크 오류`);
      await sleep(2000 * attempt);
      continue;
    }
    if (res.status === 429) {
      const wait = Number(res.headers.get("retry-after") ?? 0);
      on429?.(wait);
      throw new StopBuild(`${label}: 429, Retry-After ${wait}초`);
    }
    if (checkLastfmBody && !res.ok) {
      const body = await res.clone().json().catch(() => ({}));
      if (body.error === LASTFM_RATE_LIMIT_CODE) throw new StopBuild(`${label}: 요청 제한(오류 ${LASTFM_RATE_LIMIT_CODE})`);
    }
    if (res.status >= 500 && attempt < 3) {
      await sleep(2000 * attempt);
      continue;
    }
    if (!res.ok) throw new StopBuild(`${label}: HTTP ${res.status}`);
    return res.json();
  }
}

// Last.fm은 제한을 받으면 재시도하지 않고 멈춘다.
async function lastfm(params, label) {
  const qs = new URLSearchParams({ ...params, api_key: process.env.LASTFM_API_KEY, format: "json" });
  const data = await fetchJson(`https://ws.audioscrobbler.com/2.0/?${qs}`, {}, label, { checkLastfmBody: true });
  if (data.error === LASTFM_RATE_LIMIT_CODE) throw new StopBuild(`${label}: 요청 제한(오류 ${LASTFM_RATE_LIMIT_CODE})`);
  return data;
}

// 찾을 수 없는 곡·아티스트(4xx)는 태그 없음으로 본다.
async function fetchTags(params, label) {
  const data = await lastfm(params, label).catch((e) => {
    if (e instanceof StopBuild && /HTTP 4/.test(e.message)) return {};
    throw e;
  });
  const tags = data.toptags?.tag ?? [];
  return Array.isArray(tags) ? tags : [tags];
}

async function fetchChart(country, limit) {
  const out = [];
  for (let page = 1; out.length < limit; page++) {
    const data = await lastfm({ method: "geo.gettoptracks", country, limit: "100", page: String(page) }, "geo.gettoptracks");
    if (data.error) throw new StopBuild(`geo.gettoptracks: Last.fm 오류 ${data.error}`);
    const tracks = data.tracks?.track ?? [];
    if (!tracks.length) break;
    for (const t of tracks) out.push({ title: t.name, artist: t.artist?.name ?? "" });
    await sleep(LASTFM_DELAY_MS);
    if (page >= Number(data.tracks?.["@attr"]?.totalPages ?? page)) break;
  }
  return out.slice(0, limit);
}

async function appToken(options) {
  const basic = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64");
  const data = await fetchJson(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
    },
    "spotify token",
    options,
  );
  return { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
}

function parseArgs(argv) {
  const args = { dryRun: argv.includes("--dry-run"), skipRemaining: argv.includes("--skip-remaining") };
  const value = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
  args.country = value("--country");
  args.limit = value("--limit") ? Number(value("--limit")) : undefined;
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  for (const k of args.skipRemaining ? [] : ["LASTFM_API_KEY", "SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET"]) {
    if (!process.env[k]) throw new StopBuild(`환경 변수 ${k}가 없습니다`);
  }
  const groups = args.country ? { [args.country]: COUNTRY_GROUPS[args.country] } : COUNTRY_GROUPS;

  // 중단 후 재개용 임시 파일. 저장소 밖에 두고 태그·순위·재생 수는 남기지 않는다.
  const workDir = process.env.GUEST_BUILD_WORKDIR ?? join(tmpdir(), "moodtune-guest-build");
  mkdirSync(workDir, { recursive: true });
  const statePath = join(workDir, args.dryRun ? "state-dry.json" : "state.json");
  const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, "utf8")) : { genres: {}, tracks: {}, charts: {} };
  state.artistGenres ??= {};
  const save = () => writeFileSync(statePath, JSON.stringify(state));
  // 차단 시각과 오늘 호출 수. 실행이 달라도 이어지도록 파일에 둔다.
  const usagePath = join(workDir, "spotify-usage.json");
  let usage = existsSync(usagePath) ? JSON.parse(readFileSync(usagePath, "utf8")) : { date: null, calls: 0, blockedUntil: null };
  const saveUsage = () => writeFileSync(usagePath, JSON.stringify(usage));
  const spotifyOptions = {
    on429: (wait) => {
      usage.blockedUntil = new Date(Date.now() + wait * 1000).toISOString();
      saveUsage();
    },
  };
  const beforeSpotifyCall = () => {
    const budget = spotifyBudget(usage, new Date());
    if (!budget.ok) throw new StopBuild(budget.reason);
    usage = recordSpotifyCall(usage, new Date());
    saveUsage();
  };
  const stats = { candidates: 0, noGenre: 0, fromArtistTags: 0, noMatch: 0, noMatchLocalScript: 0, matched: 0, skipped: 0, lastfmCalls: 0, spotifyCalls: 0 };

  const failure = await (async () => {
    // 1. 국가별 후보. 임시 파일에는 순서를 남기지 않도록 정렬해 둔다.
    const candidates = new Map();
    for (const [group, countries] of Object.entries(groups)) {
      for (const [country, limit] of countries) {
        if (!args.skipRemaining) {
          state.charts[country] ??= (await fetchChart(country, args.limit ?? limit))
            .map((t) => [t.title, t.artist])
            .sort();
          save();
        }
        for (const [title, artist] of state.charts[country] ?? []) {
          const key = `${normalize(title)}|${normalize(artist)}`;
          if (!candidates.has(key)) candidates.set(key, { title, artist, groups: new Set() });
          candidates.get(key).groups.add(group);
        }
        console.log(`${country}: 후보 ${state.charts[country]?.length ?? 0}곡`);
      }
    }
    stats.candidates = candidates.size;
    console.log(`중복 제외 후보 ${candidates.size}곡`);

    // 2. 태그 → 장르 라벨. 태그 원본은 라벨을 만든 뒤 버린다.
    let done = 0;
    for (const [key, c] of candidates) {
      if (!(key in state.genres) && !args.skipRemaining) {
        const tags = await fetchTags({ method: "track.gettoptags", track: c.title, artist: c.artist, autocorrect: "1" }, "track.gettoptags");
        stats.lastfmCalls++;
        state.genres[key] = genresFromTags(tags);
        await sleep(LASTFM_DELAY_MS);
      }
      if (++done % 100 === 0) {
        save();
        console.log(`태그 ${done}/${candidates.size}`);
      }
    }
    save();

    // 2-1. 곡 태그로 장르를 못 정한 후보는 아티스트 태그를 쓴다. 같은 아티스트는 한 번만 호출한다.
    done = 0;
    for (const c of candidates.values()) {
      const key = `${normalize(c.title)}|${normalize(c.artist)}`;
      if (state.genres[key]?.length) continue;
      const artistKey = normalize(c.artist);
      if (!(artistKey in state.artistGenres) && !args.skipRemaining) {
        const tags = await fetchTags({ method: "artist.gettoptags", artist: c.artist, autocorrect: "1" }, "artist.gettoptags");
        stats.lastfmCalls++;
        state.artistGenres[artistKey] = genresFromArtistTags(tags);
        await sleep(LASTFM_DELAY_MS);
      }
      if (state.artistGenres[artistKey]?.length) stats.fromArtistTags++;
      if (++done % 100 === 0) {
        save();
        console.log(`아티스트 태그 ${done}`);
      }
    }
    save();
    const genresOf = (key, c) => (state.genres[key]?.length ? state.genres[key] : (state.artistGenres[normalize(c.artist)] ?? []));

    // 3. 장르가 붙은 후보만 Spotify 검색으로 실제 트랙을 확인한다.
    let token = null;
    done = 0;
    for (const [key, c] of candidates) {
      if (!genresOf(key, c).length) {
        stats.noGenre++;
        continue;
      }
      if (!(key in state.tracks) && args.skipRemaining) {
        stats.skipped++;
        continue;
      }
      if (!(key in state.tracks)) {
        if (!token || token.expiresAt - Date.now() < 60_000) {
          beforeSpotifyCall();
          token = await appToken(spotifyOptions);
        }
        beforeSpotifyCall();
        const qs = new URLSearchParams({ q: `track:"${c.title.replaceAll('"', "")}" artist:"${c.artist.replaceAll('"', "")}"`, type: "track", limit: "5" });
        const language = acceptLanguageFor(c.title + c.artist);
        const headers = { Authorization: `Bearer ${token.value}`, ...(language ? { "Accept-Language": language } : {}) };
        const data = await fetchJson(`https://api.spotify.com/v1/search?${qs}`, { headers }, "spotify search", spotifyOptions);
        stats.spotifyCalls++;
        const hit = findMatchingTrack(data.tracks?.items ?? [], c.title, c.artist);
        state.tracks[key] = hit ? { id: hit.id, name: hit.name, artist: hit.artists.map((a) => a.name).join(", ") } : null;
        await sleep(SPOTIFY_DELAY_MS);
      }
      if (++done % 100 === 0) {
        save();
        console.log(`검색 ${done}`);
      }
      if (state.tracks[key]) stats.matched++;
      else {
        stats.noMatch++;
        if (acceptLanguageFor(c.title + c.artist)) stats.noMatchLocalScript++;
      }
    }
    save();

    // 4. 같은 Spotify 트랙은 합친다.
    const byId = new Map();
    for (const [key, c] of candidates) {
      const hit = state.tracks[key];
      if (!hit || !genresOf(key, c).length) continue;
      const entry = byId.get(hit.id) ?? { ...hit, genres: [], countries: [] };
      entry.genres = [...new Set([...entry.genres, ...genresOf(key, c)])];
      entry.countries = [...new Set([...entry.countries, ...c.groups])];
      byId.set(hit.id, entry);
    }
    return byId;
  })().catch((e) => {
    if (e instanceof StopBuild) return e;
    throw e;
  });

  if (failure instanceof StopBuild) {
    save();
    console.error(`중단: ${failure.message}. 진행 상황은 임시 파일에 저장했습니다. 다시 실행하면 이어서 합니다.`);
    process.exitCode = 3;
    return;
  }

  const catalog = toCatalog(failure);
  assertCatalogShape(catalog);
  const table = countTable(catalog);
  console.log("STATS " + JSON.stringify(stats));
  console.log("TABLE " + JSON.stringify(table));
  console.log(`총 ${catalog.length}곡`);

  const short = Object.entries(table).filter(([c, row]) => c in groups && row.total < MIN_PER_COUNTRY).map(([c]) => c);
  const below = Object.entries(table).filter(([c, row]) => c in groups && row.total < TARGET_PER_COUNTRY).map(([c]) => c);
  if (below.length) console.log(`목표 ${TARGET_PER_COUNTRY}곡 미달: ${below.join(", ")}`);
  if (args.dryRun) {
    console.log("dry-run: 파일을 쓰지 않습니다");
    return;
  }
  if (short.length) {
    console.error(`게이트 실패: ${short.join(", ")}가 ${MIN_PER_COUNTRY}곡 미만이라 파일을 쓰지 않습니다`);
    process.exitCode = 2;
    return;
  }
  const out = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "guest-catalog.json");
  mkdirSync(dirname(out), { recursive: true });
  // 빌드가 끝난 뒤에만 기존 파일을 한 번에 교체한다.
  writeFileSync(`${out}.tmp`, JSON.stringify(catalog, null, 1) + "\n");
  renameSync(`${out}.tmp`, out);
  console.log(`저장: data/guest-catalog.json`);
}

if (import.meta.main) await main();
