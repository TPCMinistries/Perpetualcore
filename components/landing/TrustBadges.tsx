import { Shield, ShieldCheck, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const badges = [
  {
    icon: Shield,
    iconColor: "text-green-600 dark:text-green-400",
    iconBg: "from-green-500 to-emerald-600",
    title: "SOC 2 Ready",
    subtitle: "Enterprise compliance",
    description: "Built with SOC 2 Type II controls — encryption, access management, and audit logging from day one.",
  },
  {
    icon: ShieldCheck,
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "from-blue-500 to-indigo-600",
    title: "Enterprise SSO",
    subtitle: "SAML & OAuth 2.0",
    description: "Seamless single sign-on with your existing identity provider. SAML 2.0, OAuth, and SCIM provisioning.",
  },
  {
    icon: Clock,
    iconColor: "text-purple-600 dark:text-purple-400",
    iconBg: "from-purple-500 to-violet-600",
    title: "99.9% Uptime SLA",
    subtitle: "Guaranteed availability",
    description: "Mission-critical reliability backed by Vercel and Supabase enterprise infrastructure with global CDN.",
  },
];

export function TrustBadges() {
  return (
    <section className="container mx-auto px-4 py-16 animate-on-scroll">
      <div className="max-w-5xl mx-auto">
        {/* Label */}
        <div className="text-center mb-8">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Enterprise-Ready Infrastructure
          </p>
        </div>

        {/* Badges Row */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <Card
                key={badge.title}
                className="flex-1 backdrop-blur-2xl bg-card/80 border-2 border-border shadow-xl hover:shadow-2xl hover:border-primary/30 transition-all duration-300 group"
              >
                <CardContent className="p-6 text-center">
                  {/* Icon */}
                  <div
                    className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${badge.iconBg} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold mb-1">{badge.title}</h3>

                  {/* Subtitle Pill */}
                  <div className="inline-block px-3 py-0.5 rounded-full bg-muted text-xs font-semibold text-muted-foreground mb-3">
                    {badge.subtitle}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">{badge.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
