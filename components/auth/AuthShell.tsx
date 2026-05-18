"use client";

/**
 * AuthShell — shared chrome for /login, /signup, /reset-password,
 * /accept-invite. Detects the current product from the hostname on
 * mount and renders one of two visual variants:
 *
 *  - "rfp": dark zinc-950 + emerald accents, matches the rfp.perpetualcore.com
 *    marketing aesthetic. Mono uppercase eyebrow wordmark, editorial title,
 *    no card chrome — just a focused content column. Subtle radial blob.
 *
 *  - "default": the existing Perpetual Core gradient-light card design.
 *    Preserves backward compatibility for www / parent app / other
 *    subdomains until each gets its own variant.
 *
 * The form itself (passed via children) renders inside the variant. No
 * change to auth logic, validation, or routing.
 */

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  detectProductFromHost,
  productBrand,
  type ProductBrand,
  type ProductId,
} from "@/lib/brand/product-context";

interface AuthShellProps {
  /** Big headline. */
  title: string;
  /** Sub-headline beneath the title. */
  subtitle?: string;
  /** Form / body content. */
  children: ReactNode;
  /** Footer text shown beneath the form (e.g., "Don't have an account?"). */
  footer?: ReactNode;
  /**
   * Optional override per-product copy. When unset we use the brand
   * defaults from product-context.ts. Pages that share auth (login,
   * signup) prefer the override-from-brand variant; pages that are
   * truly generic (reset-password) leave it unset.
   */
  productCopyKey?: "signIn" | "signUp";
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  productCopyKey,
}: AuthShellProps) {
  const [productId, setProductId] = useState<ProductId>("perpetual-core");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setProductId(detectProductFromHost(window.location.hostname));
    }
  }, []);

  const brand = productBrand(productId);

  // For login/signup, the page can override its title/subtitle with the
  // brand's product-specific copy (e.g., "Sign in to RFP Engine" instead
  // of "Welcome back" when on rfp.perpetualcore.com).
  const finalTitle =
    productCopyKey === "signIn"
      ? brand.signInTitle
      : productCopyKey === "signUp"
        ? brand.signUpTitle
        : title;
  const finalSubtitle =
    productCopyKey === "signIn"
      ? brand.signInSubtitle
      : productCopyKey === "signUp"
        ? brand.signUpSubtitle
        : subtitle;

  if (brand.id === "rfp") {
    return <RfpShell title={finalTitle} subtitle={finalSubtitle} brand={brand} footer={footer}>{children}</RfpShell>;
  }
  return <DefaultShell title={finalTitle} subtitle={finalSubtitle} brand={brand} footer={footer}>{children}</DefaultShell>;
}

function RfpShell({
  title,
  subtitle,
  brand,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  brand: ProductBrand;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-emerald-300/30 selection:text-emerald-100">
      {/* Ambient field — same motif as the rfp marketing pages */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[700px] w-[1200px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.18),transparent)] blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <header className="border-b border-white/5">
        <div className="container mx-auto flex items-center justify-between px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              {brand.wordmark}
            </span>
          </Link>
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 hover:text-zinc-300"
          >
            ← Back to site
          </Link>
        </div>
      </header>

      <main className="container mx-auto flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-3">
            <span className="h-px w-8 bg-zinc-700" />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
              {brand.wordmark}
            </span>
          </div>
          <h1
            className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-[1.1] tracking-tight text-white"
          >
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-3 text-[15px] leading-[1.6] text-zinc-400">
              {subtitle}
            </p>
          ) : null}

          <div className="mt-10 [&_input]:bg-zinc-900/60 [&_input]:border-zinc-800 [&_input]:text-zinc-100 [&_input]:placeholder:text-zinc-600 [&_label]:text-zinc-300 [&_button[type=submit]]:bg-emerald-500/10 [&_button[type=submit]]:border [&_button[type=submit]]:border-emerald-500/30 [&_button[type=submit]]:text-emerald-100 [&_button[type=submit]]:hover:bg-emerald-500/15 [&_textarea]:bg-zinc-900/60 [&_textarea]:border-zinc-800 [&_textarea]:text-zinc-100">
            {children}
          </div>

          {footer ? (
            <div className="mt-6 text-center text-sm text-zinc-400">{footer}</div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function DefaultShell({
  title,
  subtitle,
  brand,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  brand: ProductBrand;
  children: ReactNode;
  footer?: ReactNode;
}) {
  // Match the existing perpetual-core auth card chrome so the rest of
  // the suite (www, sentinel, atlas, sage) keeps its current look until
  // each one ships its own variant.
  void brand;
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md rounded-xl border bg-card text-card-foreground shadow-lg">
        <div className="flex flex-col space-y-1.5 p-6 text-center">
          <h2 className="text-2xl font-semibold leading-none tracking-tight">{title}</h2>
          {subtitle ? (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <div className="p-6 pt-0">
          {children}
          {footer ? <div className="mt-6 text-center text-sm">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
