import { cn } from "@/lib/utils";

type CoreMarkProps = {
  tone?: "light" | "dark";
  className?: string;
};

export function CoreMark({ tone = "light", className }: CoreMarkProps) {
  const dark = tone === "dark";

  return (
    <span
      aria-hidden="true"
      className={cn("relative flex h-5 w-5 shrink-0 items-center justify-center", className)}
    >
      <span
        className={cn(
          "absolute inset-[2px] rotate-45 border",
          dark
            ? "border-[#8b7cff] shadow-[0_0_18px_rgba(139,124,255,0.24)]"
            : "border-[#5548d9] shadow-[0_4px_14px_rgba(85,72,217,0.18)]"
        )}
      />
      <span className={cn("h-1.5 w-1.5", dark ? "bg-[#54e6b1]" : "bg-[#168a72]")} />
    </span>
  );
}
