const DIMMED_COLOR = "#AFAFAF";

type QuickReplyChipProps = {
  label: string;
  selected: boolean;
  dimmed: boolean;
  borderColor: string;
  textColor: string;
  onClick: () => void;
};

export default function QuickReplyChip({
  label,
  selected,
  dimmed,
  borderColor,
  textColor,
  onClick,
}: QuickReplyChipProps) {
  const color = dimmed ? DIMMED_COLOR : textColor;
  const border = dimmed ? DIMMED_COLOR : borderColor;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{ borderColor: border, color }}
      className="inline-flex items-center justify-center whitespace-nowrap border border-solid bg-white px-[10px] py-[4px] font-['Helvetica'] text-[20px] font-bold transition-colors"
    >
      {label}
    </button>
  );
}
