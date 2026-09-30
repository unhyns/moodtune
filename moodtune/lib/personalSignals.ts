import type { PersonalSignal, PersonalSignalsStore } from "@/types";

// URI별 개인 신호(만족도 피드백, 이후 핀/제외) 저장소. 브라우저 localStorage 전용.
// (openspec/changes/archive/2026-09-30-add-satisfaction-feedback/design.md Decision 1·2)
const STORAGE_KEY = "moodtune:signals";

const SIGNAL_URI = /^spotify:(track|album|playlist):[A-Za-z0-9]+$/;

function emptyStore(): PersonalSignalsStore {
  return { version: 1, items: {} };
}

export function isSignalUri(uri: string): boolean {
  return SIGNAL_URI.test(uri);
}

// 파싱 실패, 알 수 없는 버전, localStorage 접근 예외는 모두 빈 저장소로 취급한다.
export function readSignals(): PersonalSignalsStore {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (parsed as PersonalSignalsStore).version !== 1 ||
      typeof (parsed as PersonalSignalsStore).items !== "object" ||
      (parsed as PersonalSignalsStore).items === null
    ) {
      return emptyStore();
    }
    return parsed as PersonalSignalsStore;
  } catch {
    return emptyStore();
  }
}

// 이미 응답한 URI는 덮어쓰지 않는다(재응답 차단). 같은 항목의 다른 필드는 유지한다.
// 저장에 성공하면 true, 이미 응답했거나 쓰기에 실패하면 false.
export function setFeedback(uri: string, value: NonNullable<PersonalSignal["feedback"]>): boolean {
  const store = readSignals();
  const current = store.items[uri];
  if (current?.feedback) return false;

  store.items[uri] = { ...current, feedback: value, feedbackAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

export function feedbackStats(store: PersonalSignalsStore): { liked: number; total: number; ratio: number } {
  let liked = 0;
  let total = 0;
  for (const signal of Object.values(store.items)) {
    if (signal?.feedback === "liked") liked += 1;
    if (signal?.feedback === "liked" || signal?.feedback === "disliked") total += 1;
  }
  return { liked, total, ratio: total === 0 ? 0 : liked / total };
}
