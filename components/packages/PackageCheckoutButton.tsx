"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type PackageId =
  | "software-access"
  | "guided-setup"
  | "first-workflow"
  | "operating-lane-deposit";

export function PackageCheckoutButton({
  packageId,
  leadId,
  children,
  variant = "default",
}: {
  packageId: PackageId;
  leadId?: string;
  children: React.ReactNode;
  variant?: "default" | "outline";
}) {
  const [isLoading, setIsLoading] = useState(false);

  async function startCheckout() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/packages/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, leadId }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || "Unable to start checkout.");
      }

      if (!data.checkout_url) {
        throw new Error("Checkout URL missing.");
      }

      window.location.href = data.checkout_url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to start checkout.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={startCheckout}
      disabled={isLoading}
      variant={variant}
      className={
        variant === "outline"
          ? "mt-auto text-sm font-medium h-10 px-5 shadow-none rounded-[6px]"
          : "mt-auto text-sm font-medium h-10 px-5 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
      }
    >
      {isLoading ? "Opening checkout..." : children}
      {!isLoading && <ArrowRight className="ml-2 h-3.5 w-3.5" />}
    </Button>
  );
}
