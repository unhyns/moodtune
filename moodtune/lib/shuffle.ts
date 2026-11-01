// 입력을 바꾸지 않고 순서만 섞은 새 배열을 돌려준다 (Fisher-Yates, add-candidate-shuffle design.md Decision 1).
// 검증: shuffle.test.mjs (`node --test lib/shuffle.test.mjs`).
export function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
