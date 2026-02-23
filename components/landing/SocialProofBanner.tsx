const industries = [
  { label: "Healthcare" },
  { label: "Legal" },
  { label: "Education" },
  { label: "Finance" },
  { label: "Technology" },
  { label: "Non-Profit" },
];

export function SocialProofBanner() {
  return (
    <section className="container mx-auto px-4 py-12 animate-on-scroll">
      <div className="max-w-4xl mx-auto text-center">
        {/* Counter */}
        <div className="mb-4">
          <span className="text-5xl md:text-6xl font-black bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent">
            50+
          </span>
          <span className="ml-3 text-3xl md:text-4xl font-black text-foreground">Organizations</span>
        </div>

        {/* Trusted By Label */}
        <p className="text-2xl md:text-3xl font-bold text-foreground mb-3">Trust Perpetual Core</p>

        {/* Subtitle */}
        <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
          From startups to enterprises across healthcare, legal, education, and finance
        </p>

        {/* Logo Placeholder Row */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {industries.map(({ label }) => (
            <div key={label} className="flex flex-col items-center gap-2 group">
              {/* Placeholder Logo Box */}
              <div className="w-24 h-10 rounded-lg bg-muted border border-border/60 flex items-center justify-center shadow-sm group-hover:border-primary/30 group-hover:shadow-md transition-all duration-200">
                <span className="text-xs font-semibold text-muted-foreground/50 tracking-wide uppercase">
                  {label.slice(0, 3)}
                </span>
              </div>
              {/* Industry Label */}
              <span className="text-xs text-muted-foreground/70 font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground/50 mt-8">
          Partner logos coming soon &mdash; we&apos;re building in public
        </p>
      </div>
    </section>
  );
}
