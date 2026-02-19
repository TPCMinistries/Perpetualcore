"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, Globe, CreditCard } from "lucide-react";

interface OrganizationSectionProps {
  onManageTeam: () => void;
  onViewBilling: () => void;
}

export function OrganizationSection({ onManageTeam, onViewBilling }: OrganizationSectionProps) {
  return (
    <Card className="border-border dark:border-border bg-card shadow-xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-slate-900 dark:bg-muted flex items-center justify-center">
          <Building2 className="h-5 w-5 text-white dark:text-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground dark:text-white">Organization Settings</h2>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">Manage your organization and team</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-6">
          <Card className="border-border dark:border-border bg-muted dark:bg-card/50 p-6">
            <Users className="h-8 w-8 text-foreground dark:text-foreground mb-3" />
            <p className="text-2xl font-bold text-foreground dark:text-white">5</p>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">Team Members</p>
          </Card>
          <Card className="border-border dark:border-border bg-muted dark:bg-card/50 p-6">
            <Globe className="h-8 w-8 text-foreground dark:text-foreground mb-3" />
            <p className="text-2xl font-bold text-foreground dark:text-white">3</p>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">Active Spaces</p>
          </Card>
          <Card className="border-border dark:border-border bg-muted dark:bg-card/50 p-6">
            <CreditCard className="h-8 w-8 text-foreground dark:text-foreground mb-3" />
            <p className="text-2xl font-bold text-foreground dark:text-white">Pro</p>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">Current Plan</p>
          </Card>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onManageTeam}
          >
            <Users className="h-4 w-4 mr-2" />
            Manage Team
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={onViewBilling}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            View Billing
          </Button>
        </div>
      </div>
    </Card>
  );
}
