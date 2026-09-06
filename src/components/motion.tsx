import { CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

export function ScrollReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      node.dataset["reveal"] = "visible";
      return;
    }

    node.dataset["reveal"] = "pending";
    let frame = 0;
    let revealed = false;
    let observer: IntersectionObserver | null = null;

    const reveal = () => {
      if (revealed) return;
      revealed = true;
      node.dataset["reveal"] = "visible";
      observer?.disconnect();
      window.removeEventListener("scroll", scheduleCheck);
      window.removeEventListener("resize", scheduleCheck);
    };

    const checkPosition = () => {
      frame = 0;
      if (node.getBoundingClientRect().top <= window.innerHeight * 0.9) reveal();
    };

    const scheduleCheck = () => {
      if (!frame) frame = window.requestAnimationFrame(checkPosition);
    };

    observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry || (!entry.isIntersecting && entry.boundingClientRect.top >= 0)) return;
        reveal();
      },
      { rootMargin: "0px 0px -10%", threshold: 0.12 },
    );
    observer.observe(node);
    window.addEventListener("scroll", scheduleCheck, { passive: true });
    window.addEventListener("resize", scheduleCheck);
    scheduleCheck();

    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", scheduleCheck);
      window.removeEventListener("resize", scheduleCheck);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn("ze-scroll-reveal", className)}
      style={{ "--ze-reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

export function CountUpNumber({ value, duration = 760 }: { value: number; duration?: number }) {
  const reduceMotion = usePrefersReducedMotion();
  const [displayValue, setDisplayValue] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion) {
      setDisplayValue(value);
      return;
    }

    let frame = 0;
    const startedAt = performance.now();
    const startValue = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + (value - startValue) * eased));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [duration, reduceMotion, value]);

  const formattedValue = new Intl.NumberFormat("de-DE").format(value);
  return (
    <span aria-label={formattedValue}>
      <span aria-hidden="true">{new Intl.NumberFormat("de-DE").format(displayValue)}</span>
    </span>
  );
}

export function ActionConfirmation({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "ze-action-confirmation flex items-start gap-2.5 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300",
        className,
      )}
    >
      <CheckCircle2 className="ze-action-confirmation-icon mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
