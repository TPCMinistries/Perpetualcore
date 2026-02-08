"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Brain, Users, Check, AlertCircle, Loader2, Clock } from "lucide-react";
import Link from "next/link";

interface InvitationInfo {
  email: string;
  role: string;
  status: string;
  organizationName: string;
  expiresAt: string;
  createdAt: string;
}

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [requiresAuth, setRequiresAuth] = useState(false);

  useEffect(() => {
    fetchInvitation();
  }, [token]);

  async function fetchInvitation() {
    try {
      const res = await fetch(`/api/team/invite/accept?token=${token}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invitation not found");
        return;
      }

      setInvitation(data.invitation);
    } catch {
      setError("Failed to load invitation");
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    setAccepting(true);
    setError(null);

    try {
      const res = await fetch("/api/team/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (data.requiresAuth) {
        setRequiresAuth(true);
        setAccepting(false);
        return;
      }

      if (!res.ok) {
        setError(data.error || "Failed to accept invitation");
        setAccepting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch {
      setError("Network error. Please try again.");
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 dark:from-slate-950 dark:via-purple-950/20 dark:to-blue-950/20 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">
              {success
                ? "Welcome aboard!"
                : error && !invitation
                ? "Invalid Invitation"
                : "You're Invited!"}
            </CardTitle>
            <CardDescription>
              {success
                ? "Redirecting to your dashboard..."
                : error && !invitation
                ? error
                : "Join your team on Perpetual Core"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Success State */}
          {success && (
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground">
                You've joined {invitation?.organizationName}
              </p>
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
            </div>
          )}

          {/* Error State (no invitation found) */}
          {error && !invitation && !success && (
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-sm text-muted-foreground">{error}</p>
              <div className="flex flex-col gap-2">
                <Button asChild>
                  <Link href="/login">Go to Login</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Invitation Details */}
          {invitation && !success && (
            <>
              {/* Expired or already used */}
              {invitation.status !== "pending" ? (
                <div className="text-center space-y-4">
                  <div className="mx-auto h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Clock className="h-8 w-8 text-amber-600" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This invitation has{" "}
                    {invitation.status === "expired"
                      ? "expired"
                      : `already been ${invitation.status}`}
                    . Please ask your team admin to send a new one.
                  </p>
                  <Button asChild>
                    <Link href="/login">Go to Login</Link>
                  </Button>
                </div>
              ) : (
                <>
                  {/* Valid invitation */}
                  <div className="rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border border-purple-200 dark:border-purple-800 p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {invitation.organizationName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          You've been invited as{" "}
                          <span className="font-medium capitalize">
                            {invitation.role}
                          </span>
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Invited: {invitation.email}
                    </p>
                  </div>

                  {/* Needs auth */}
                  {requiresAuth ? (
                    <div className="space-y-3">
                      <p className="text-sm text-center text-muted-foreground">
                        Sign in or create an account to accept this invitation
                      </p>
                      <Button className="w-full" asChild>
                        <Link
                          href={`/login?redirect=/invite/${token}`}
                        >
                          Sign In
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <Link
                          href={`/signup?redirect=/invite/${token}&email=${encodeURIComponent(invitation.email)}`}
                        >
                          Create Account
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {error && (
                        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                          <p className="text-sm text-red-700 dark:text-red-300">
                            {error}
                          </p>
                        </div>
                      )}
                      <Button
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        onClick={handleAccept}
                        disabled={accepting}
                      >
                        {accepting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Joining...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Accept Invitation
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full"
                        asChild
                      >
                        <Link href="/">Decline</Link>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
