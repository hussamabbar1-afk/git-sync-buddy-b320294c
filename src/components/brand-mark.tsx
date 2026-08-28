export function BrandMark({ className = "size-6" }: { className?: string }) {
  return (
    <img
      src="/zunftecho-mark.png"
      alt=""
      aria-hidden="true"
      className={`${className} object-contain`}
    />
  );
}
