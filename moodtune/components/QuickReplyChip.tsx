type QuickReplyChipProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
};

export default function QuickReplyChip({
  label,
  selected,
  onClick,
}: QuickReplyChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition ${
        selected
          ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
          : "border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-black dark:text-zinc-200"
      }`}
    >
      {label}
    </button>
  );
}
