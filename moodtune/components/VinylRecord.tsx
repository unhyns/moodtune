type VinylRecordProps = {
  className?: string;
};

export default function VinylRecord({ className = "" }: VinylRecordProps) {
  return (
    <div
      aria-hidden="true"
      className={`absolute size-[375px] overflow-hidden ${className}`}
    >
      <div className="vinyl-spin absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- reproduces Figma's exact crop (103.54% w / -1.77% left); next/image can't express that offset */}
        <img
          src="/landing/vinyl.png"
          alt=""
          width={373}
          height={360}
          className="absolute left-[-1.77%] top-0 h-full w-[103.54%] max-w-none"
        />
      </div>
    </div>
  );
}
