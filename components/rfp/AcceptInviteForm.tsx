'use client';

/**
 * AcceptInviteForm — Client form for accepting an org invite via token URL.
 *
 * Flow:
 *  1. On mount: reads ?token= from search params
 *  2. Calls GET /api/orgs/invites/validate to fetch invite metadata
 *  3. If already logged in as the invited email → auto-calls acceptNow()
 *  4. If logged in as a DIFFERENT email → shows email mismatch error
 *  5. Otherwise → "choose" step: Create account | I have an account
 *  6. Signup branch: signUp() → acceptNow() (trigger also auto-accepts on INSERT)
 *  7. Login branch: signInWithPassword() → acceptNow()
 *  8. acceptNow(): POST /api/orgs/invites/accept → redirect to /org/[orgId]
 *
 * Ported from ldc-command-center accept-invite page; adapted to rfp_* namespace,
 * four-role model, and /org/[orgId] redirect (not /workspace/[id]).
 */

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

// ── Role display labels for the four-role model ───────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  owner:    'Owner',
  writer:   'Writer',
  reviewer: 'Reviewer',
  viewer:   'Viewer',
};

// ── State machine steps ───────────────────────────────────────────────────────

type Step = 'loading' | 'choose' | 'signup' | 'login' | 'accepting' | 'done' | 'error';

interface InviteInfo {
  org_name: string;
  org_id: string;
  email: string;
  role: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [step, setStep] = useState<Step>('loading');
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Guard against acceptNow being called twice in the auto-login path
  const acceptingRef = useRef(false);

  const acceptNow = async () => {
    if (acceptingRef.current) return;
    acceptingRef.current = true;
    setStep('accepting');

    const res = await fetch('/api/orgs/invites/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await res.json() as { orgId?: string; error?: string };

    if (!res.ok) {
      setStep('error');
      setError(data.error ?? 'Could not accept the invite.');
      acceptingRef.current = false;
      return;
    }

    setStep('done');
    router.push(`/org/${data.orgId}`);
  };

  useEffect(() => {
    if (!token) {
      setError('Missing invite token. Check the link and try again.');
      setStep('error');
      return;
    }

    (async () => {
      // Validate the token
      const res = await fetch(`/api/orgs/invites/validate?token=${encodeURIComponent(token)}`);
      const data = await res.json() as {
        valid: boolean;
        reason?: string;
        invite?: { org_id: string; org_name: string; email: string; role: string };
      };

      if (!data.valid) {
        const reasonMap: Record<string, string> = {
          not_found:   'This invite link is invalid.',
          already_used: 'This invite has already been accepted.',
          expired:     'This invite link has expired.',
          missing_token: 'No invite token found in the link.',
        };
        setError(reasonMap[data.reason ?? ''] ?? `This invite is ${data.reason ?? 'invalid'}.`);
        setStep('error');
        return;
      }

      const inv = data.invite!;
      setInvite(inv);

      // Check if already logged in
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        if (user.email?.toLowerCase() === inv.email.toLowerCase()) {
          // Correct user is already logged in — accept immediately
          await acceptNow();
        } else {
          setError(
            `This invite is for ${inv.email}. You're currently signed in as ${user.email ?? 'a different account'}. Please sign out first.`,
          );
          setStep('error');
        }
      } else {
        setStep('choose');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── Signup handler ──────────────────────────────────────────────────────────

  const onSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!invite || submitting) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: signErr } = await supabase.auth.signUp({
      email:    invite.email,
      password,
      options:  { data: { full_name: fullName } },
    });

    if (signErr) {
      setError(signErr.message);
      setSubmitting(false);
      return;
    }

    // The rfp_handle_new_user_invites trigger already created the membership on signup.
    // We still call acceptNow() to: (a) mark the invite row as accepted, (b) get the orgId
    // for the redirect. The accept endpoint is idempotent — no double-membership issue.
    await acceptNow();
    setSubmitting(false);
  };

  // ── Login handler ───────────────────────────────────────────────────────────

  const onLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!invite || submitting) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: loginErr } = await supabase.auth.signInWithPassword({
      email:    invite.email,
      password,
    });

    if (loginErr) {
      setError(loginErr.message);
      setSubmitting(false);
      return;
    }

    await acceptNow();
    setSubmitting(false);
  };

  // ── Render states ───────────────────────────────────────────────────────────

  if (step === 'loading') {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400 text-sm">Validating invite...</p>
      </div>
    );
  }

  if (step === 'accepting' || step === 'done') {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-300 text-sm">
          {step === 'done' ? 'Joined! Redirecting...' : `Joining ${invite?.org_name ?? 'the org'}...`}
        </p>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 text-center space-y-4">
        <p className="text-lg font-semibold text-zinc-100">Invite Error</p>
        <p className="text-sm text-zinc-400">{error ?? 'Something went wrong.'}</p>
        <Button
          variant="outline"
          onClick={() => router.push('/login')}
          className="mt-2"
        >
          Go to login
        </Button>
      </div>
    );
  }

  if (step === 'choose' && invite) {
    return (
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-zinc-100">You&apos;re Invited</h1>
          <p className="text-zinc-400 text-sm">
            Join{' '}
            <span className="text-emerald-400 font-semibold">{invite.org_name}</span>{' '}
            as{' '}
            <span className="text-zinc-200 font-medium">
              {ROLE_LABELS[invite.role] ?? invite.role}
            </span>
          </p>
          <p className="text-zinc-500 text-xs">{invite.email}</p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setStep('signup')}
          >
            Create account &amp; join
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setStep('login')}
          >
            I already have an account
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'signup') {
    return (
      <form onSubmit={onSignup} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 space-y-4">
        <h1 className="text-xl font-bold text-zinc-100">Create your account</h1>
        {invite && (
          <p className="text-zinc-400 text-sm">
            Joining{' '}
            <span className="text-emerald-400 font-medium">{invite.org_name}</span>{' '}
            as{' '}
            <span className="text-zinc-200">{ROLE_LABELS[invite.role] ?? invite.role}</span>
          </p>
        )}

        <div className="space-y-1">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            required
            autoComplete="name"
            className="bg-zinc-800 border-zinc-700"
          />
        </div>

        <div className="space-y-1">
          <Label>Email</Label>
          <Input value={invite?.email ?? ''} disabled className="bg-zinc-800 border-zinc-700 opacity-60" />
        </div>

        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password (min 8 chars)"
            required
            minLength={8}
            autoComplete="new-password"
            className="bg-zinc-800 border-zinc-700"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button
          type="submit"
          disabled={submitting || !fullName || !password}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {submitting ? 'Creating account...' : 'Sign up & join'}
        </Button>

        <p className="text-xs text-zinc-500 text-center">
          Already have an account?{' '}
          <button
            type="button"
            className="underline text-zinc-400 hover:text-zinc-300"
            onClick={() => { setStep('login'); setError(null); }}
          >
            Sign in instead
          </button>
        </p>
      </form>
    );
  }

  if (step === 'login') {
    return (
      <form onSubmit={onLogin} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 space-y-4">
        <h1 className="text-xl font-bold text-zinc-100">Sign in to join</h1>
        {invite && (
          <p className="text-zinc-400 text-sm">
            Joining{' '}
            <span className="text-emerald-400 font-medium">{invite.org_name}</span>{' '}
            as{' '}
            <span className="text-zinc-200">{ROLE_LABELS[invite.role] ?? invite.role}</span>
          </p>
        )}

        <div className="space-y-1">
          <Label>Email</Label>
          <Input value={invite?.email ?? ''} disabled className="bg-zinc-800 border-zinc-700 opacity-60" />
        </div>

        <div className="space-y-1">
          <Label htmlFor="password_login">Password</Label>
          <Input
            id="password_login"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            required
            autoComplete="current-password"
            className="bg-zinc-800 border-zinc-700"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button
          type="submit"
          disabled={submitting || !password}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {submitting ? 'Signing in...' : 'Sign in & join'}
        </Button>

        <p className="text-xs text-zinc-500 text-center">
          New here?{' '}
          <button
            type="button"
            className="underline text-zinc-400 hover:text-zinc-300"
            onClick={() => { setStep('signup'); setError(null); }}
          >
            Create account instead
          </button>
        </p>
      </form>
    );
  }

  // Exhaustive fallback (should never reach here)
  return null;
}
