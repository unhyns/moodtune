// 02_REQUIREMENTS_SPEC.md Decisions Log에서 확정된 값 (Figma Input/Result 화면 색상 포함).
// app/input/page.tsx와 app/result/page.tsx가 함께 쓴다.

export type ChipOption = {
  label: string;
  border: string;
  text: string;
  left: number;
  top: number;
};

export const MOOD_OPTIONS: ChipOption[] = [
  { label: "Excited", border: "#e4de3c", text: "#ec6f21", left: 56, top: 716 },
  { label: "Calm", border: "#9ee462", text: "#73c22d", left: 244, top: 739 },
  { label: "Depressed", border: "#1d4aab", text: "#0a46c7", left: 76, top: 781 },
  { label: "Romantic", border: "#da24bf", text: "#c70aab", left: 206, top: 830 },
  { label: "Focusing", border: "#17bc98", text: "#0ac79e", left: 42, top: 847 },
];

export const SITUATION_OPTIONS: ChipOption[] = [
  { label: "💼 Way to Work", border: "#8d29f2", text: "#6c1fb9", left: 56, top: 994 },
  { label: "🚶 Just Walking", border: "#40a00d", text: "#40a00d", left: 56, top: 1042 },
  { label: "☕️ In the Cafe", border: "#b15d20", text: "#883e0a", left: 56, top: 1090 },
  { label: "🏃 Exercising", border: "#df0f12", text: "#f91e22", left: 203, top: 1138 },
  { label: "🚙 Driving", border: "#00b4ff", text: "#00a5f7", left: 235, top: 1186 },
];
