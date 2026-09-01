export function BrandMark({ className = "size-6" }: { className?: string }) {
  return (
    <img
      src="/zunftecho-mark.png"
      alt=""
      aria-hidden="true"
      width={64}
      height={64}
      decoding="async"
      className={`${className} object-contain`}
    />
  );
}
