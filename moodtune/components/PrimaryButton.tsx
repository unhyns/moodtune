type PrimaryButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
};

export default function PrimaryButton({
  children,
  onClick,
  disabled = false,
  type = "button",
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="min-h-11 min-w-11 rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-black"
    >
      {children}
    </button>
  );
}
