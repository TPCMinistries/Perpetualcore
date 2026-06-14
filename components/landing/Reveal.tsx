"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Wrap a section to fade-up when it enters the viewport.
 * Honors prefers-reduced-motion via CSS in globals.css.
 *
 * Renders a <section> element. The `as` prop is accepted but ignored
 * (previously polymorphic; simplified after a runtime bug).
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add("reveal-on"), delay);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <section ref={ref} className={`reveal-init ${className}`}>
      {children}
    </section>
  );
}
