/**
 * RfpAtmosphere — the ambient backdrop used across every RFP Engine surface
 * (marketing pages, dashboard, auth shells). Three soft radial glows + a
 * faint grid overlay. fixed inset-0 -z-10 so page content scrolls in front
 * of it. pointer-events-none so it never intercepts clicks.
 *
 * Shared via a single component so the visual signature stays cohesive
 * between rfp.perpetualcore.com/rfp/* and rfp.perpetualcore.com/org/*.
 */
export function RfpAtmosphere({ variant = "default" }: { variant?: "default" | "dense" }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 left-1/2 h-[700px] w-[1200px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.18),transparent)] blur-3xl" />
      <div className="absolute top-1/3 -right-40 h-[500px] w-[700px] rounded-full bg-[radial-gradient(closest-side,rgba(56,189,248,0.10),transparent)] blur-3xl" />
      <div className="absolute bottom-0 -left-32 h-[500px] w-[700px] rounded-full bg-[radial-gradient(closest-side,rgba(244,114,182,0.06),transparent)] blur-3xl" />
      <div
        className="absolute inset-0"
        style={{
          opacity: variant === "dense" ? 0.05 : 0.035,
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
    </div>
  );
}
