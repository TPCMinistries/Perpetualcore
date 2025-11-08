"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  Link as LinkIcon,
  Copy,
  Check,
  Mail,
  MessageSquare,
  Share2,
  Gift,
  Sparkles,
  Twitter,
  Linkedin,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function SharePage() {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [inviteLink, setInviteLink] = useState("");
  const [stats, setStats] = useState({
    invitesSent: 0,
    teamMembers: 0,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*, organization:organizations(*)")
        .eq("id", user.id)
        .single();

      setUserProfile(profile);

      // Generate personal invite link (could be based on referral code in future)
      const baseUrl = window.location.origin;
      setInviteLink(`${baseUrl}/signup?ref=${user.id.substring(0, 8)}`);

      // Set default invite message
      setMessage(
        `Hey! I've been using Perpetual Core and it's incredible - it's like having an infinite memory AI brain. You can upload any document and AI instantly remembers and understands everything.\n\nThought you might find it useful. Check it out!`
      );
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = async () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          message,
          referralLink: inviteLink,
        }),
      });

      if (response.ok) {
        toast.success(`Invitation sent to ${email}!`);
        setEmail("");
        setStats({ ...stats, invitesSent: stats.invitesSent + 1 });
      } else {
        toast.error("Failed to send invitation");
      }
    } catch (error) {
      console.error("Error sending invite:", error);
      toast.error("Failed to send invitation");
    } finally {
      setIsSending(false);
    }
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(
      "Just got an infinite memory AI brain with @PerpetualCore. Upload documents, ask questions, never forget anything. Pretty incredible 🧠✨"
    );
    const url = encodeURIComponent(inviteLink);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(inviteLink);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20">
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 items-center justify-center mb-4 shadow-lg">
            <Share2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Share Your AI Brain
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Your infinite memory AI gets even better when you collaborate. Invite teammates, students, or
            friends to experience it.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {stats.invitesSent}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Invites Sent</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {stats.teamMembers}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Team Members</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-green-200 dark:border-green-800">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">∞</div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Shared Docs</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/30 border-indigo-200 dark:border-indigo-800">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                <Sparkles className="h-8 w-8 mx-auto" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Infinite Memory</p>
            </CardContent>
          </Card>
        </div>

        {/* Share Link */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Your Personal Invite Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Share this link with anyone. When they sign up, you'll both unlock collaboration features.
            </p>
            <div className="flex gap-2">
              <Input value={inviteLink} readOnly className="font-mono text-sm bg-slate-50 dark:bg-slate-900" />
              <Button onClick={handleCopyLink} variant="outline" className="shrink-0">
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            {/* Social Share Buttons */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-sm font-medium mb-3 text-slate-700 dark:text-slate-300">
                Share on social media:
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={shareToTwitter}
                  variant="outline"
                  className="flex-1 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                >
                  <Twitter className="h-4 w-4 mr-2 text-blue-500" />
                  Twitter
                </Button>
                <Button
                  onClick={shareToLinkedIn}
                  variant="outline"
                  className="flex-1 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                >
                  <Linkedin className="h-4 w-4 mr-2 text-blue-700" />
                  LinkedIn
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Invite */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Send Personal Invite
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSending) {
                    handleSendInvite();
                  }
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-slate-700 dark:text-slate-300">
                Personal Message (Optional)
              </label>
              <Textarea
                placeholder="Add a personal note..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <Button
              onClick={handleSendInvite}
              disabled={isSending || !email}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isSending ? (
                <>Sending...</>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invite
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Benefits of Inviting */}
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Why Invite Others?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Shared Knowledge</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Collaborate on documents and conversations with your team
                </p>
              </div>
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                  <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Smarter AI</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  AI becomes more powerful with shared context and knowledge
                </p>
              </div>
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-2">
                  <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Team Conversations</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Create shared AI conversations for projects and collaboration
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA to Team Settings */}
        <Card className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1 text-slate-900 dark:text-white">
                  Need more team management?
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Manage team members, roles, and permissions
                </p>
              </div>
              <Button variant="outline" onClick={() => (window.location.href = "/dashboard/settings/team")}>
                <Users className="mr-2 h-4 w-4" />
                Team Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
