import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Users,
  Crown,
  TrendingUp,
  Lightbulb,
  Heart,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Shield,
} from "lucide-react";

export const metadata = {
  title: "AI Executive Suite | Perpetual Core",
  description:
    "Your executive-level AI advisor team — strategic leadership, revenue, product, and people experts",
};

interface Advisor {
  id: string;
  name: string;
  description: string | null;
  avatar_emoji: string | null;
  category: string | null;
  enabled: boolean | null;
  role: string;
}

const CATEGORY_CONFIG: Record<
  string,
  {
    icon: typeof Crown;
    gradient: string;
    badgeBg: string;
    badgeText: string;
    cardBorder: string;
    headerGradient: string;
    order: number;
  }
> = {
  "Strategic Leadership": {
    icon: Crown,
    gradient: "from-violet-500/10 via-purple-500/5 to-transparent",
    badgeBg: "bg-violet-100 dark:bg-violet-900/30",
    badgeText: "text-violet-700 dark:text-violet-400",
    cardBorder: "hover:border-violet-400/50 dark:hover:border-violet-600/50",
    headerGradient: "from-violet-600 to-purple-600",
    order: 1,
  },
  "Revenue & Growth": {
    icon: TrendingUp,
    gradient: "from-blue-500/10 via-cyan-500/5 to-transparent",
    badgeBg: "bg-blue-100 dark:bg-blue-900/30",
    badgeText: "text-blue-700 dark:text-blue-400",
    cardBorder: "hover:border-blue-400/50 dark:hover:border-blue-600/50",
    headerGradient: "from-blue-600 to-cyan-600",
    order: 2,
  },
  "Product & Innovation": {
    icon: Lightbulb,
    gradient: "from-emerald-500/10 via-green-500/5 to-transparent",
    badgeBg: "bg-emerald-100 dark:bg-emerald-900/30",
    badgeText: "text-emerald-700 dark:text-emerald-400",
    cardBorder: "hover:border-emerald-400/50 dark:hover:border-emerald-600/50",
    headerGradient: "from-emerald-600 to-green-600",
    order: 3,
  },
  "People & Communication": {
    icon: Heart,
    gradient: "from-orange-500/10 via-amber-500/5 to-transparent",
    badgeBg: "bg-amber-100 dark:bg-amber-900/30",
    badgeText: "text-amber-700 dark:text-amber-400",
    cardBorder: "hover:border-amber-400/50 dark:hover:border-amber-600/50",
    headerGradient: "from-orange-600 to-amber-600",
    order: 4,
  },
};

function getCategoryConfig(category: string) {
  return (
    CATEGORY_CONFIG[category] ?? {
      icon: Users,
      gradient: "from-slate-500/10 via-slate-500/5 to-transparent",
      badgeBg: "bg-slate-100 dark:bg-slate-900/30",
      badgeText: "text-slate-700 dark:text-slate-400",
      cardBorder: "hover:border-slate-400/50 dark:hover:border-slate-600/50",
      headerGradient: "from-slate-600 to-slate-700",
      order: 99,
    }
  );
}

export default async function ExecutiveDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get user's organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    redirect("/dashboard/onboarding");
  }

  // Fetch all AI assistants for this organization
  // category is a DB column not yet in generated types, so we cast the query
  const { data: advisors } = (await supabase
    .from("ai_assistants")
    .select("id, name, description, avatar_emoji, category, enabled, role")
    .eq("organization_id", profile.organization_id)
    .order("name")) as { data: Advisor[] | null };

  const allAdvisors = advisors ?? [];
  const totalCount = allAdvisors.length;

  // Group advisors by category
  const grouped: Record<string, Advisor[]> = {};
  for (const advisor of allAdvisors) {
    const cat = advisor.category || "Uncategorized";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(advisor);
  }

  // Sort categories by defined order
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const orderA = getCategoryConfig(a).order;
    const orderB = getCategoryConfig(b).order;
    return orderA - orderB;
  });

  // ── Empty State ──────────────────────────────────────────────
  if (totalCount === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20 flex items-center justify-center">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                AI Executive Suite
              </h1>
              <p className="text-muted-foreground mt-0.5">
                Your executive-level AI advisory board
              </p>
            </div>
          </div>

          {/* Empty CTA */}
          <Card className="border-dashed border-2 border-violet-300/50 dark:border-violet-700/50">
            <CardContent className="py-20">
              <div className="text-center max-w-lg mx-auto">
                <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20 flex items-center justify-center mb-6">
                  <Users className="h-10 w-10 text-violet-500 dark:text-violet-400" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  Your executive team hasn&apos;t been assembled yet
                </h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Activate your AI Executive Suite to get instant access to 15
                  specialist advisors across strategy, finance, legal, sales,
                  marketing, product, and more.
                </p>
                <Button
                  asChild
                  className="h-12 px-8 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 rounded-xl text-base"
                >
                  <Link href="/api/assistants/seed" prefetch={false}>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Activate Executive Suite
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  This will create 15 executive-level AI advisors in your
                  workspace.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Populated State ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20 flex items-center justify-center">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                AI Executive Suite
              </h1>
              <p className="text-muted-foreground mt-0.5">
                <span className="font-medium text-foreground">
                  {totalCount}
                </span>{" "}
                advisors across{" "}
                <span className="font-medium text-foreground">
                  {sortedCategories.length}
                </span>{" "}
                departments
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            className="rounded-xl h-11 px-5"
          >
            <Link href="/dashboard/assistants">
              <Users className="mr-2 h-4 w-4" />
              All Advisors
            </Link>
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {sortedCategories.map((category) => {
            const config = getCategoryConfig(category);
            const CategoryIcon = config.icon;
            const count = grouped[category].length;
            return (
              <Card
                key={category}
                className="border-border/50 bg-card/50 backdrop-blur-sm"
              >
                <CardContent className="py-4 px-5 flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-xl bg-gradient-to-br ${config.headerGradient} flex items-center justify-center flex-shrink-0`}
                  >
                    <CategoryIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold text-foreground leading-none">
                      {count}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {category}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Category Sections */}
        <div className="space-y-12">
          {sortedCategories.map((category) => {
            const config = getCategoryConfig(category);
            const CategoryIcon = config.icon;
            const categoryAdvisors = grouped[category];

            return (
              <section key={category}>
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className={`h-8 w-8 rounded-lg bg-gradient-to-br ${config.headerGradient} flex items-center justify-center`}
                  >
                    <CategoryIcon className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {category}
                  </h2>
                  <Badge
                    variant="secondary"
                    className="ml-1 text-xs font-medium"
                  >
                    {categoryAdvisors.length}
                  </Badge>
                </div>

                {/* Advisor Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {categoryAdvisors.map((advisor) => (
                    <Card
                      key={advisor.id}
                      className={`group relative overflow-hidden border-border/60 bg-card transition-all duration-200 hover:shadow-lg ${config.cardBorder}`}
                    >
                      {/* Subtle gradient background */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                      />

                      <CardHeader className="relative pb-2">
                        <div className="flex items-start gap-3">
                          <div className="text-3xl p-2 rounded-xl bg-muted/80 dark:bg-muted/40 group-hover:scale-105 transition-transform duration-200">
                            {advisor.avatar_emoji || "🤖"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base font-semibold text-foreground leading-tight">
                              {advisor.name}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                              {advisor.description || "AI executive advisor"}
                            </p>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="relative pt-0 space-y-3">
                        {/* Category Badge */}
                        <Badge
                          variant="outline"
                          className={`border-0 text-xs font-medium ${config.badgeBg} ${config.badgeText}`}
                        >
                          <CategoryIcon className="h-3 w-3 mr-1" />
                          {category}
                        </Badge>

                        {/* Chat Action */}
                        <Button
                          asChild
                          className={`w-full bg-gradient-to-r ${config.headerGradient} hover:opacity-90 text-white shadow-md transition-all duration-200 rounded-lg`}
                          size="sm"
                        >
                          <Link
                            href={`/dashboard/assistants/${advisor.id}/chat`}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Chat
                            <ArrowRight className="ml-auto h-4 w-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Disclaimer Footer */}
        <div className="mt-12">
          <Card className="border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex-shrink-0">
                  <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100 text-sm">
                    Professional Disclaimer
                  </h3>
                  <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                    AI advisors provide general guidance and educational
                    information. They are not substitutes for licensed
                    professionals. For legal, financial, HR, or specialized
                    matters, always consult qualified professionals.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
