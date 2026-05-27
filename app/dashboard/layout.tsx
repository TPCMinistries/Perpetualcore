import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth/actions";

const primaryNav = [
  { label: "Operating", href: "/dashboard" },
  { label: "Leads", href: "/dashboard/leads" },
  { label: "Packages", href: "/packages" },
  { label: "Briefing", href: "/dashboard/home" },
  { label: "Operate", href: "/dashboard/operate" },
  { label: "Ecosystem", href: "/dashboard/ecosystem" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#f7f7fb] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-3 font-semibold">
            <span className="h-3 w-3 rounded-sm bg-violet-600" />
            <span>Perpetual Core</span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-slate-600 md:flex">
            {primaryNav.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-slate-950">
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Public site
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
