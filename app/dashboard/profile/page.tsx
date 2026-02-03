"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  User,
  Mail,
  Building2,
  Phone,
  MapPin,
  Globe,
  Camera,
  Save,
  Loader2,
  Shield,
  Bell,
  Palette,
  Link2,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DashboardPageWrapper, DashboardHeader } from "@/components/ui/dashboard-header";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProfileData {
  full_name: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  location: string | null;
  bio: string | null;
  website: string | null;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: "easeOut",
    },
  }),
};

const quickLinks = [
  {
    label: "Security",
    description: "Password & 2FA settings",
    icon: Shield,
    href: "/dashboard/settings/security",
    color: "emerald",
  },
  {
    label: "Notifications",
    description: "Email & push preferences",
    icon: Bell,
    href: "/dashboard/settings/notifications",
    color: "amber",
  },
  {
    label: "Appearance",
    description: "Theme & display options",
    icon: Palette,
    href: "/dashboard/settings/appearance",
    color: "violet",
  },
  {
    label: "Integrations",
    description: "Connected services",
    icon: Link2,
    href: "/dashboard/settings/integrations",
    color: "blue",
  },
];

const linkColors = {
  emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  violet: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
  blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    email: "",
    avatar_url: null,
    phone: null,
    company: null,
    title: null,
    location: null,
    bio: null,
    website: null,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Not authenticated");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setProfile({
        full_name: data.full_name || "",
        email: user.email || "",
        avatar_url: data.avatar_url,
        phone: data.phone,
        company: data.company,
        title: data.title,
        location: data.location,
        bio: data.bio,
        website: data.website,
      });
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          company: profile.company,
          title: profile.title,
          location: profile.location,
          bio: profile.bio,
          website: profile.website,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const completedFields = [
    profile.full_name,
    profile.phone,
    profile.company,
    profile.title,
    profile.location,
    profile.bio,
    profile.website,
  ].filter(Boolean).length;

  const totalFields = 7;
  const completionPercent = Math.round((completedFields / totalFields) * 100);

  if (loading) {
    return (
      <DashboardPageWrapper maxWidth="6xl">
        <div className="space-y-6">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-[500px] rounded-xl lg:col-span-2" />
          </div>
        </div>
      </DashboardPageWrapper>
    );
  }

  return (
    <DashboardPageWrapper maxWidth="6xl">
      <DashboardHeader
        title="Profile"
        subtitle="Manage your personal information and account settings"
        icon={User}
        iconColor="violet"
        stats={[
          { label: "fields completed", value: `${completedFields}/${totalFields}` },
        ]}
        actions={[
          {
            label: "Save Changes",
            icon: Save,
            onClick: handleSave,
            variant: "primary",
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Avatar Card */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <CardTitle className="text-base">Profile Picture</CardTitle>
                <CardDescription>Your public avatar</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8 space-y-4">
                <div className="relative">
                  <Avatar className="h-32 w-32 ring-4 ring-white dark:ring-slate-800 shadow-xl">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                      {getInitials(profile.full_name || "U")}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 p-2 rounded-full bg-violet-600 text-white shadow-lg hover:bg-violet-700 transition-colors">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {profile.full_name || "Your Name"}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {profile.title || "Add your title"}
                  </p>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  JPG, PNG or GIF. Max 5MB.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Profile Completion */}
          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Card>
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <CardTitle className="text-base">Profile Completion</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {completedFields} of {totalFields} fields
                    </span>
                    <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                      {completionPercent}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${completionPercent}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  {completionPercent < 100 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Complete your profile for better collaboration
                    </p>
                  )}
                  {completionPercent === 100 && (
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-medium">Profile complete!</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Card>
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <CardTitle className="text-base">Quick Settings</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {quickLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <a
                        key={link.label}
                        href={link.href}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                      >
                        <div className={cn("p-2 rounded-lg", linkColors[link.color as keyof typeof linkColors])}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {link.label}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {link.description}
                          </p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Main Form */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <CardTitle className="text-base">Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Name & Email */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-slate-700 dark:text-slate-300">
                    Full Name <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="full_name"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      value={profile.email}
                      disabled
                      className="pl-10 h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Managed through authentication settings
                  </p>
                </div>
              </div>

              {/* Phone & Location */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="phone"
                      value={profile.phone || ""}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-slate-700 dark:text-slate-300">
                    Location
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="location"
                      value={profile.location || ""}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                      placeholder="San Francisco, CA"
                    />
                  </div>
                </div>
              </div>

              {/* Company & Title */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-slate-700 dark:text-slate-300">
                    Company
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="company"
                      value={profile.company || ""}
                      onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                      className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                      placeholder="Acme Inc"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-slate-700 dark:text-slate-300">
                    Job Title
                  </Label>
                  <Input
                    id="title"
                    value={profile.title || ""}
                    onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                    className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    placeholder="Product Manager"
                  />
                </div>
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website" className="text-slate-700 dark:text-slate-300">
                  Website
                </Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="website"
                    value={profile.website || ""}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-slate-700 dark:text-slate-300">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  value={profile.bio || ""}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Brief description for your profile. Max 500 characters.
                </p>
              </div>

              {/* Mobile Save Button */}
              <div className="flex justify-end pt-4 lg:hidden">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardPageWrapper>
  );
}
