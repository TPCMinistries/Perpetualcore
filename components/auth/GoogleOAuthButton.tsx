"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { signInWithGoogle } from "@/lib/auth/actions";
import { safeAuthNext } from "@/lib/auth/redirects";
import { Button } from "@/components/ui/button";

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M21.6 12.227c0-.709-.064-1.391-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.996 3.018v2.509h3.232c1.891-1.741 2.982-4.305 2.982-7.35Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.041.955-3.386.955-2.605 0-4.809-1.759-5.596-4.123H3.064v2.591A9.996 9.996 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.404 13.9A6.01 6.01 0 0 1 6.091 12c0-.659.114-1.3.313-1.9V7.509h-3.34A9.996 9.996 0 0 0 2 12c0 1.614.386 3.141 1.064 4.491L6.404 13.9Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C16.959 2.991 14.695 2 12 2a9.996 9.996 0 0 0-8.936 5.509l3.34 2.591C7.191 7.736 9.395 5.977 12 5.977Z"
      />
    </svg>
  );
}

export function GoogleOAuthButton() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startGoogleSignIn() {
    setIsLoading(true);
    setError(null);

    try {
      const requestedNext =
        safeAuthNext(searchParams.get("next")) ??
        safeAuthNext(searchParams.get("redirect"));
      const result = await signInWithGoogle(requestedNext ?? undefined);

      if (result.error || !result.url) {
        setError(result.error || "Google sign-in is temporarily unavailable.");
        setIsLoading(false);
        return;
      }

      window.location.assign(result.url);
    } catch {
      setError("Google sign-in is temporarily unavailable. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full cursor-pointer bg-white"
        disabled={isLoading}
        onClick={startGoogleSignIn}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <span className="mr-2" aria-hidden="true">
            <GoogleMark />
          </span>
        )}
        {isLoading ? "Opening Google…" : "Continue with Google"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
