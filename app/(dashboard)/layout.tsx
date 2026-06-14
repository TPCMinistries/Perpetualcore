import { RfpAtmosphere } from "@/components/rfp/RfpAtmosphere";

/**
 * (dashboard) route-group layout — applies to every /org/[orgId]/* surface.
 *
 * Why this exists: the root layout uses next-themes with defaultTheme="system".
 * This wrapper hard-locks the dashboard to the RFP Engine's premium LIGHT
 * surface (warm off-white canvas) so the product reads as one cohesive,
 * calm tool regardless of OS theme. Components below use explicit light
 * colors (not `dark:` variants), so this scope is self-consistent.
 */
export default function DashboardRouteGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-[#f7f7f4] text-zinc-900 antialiased selection:bg-emerald-200/60 selection:text-emerald-900">
      <RfpAtmosphere theme="light" />
      {children}
    </div>
  );
}
