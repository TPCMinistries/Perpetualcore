import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, LogOut } from "lucide-react";
import { getUser, signOut } from "@/lib/auth/actions";
import { canProvisionPressWorkspace } from "@/lib/press/auth";

export const metadata = {
  title: "Press Studio",
  description: "Turn one recording into a reviewed, ready-to-use content pack.",
};

export default async function PressStudioLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  if (!user) {
    redirect("/login?next=/press/studio");
  }

  if (!canProvisionPressWorkspace(user.email)) {
    redirect("https://press.perpetualcore.com/access?reason=invite");
  }

  return (
    <div className="public-light min-h-screen bg-[#fffdf8] text-[#121214]">
      <a href="#press-main" className="sr-only z-[60] bg-white px-4 py-3 text-sm font-semibold text-black focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to Press workspace
      </a>
      <header className="sticky top-0 z-40 border-b border-black/10 bg-[#fffdf8]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1480px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <Link
            href="/press/studio"
            className="group flex min-h-11 items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1648d8] focus-visible:ring-offset-2"
          >
            <span className="grid h-9 w-9 place-items-center border border-black/15 bg-white transition-colors duration-200 group-hover:border-[#ff3b5c]">
              <span className="h-3.5 w-3.5 bg-[#ff3b5c]" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-black tracking-[-0.04em]">PRESS</span>
              <span className="block font-mono text-[8px] uppercase tracking-[0.2em] text-black/55">
                Production studio
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="https://press.perpetualcore.com"
              className="hidden min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-black/65 transition-colors duration-200 hover:bg-black/[0.05] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1648d8] sm:inline-flex"
            >
              About Press <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
            <span className="hidden max-w-[220px] truncate text-xs text-black/50 lg:block">
              {user.email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                aria-label="Sign out of Press"
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-black/15 bg-white px-4 text-sm font-semibold transition-colors duration-200 hover:border-black/30 hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1648d8]"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main id="press-main" className="mx-auto max-w-[1480px] px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
        {children}
      </main>

      <footer className="border-t border-black/10 bg-white">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-3 px-4 py-6 font-mono text-[10px] uppercase tracking-[0.14em] text-black/55 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
          <p>Press by Perpetual Core</p>
          <p>Private workspace · Nothing publishes without your approval</p>
        </div>
      </footer>
    </div>
  );
}
