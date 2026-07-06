import { RfpAtmosphere } from "@/components/rfp/RfpAtmosphere";

/**
 * (dashboard) route-group layout — applies to every /org/[orgId]/* surface.
 *
 * Why this exists: the root layout uses next-themes with defaultTheme="system",
 * so on a light-mode OS the body inherits light classes and the org pages
 * leak beige around their content. This wrapper hard-locks the dashboard
 * to the dark visual system that the rest of the RFP product uses, and
 * cascades the shared atmospheric backdrop so transitions between the
 * marketing site and the app feel like one product.
 */
export default function DashboardRouteGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark relative min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-emerald-300/30 selection:text-emerald-100">
      <RfpAtmosphere />
      {children}
    </div>
  );
}
