type SecondaryButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
};

export default function SecondaryButton({
  children,
  onClick,
  disabled = false,
}: SecondaryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="min-h-11 min-w-11 rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 transition disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200"
    >
      {children}
    </button>
  );
}
