"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * VisuallyHidden - Hides content visually but keeps it accessible to screen readers
 */
export function VisuallyHidden({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
        "clip-[rect(0,0,0,0)]",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * SkipLink - Allows keyboard users to skip to main content
 */
export function SkipLink({
  href = "#main-content",
  children = "Skip to main content",
}: {
  href?: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
    >
      {children}
    </a>
  );
}

/**
 * LiveRegion - Announces dynamic content changes to screen readers
 */
export function LiveRegion({
  children,
  mode = "polite",
  atomic = true,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  mode?: "polite" | "assertive" | "off";
  atomic?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live={mode}
      aria-atomic={atomic}
      className={cn("sr-only", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * LoadingAnnouncer - Announces loading states to screen readers
 */
export function LoadingAnnouncer({
  isLoading,
  loadingText = "Loading...",
  completeText = "Content loaded",
}: {
  isLoading: boolean;
  loadingText?: string;
  completeText?: string;
}) {
  const [announced, setAnnounced] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && !announced) {
      setAnnounced(true);
    } else if (isLoading) {
      setAnnounced(false);
    }
  }, [isLoading, announced]);

  return (
    <LiveRegion mode="polite">
      {isLoading ? loadingText : announced ? completeText : null}
    </LiveRegion>
  );
}

/**
 * FocusTrap - Traps focus within a container (useful for modals)
 * Note: Most shadcn components handle this internally via Radix
 */
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }

    container.addEventListener("keydown", handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [isActive]);

  return containerRef;
}

/**
 * IconButton - A button with icon that includes accessible label
 */
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  showLabel?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, showLabel = false, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "h-10 w-10 hover:bg-accent hover:text-accent-foreground",
          className
        )}
        {...props}
      >
        {icon}
        {showLabel ? (
          <span className="ml-2">{label}</span>
        ) : (
          <span className="sr-only">{label}</span>
        )}
      </button>
    );
  }
);
IconButton.displayName = "IconButton";

/**
 * Accessibility context for managing site-wide accessibility preferences
 */
interface A11yContextValue {
  reduceMotion: boolean;
  highContrast: boolean;
  fontSize: "normal" | "large" | "xlarge";
  setReduceMotion: (value: boolean) => void;
  setHighContrast: (value: boolean) => void;
  setFontSize: (value: "normal" | "large" | "xlarge") => void;
}

const A11yContext = React.createContext<A11yContextValue | null>(null);

export function A11yProvider({ children }: { children: React.ReactNode }) {
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const [highContrast, setHighContrast] = React.useState(false);
  const [fontSize, setFontSize] = React.useState<"normal" | "large" | "xlarge">("normal");

  // Detect system preference for reduced motion
  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mediaQuery.matches);

    function handleChange(e: MediaQueryListEvent) {
      setReduceMotion(e.matches);
    }

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <A11yContext.Provider
      value={{
        reduceMotion,
        highContrast,
        fontSize,
        setReduceMotion,
        setHighContrast,
        setFontSize,
      }}
    >
      {children}
    </A11yContext.Provider>
  );
}

export function useA11y() {
  const context = React.useContext(A11yContext);
  if (!context) {
    throw new Error("useA11y must be used within an A11yProvider");
  }
  return context;
}

/**
 * Heading levels management
 * Ensures proper heading hierarchy
 */
interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  as?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function Heading({ level, as, children, className, ...props }: HeadingProps) {
  const Tag = `h${as || level}` as keyof JSX.IntrinsicElements;

  // Map visual styles based on level
  const styles: Record<number, string> = {
    1: "text-4xl font-bold tracking-tight",
    2: "text-3xl font-semibold tracking-tight",
    3: "text-2xl font-semibold",
    4: "text-xl font-semibold",
    5: "text-lg font-medium",
    6: "text-base font-medium",
  };

  return (
    <Tag className={cn(styles[level], className)} {...props}>
      {children}
    </Tag>
  );
}

/**
 * Landmarks for improved navigation
 */
export function Main({
  children,
  id = "main-content",
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <main id={id} role="main" className={className} {...props}>
      {children}
    </main>
  );
}

export function Navigation({
  children,
  label,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & { label: string }) {
  return (
    <nav aria-label={label} className={className} {...props}>
      {children}
    </nav>
  );
}

export function Section({
  children,
  label,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & { label?: string }) {
  return (
    <section aria-label={label} className={className} {...props}>
      {children}
    </section>
  );
}
