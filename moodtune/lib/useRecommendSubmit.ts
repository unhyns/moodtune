import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RecommendationResult, WeatherContext } from "@/types";

// /input과 /input/custom이 공유하는 추천 제출 흐름 (add-free-text-input design.md Decision 1).
// API 호출 → LoadingPopup 연동 → 에러 처리 → /result 이동. LoadingPopup 렌더링은 각 페이지가 맡는다.

export type RecommendRequestBody = {
  mood?: string;
  situation?: string;
  freeText?: string;
  weather?: WeatherContext;
};

export type SubmitInput = {
  body: RecommendRequestBody;
  // /result 배지용. 텍스트 경로는 비워 둔다.
  resultParams?: { mood?: string; situation?: string };
  // /result로 이동하기 직전에 호출된다 (초안 삭제 등).
  onSuccess?: () => void;
};

export type SubmitError = null | "failed" | "empty_library";

export function useRecommendSubmit() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [error, setError] = useState<SubmitError>(null);
  // 상태가 반영되기 전 같은 프레임의 연속 클릭까지 막기 위한 진행 중 플래그.
  const inFlightRef = useRef(false);
  const pendingRef = useRef<SubmitInput | null>(null);

  const submit = async (input: SubmitInput) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    pendingRef.current = input;
    setError(null);
    setRecommendation(null);
    setIsSubmitting(true);

    const fail = (kind: Exclude<SubmitError, null>) => {
      inFlightRef.current = false;
      setIsSubmitting(false);
      setError(kind);
    };

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input.body),
      });
      if (res.status === 401) {
        router.replace("/");
        return;
      }
      if (!res.ok) {
        fail(res.status === 422 ? "empty_library" : "failed");
        return;
      }
      setRecommendation((await res.json()) as RecommendationResult);
      // isSubmitting은 그대로 true — LoadingPopup이 ready=true를 감지하면 onComplete를 부른다.
    } catch {
      fail("failed");
    }
  };

  // 로딩 팝업 애니메이션이 끝나고(ready) 실제 추천도 준비된 뒤에만 호출된다.
  // freeText는 읽지 않는다 — 결과 URL에 원문이 실리면 안 된다 (free-text-input spec).
  const handlePopupComplete = () => {
    const pending = pendingRef.current;
    if (!recommendation || !pending) return;
    const { weather } = pending.body;
    const params = new URLSearchParams({
      uri: recommendation.track.uri,
      name: recommendation.track.name,
      artist: recommendation.track.artist,
      art: recommendation.track.albumArtUrl,
      reason: recommendation.reason,
      type: recommendation.type,
    });
    if (recommendation.creator) params.set("creator", recommendation.creator);
    if (pending.resultParams?.mood) params.set("mood", pending.resultParams.mood);
    if (pending.resultParams?.situation) params.set("situation", pending.resultParams.situation);
    if (weather) {
      if (weather.city) params.set("weatherCity", weather.city);
      if (weather.icon) params.set("weatherIcon", weather.icon);
      params.set("weatherTempC", String(weather.temperatureC));
    }
    pending.onSuccess?.();
    inFlightRef.current = false;
    setIsSubmitting(false);
    router.push(`/result?${params.toString()}`);
  };

  return { isSubmitting, recommendation, error, submit, handlePopupComplete };
}
