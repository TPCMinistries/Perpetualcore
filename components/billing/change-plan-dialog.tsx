"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, AlertCircle, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ChangePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: string;
  targetPlan: string;
  interval: "monthly" | "yearly";
  onSuccess: () => void;
}

const PLAN_PRICES = {
  free: 0,
  pro: { monthly: 29, yearly: 278 },
  team: { monthly: 99, yearly: 950 },
};

const PLAN_NAMES = {
  free: "Free",
  pro: "Pro",
  team: "Team",
};

export function ChangePlanDialog({
  open,
  onOpenChange,
  currentPlan,
  targetPlan,
  interval,
  onSuccess,
}: ChangePlanDialogProps) {
  const [loading, setLoading] = useState(false);
  const [changeAt, setChangeAt] = useState<"immediate" | "period_end">("immediate");

  const isUpgrade =
    (currentPlan === "free" && (targetPlan === "pro" || targetPlan === "team")) ||
    (currentPlan === "pro" && targetPlan === "team");

  const isDowngrade = !isUpgrade && targetPlan !== currentPlan;

  const getCurrentPrice = () => {
    if (currentPlan === "free") return 0;
    const plan = currentPlan as "pro" | "team";
    return PLAN_PRICES[plan][interval];
  };

  const getTargetPrice = () => {
    if (targetPlan === "free") return 0;
    const plan = targetPlan as "pro" | "team";
    return PLAN_PRICES[plan][interval];
  };

  const handleChangePlan = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/stripe/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPlan: targetPlan,
          interval,
          changeAt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change plan");
      }

      toast.success(data.message);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Change plan error:", error);
      toast.error(error.message || "Failed to change plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isUpgrade && "Upgrade Plan"}
            {isDowngrade && "Downgrade Plan"}
            {!isUpgrade && !isDowngrade && "Change Plan"}
          </DialogTitle>
          <DialogDescription>
            You're changing from{" "}
            <span className="font-semibold">{PLAN_NAMES[currentPlan as keyof typeof PLAN_NAMES]}</span> to{" "}
            <span className="font-semibold">{PLAN_NAMES[targetPlan as keyof typeof PLAN_NAMES]}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Price Comparison */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Plan:</span>
              <span className="font-semibold">
                {PLAN_NAMES[currentPlan as keyof typeof PLAN_NAMES]} - ${getCurrentPrice()}/{interval === "monthly" ? "mo" : "yr"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">New Plan:</span>
              <span className="font-semibold text-primary">
                {PLAN_NAMES[targetPlan as keyof typeof PLAN_NAMES]} - ${getTargetPrice()}/{interval === "monthly" ? "mo" : "yr"}
              </span>
            </div>
            {isUpgrade && (
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm text-muted-foreground">Difference:</span>
                <span className="font-semibold text-green-600">
                  +${getTargetPrice() - getCurrentPrice()}/{interval === "monthly" ? "mo" : "yr"}
                </span>
              </div>
            )}
            {isDowngrade && (
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm text-muted-foreground">Savings:</span>
                <span className="font-semibold text-green-600">
                  ${getCurrentPrice() - getTargetPrice()}/{interval === "monthly" ? "mo" : "yr"}
                </span>
              </div>
            )}
          </div>

          {/* Change Timing */}
          {currentPlan !== "free" && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">When should this change take effect?</Label>
              <RadioGroup
                value={changeAt}
                onValueChange={(value) => setChangeAt(value as "immediate" | "period_end")}
                className="space-y-3"
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="immediate" id="immediate" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="immediate" className="font-medium cursor-pointer">
                      Immediately
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {isUpgrade
                        ? "You'll be charged a prorated amount for the upgrade and get immediate access to new features."
                        : "Your subscription will change now and you'll receive a prorated credit."}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="period_end" id="period_end" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="period_end" className="font-medium cursor-pointer">
                      At end of billing period
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {isUpgrade
                        ? "Continue using your current plan until the end of your billing period, then upgrade."
                        : "Keep your current plan's features until your billing period ends."}
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Upgrade Info */}
          {isUpgrade && (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>
                You'll gain access to additional features and higher limits with the{" "}
                {PLAN_NAMES[targetPlan as keyof typeof PLAN_NAMES]} plan.
              </AlertDescription>
            </Alert>
          )}

          {/* Downgrade Warning */}
          {isDowngrade && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {targetPlan === "free"
                  ? "You'll lose access to paid features and your data may be subject to free plan limits."
                  : "Some features may become unavailable if they exceed your new plan's limits."}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleChangePlan} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {isUpgrade && "Upgrade Plan"}
                {isDowngrade && "Downgrade Plan"}
                {!isUpgrade && !isDowngrade && "Change Plan"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
