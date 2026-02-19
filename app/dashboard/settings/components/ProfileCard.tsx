"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  Camera,
  Save,
  Key,
  Lock,
  Loader2,
  Crown,
  Zap,
} from "lucide-react";
import { UserProfile } from "../hooks/useSettings";

interface ProfileCardProps {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  isSaving: boolean;
  onSaveProfile: () => Promise<void>;
  onOpenPasswordDialog: () => void;
}

export function ProfileCard({
  profile,
  setProfile,
  isSaving,
  onSaveProfile,
  onOpenPasswordDialog,
}: ProfileCardProps) {
  const getRoleBadge = (role: string) => {
    const badges = {
      admin: { label: "Admin", icon: Crown },
      member: { label: "Member", icon: User },
      owner: { label: "Owner", icon: Zap },
    };
    return badges[role as keyof typeof badges] || badges.member;
  };

  const badge = getRoleBadge(profile.role);
  const BadgeIcon = badge.icon;

  return (
    <div className="space-y-6">
      <Card className="border-border dark:border-border bg-card shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-slate-900 dark:bg-muted flex items-center justify-center">
            <User className="h-5 w-5 text-white dark:text-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground dark:text-white">Profile Information</h2>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">Update your personal details</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-foreground dark:text-muted-foreground font-medium">Full Name</Label>
              <Input
                id="fullName"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="border-border dark:border-border focus:border-violet-500 dark:focus:border-violet-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground dark:text-muted-foreground font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="border-border dark:border-border bg-muted dark:bg-card"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={onSaveProfile}
              disabled={isSaving}
              className="bg-slate-900 dark:bg-muted hover:bg-slate-800 dark:hover:bg-muted text-white dark:text-foreground shadow-lg px-6"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-border dark:border-border bg-card shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-slate-900 dark:bg-muted flex items-center justify-center">
            <Lock className="h-5 w-5 text-white dark:text-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground dark:text-white">Password & Authentication</h2>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">Manage your password and security settings</p>
          </div>
        </div>

        <Button
          variant="outline"
          className="border-border dark:border-border"
          onClick={onOpenPasswordDialog}
        >
          <Key className="h-4 w-4 mr-2" />
          Change Password
        </Button>
      </Card>
    </div>
  );
}
