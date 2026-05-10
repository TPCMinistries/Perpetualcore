import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { SocialProofBanner } from "@/components/landing/SocialProofBanner";
import { BentoFeatures } from "@/components/landing/BentoFeatures";
import { InteractiveChatDemo } from "@/components/landing/InteractiveChatDemo";
import { ComparisonTable } from "@/components/landing/ComparisonTable";
import { ExecSuiteShowcase } from "@/components/landing/ExecSuiteShowcase";
import { UseCases } from "@/components/landing/UseCases";
import { SecuritySection } from "@/components/landing/SecuritySection";
import { TrustBadges } from "@/components/landing/TrustBadges";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PricingTeaser } from "@/components/landing/PricingTeaser";
import { FounderStory } from "@/components/landing/FounderStory";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <PageViewTracker />
      <Navbar />

      {/* Above the fold */}
      <HeroSection />
      <SocialProofBanner />

      {/* Product showcase */}
      <BentoFeatures />
      <InteractiveChatDemo />
      <ComparisonTable />

      {/* Differentiation */}
      <ExecSuiteShowcase />
      <UseCases />

      {/* Trust & credibility */}
      <SecuritySection />
      <TrustBadges />

      {/* How it works & proof */}
      <HowItWorks />
      <FounderStory />

      {/* Conversion */}
      <PricingTeaser />
      <FinalCTA />

      <Footer />
    </div>
  );
}
