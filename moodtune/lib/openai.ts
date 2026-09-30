import { MOOD_OPTIONS, SITUATION_OPTIONS, type ChipOption } from "@/lib/chipColors";
import { requireEnv } from "@/lib/env";
import type { RecommendationRequest, RecommendationResult } from "@/types";

const MODEL = "gpt-4o-mini";
const GENERIC_FALLBACK_REASON = "지금 라이브러리에서 골라봤어요.";
// 이유 뒤에 붙이는 출처 플레이리스트 이름의 최대 길이 (add-richer-reasons design.md Decision 3).
const MAX_SOURCE_NAME_LENGTH = 40;

type AiPick = { uri: string; reason: string };

// 영문 칩 라벨을 프롬프트용 한국어 표현으로 바꾼다. 목록에 없는 값은 그대로 둔다.
function toPromptLabel(options: ChipOption[], label: string): string {
  return options.find((o) => o.label === label)?.promptLabel ?? label;
}

async function callOpenAI(request: RecommendationRequest, forceListOnly: boolean): Promise<AiPick> {
  const { context, weather, librarySample } = request;
  // 출처 플레이리스트는 모델에 넘기지 않는다 — 인용은 getRecommendation()이 코드로 붙인다.
  const trackList = librarySample.map((t) => ({ uri: t.uri, name: t.name, artist: t.artist }));

  const contextLines = [
    context.mood ? `mood: ${toPromptLabel(MOOD_OPTIONS, context.mood)}` : null,
    context.situation ? `situation: ${toPromptLabel(SITUATION_OPTIONS, context.situation)}` : null,
    context.freeText ? `note: ${context.freeText}` : null,
    weather ? `weather: ${weather.condition}, ${weather.temperatureC}°C` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt = [
    "You are a music curator picking exactly one track from the user's own Spotify library that fits their current mood, situation, and weather.",
    'You MUST pick a track whose "uri" appears EXACTLY as given in the provided track list — never invent, modify, or guess a uri.',
    forceListOnly
      ? "IMPORTANT: Your previous pick was invalid because its uri was not in the list. You MUST select only from the exact uri values given below."
      : "",
    'Respond with strict JSON only: {"uri": string, "reason": string}. reason explains why this track fits right now, following these rules:',
    "- Write exactly ONE short, friendly sentence in Korean. Never add a second sentence.",
    "- Build the reason ONLY from the given Context values (mood / situation / weather). Never mention any playlist.",
    "- Use EVERY given Context value; do not drop any. If both mood and situation are given, weave both into the one sentence. Keep the meaning and key words of each given mood / situation expression — you may only adjust endings to join them naturally — and never replace them with a different mood or situation.",
    "- If a weather line is given, include it naturally to describe the user's current moment, using its condition as written and, if you like, its temperature as a number (e.g. \"흐리고 15°C인 날\"). Do not add feelings about the weather that the line does not state, and never link the weather to the track. If there is no weather line, do not describe or invent any weather.",
    "- Never mention a value that is not in Context.",
    "- NEVER say anything about the track itself — no sound, genre, tempo, lyrics, mood, atmosphere, or impression of any kind, and no expression linking the track to the Context (\"~에 어울린다\", \"~하기 좋다\", \"~한 분위기와 맞다\"). You may only name the track title or artist.",
    "- The examples below use made-up Context values (e.g. \"나른한 기분\", \"도서관에 가는 중\") only to show the rules. Do not copy their wording; write the sentence from the actual Context values.",
    '- Good (mood only): "나른한 기분이라 이 곡을 골랐어요."',
    '- Good (mood "나른한 기분" + situation "도서관에 가는 중" + weather "흐림, 15°C"): "흐리고 15°C인 날, 나른한 기분으로 도서관에 가는 중이라 이 곡을 골랐어요."',
    '- Bad (same Context): "나른한 기분이라 이 곡을 골랐어요." (drops the situation and the weather)',
    '- Bad: "나른한 기분이라 골랐어요. Norah Jones의 재즈 곡입니다." (describes the track, and has two sentences)',
  ]
    .filter(Boolean)
    .join("\n");

  const userPrompt = `Context:\n${contextLines || "(no specific mood/situation given)"}\n\nTrack list (JSON):\n${JSON.stringify(trackList)}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireEnv("OPENAI_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`OpenAI request failed (${res.status})`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned no content");

  const parsed = JSON.parse(content) as Partial<AiPick>;
  if (!parsed.uri || !parsed.reason) throw new Error("OpenAI response missing fields");
  return { uri: parsed.uri, reason: parsed.reason };
}

// 40자를 넘는 이름은 단어 중간이 아니라 마지막 공백에서 자르고 말줄임표를 붙인다.
// 40자 안에 공백이 없으면 40자에서 자른다.
function shortenName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= MAX_SOURCE_NAME_LENGTH) return trimmed;
  const cut = trimmed.slice(0, MAX_SOURCE_NAME_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

// 선택된 곡에 출처 플레이리스트가 있으면 모델 문장 뒤에 인용 문장을 결정적으로 붙인다
// (add-richer-reasons design.md Decision 3). 모델에게 조건부 인용을 맡기면 출처 없는 곡에도
// 이름을 지어내서, 인용은 코드가 맡는다. 폴백 경로에는 쓰지 않는다.
function withSourcePlaylist(reason: string, sources: string[] | undefined): string {
  const name = sources?.[0] ? shortenName(sources[0]) : "";
  if (!name) return reason;
  const sentence = reason.trim();
  const ended = /[.!?…~]$/.test(sentence) ? sentence : `${sentence}.`;
  return `${ended} '${name}' 플레이리스트에 넣어두신 곡이에요.`;
}

// FR-12 — AI 환각 방지: 목록 밖 트랙이면 최대 1회 재시도, 그래도 안 되면 결정론적 폴백.
// OpenAI 호출 자체가 실패(네트워크/인증/요율 등)하면 여기서 잡지 않고 그대로 던져서
// 라우트 핸들러가 502로 응답하게 한다 (NFR-3: 폴백이 아니라 재시도 액션을 보여줘야 하는 경우).
export async function getRecommendation(request: RecommendationRequest): Promise<RecommendationResult> {
  const { librarySample } = request;
  const findTrack = (uri: string) => librarySample.find((t) => t.uri === uri || t.id === uri);

  const first = await callOpenAI(request, false);
  let track = findTrack(first.uri);
  let reason = first.reason;

  if (!track) {
    const retry = await callOpenAI(request, true);
    track = findTrack(retry.uri);
    reason = retry.reason;
  }

  if (track) {
    const sources = request.sourcesByTrackId?.[track.id];
    return { track, reason: withSourcePlaylist(reason, sources), isFallback: false, type: "track" };
  }

  // 재시도 후에도 목록 밖 트랙이면 결정론적 폴백(목록의 첫 번째 트랙), 사용자에게는 노출하지 않는다.
  return { track: librarySample[0], reason: GENERIC_FALLBACK_REASON, isFallback: true, type: "track" };
}
