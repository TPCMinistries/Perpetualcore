/**
 * /admin/rfp layout — dark zinc-950 + emerald to match the RFP product
 * surface. Distinct from the legacy /admin/ which is light-themed and
 * tenant-facing.
 */

export default function AdminRfpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      {children}
    </div>
  );
}
