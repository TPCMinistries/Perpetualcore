import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Package Purchased — Perpetual Core",
  description: "Your Perpetual Core package payment was received.",
};

export default function PackageSuccessPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="container mx-auto px-6 sm:px-8 py-24 sm:py-32">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-8">
            <span aria-hidden className="block h-1.5 w-1.5 bg-primary" />
            <p className="eyebrow !text-foreground/70">Payment received</p>
          </div>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-[-0.045em] leading-[0.98] text-foreground mb-8">
            You are in.
          </h1>
          <p className="text-lg text-muted-foreground leading-[1.65] mb-10">
            Your package payment was received through Stripe. We will follow up with the intake
            details and next steps. If you used a different email at checkout, reply from the inbox
            you want us to use for onboarding.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="text-sm font-medium h-10 px-5 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
              <Link href="/contact-sales?intent=post-payment-intake">
                Send intake context <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="text-sm font-medium h-10 px-5 shadow-none rounded-[6px]">
              <Link href="/packages">Back to packages</Link>
            </Button>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
