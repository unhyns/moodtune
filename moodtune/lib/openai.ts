import { requireEnv } from "@/lib/env";
import type { RecommendationRequest, RecommendationResult } from "@/types";

const MODEL = "gpt-4o-mini";
const GENERIC_FALLBACK_REASON = "지금 라이브러리에서 골라봤어요.";

type AiPick = { uri: string; reason: string };

async function callOpenAI(request: RecommendationRequest, forceListOnly: boolean): Promise<AiPick> {
  const { context, weather, librarySample } = request;
  const trackList = librarySample.map((t) => ({ uri: t.uri, name: t.name, artist: t.artist }));

  const contextLines = [
    context.mood ? `mood: ${context.mood}` : null,
    context.situation ? `situation: ${context.situation}` : null,
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
    'Respond with strict JSON only: {"uri": string, "reason": string}. reason is one short, friendly sentence in Korean explaining why this track fits right now.',
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
    return { track, reason, isFallback: false, type: "track" };
  }

  // 재시도 후에도 목록 밖 트랙이면 결정론적 폴백(목록의 첫 번째 트랙), 사용자에게는 노출하지 않는다.
  return { track: librarySample[0], reason: GENERIC_FALLBACK_REASON, isFallback: true, type: "track" };
}
