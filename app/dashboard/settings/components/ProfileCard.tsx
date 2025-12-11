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
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
            <User className="h-5 w-5 text-white dark:text-slate-900" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Profile Information</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Update your personal details</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-700 dark:text-slate-300 font-medium">Full Name</Label>
              <Input
                id="fullName"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="border-slate-300 dark:border-slate-700 focus:border-violet-500 dark:focus:border-violet-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={onSaveProfile}
              disabled={isSaving}
              className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-lg px-6"
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

      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
            <Lock className="h-5 w-5 text-white dark:text-slate-900" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Password & Authentication</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Manage your password and security settings</p>
          </div>
        </div>

        <Button
          variant="outline"
          className="border-slate-300 dark:border-slate-700"
          onClick={onOpenPasswordDialog}
        >
          <Key className="h-4 w-4 mr-2" />
          Change Password
        </Button>
      </Card>
    </div>
  );
}
