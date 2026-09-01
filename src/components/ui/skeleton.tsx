import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-[linear-gradient(90deg,var(--color-muted),color-mix(in_oklab,var(--color-muted)_70%,var(--color-primary)),var(--color-muted))] bg-[length:200%_100%]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
