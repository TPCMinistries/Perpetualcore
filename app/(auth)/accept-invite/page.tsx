/**
 * /accept-invite?token=... — Accept an org invite.
 *
 * Server shell wraps AcceptInviteForm (client component) in Suspense.
 * Suspense is required to prevent Next.js from throwing a build-time error
 * for `useSearchParams()` usage inside the client form.
 *
 * The form reads the token from the query string, validates it via
 * GET /api/orgs/invites/validate, then branches to signup or login.
 * On success, redirects to /org/[orgId].
 */

import { Suspense } from 'react';
import { AcceptInviteForm } from '@/components/rfp/AcceptInviteForm';

export const metadata = {
  title: 'Accept Invite | Perpetual Core',
};

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Suspense
          fallback={
            <div className="text-center">
              <p className="text-zinc-400 text-sm">Loading invite...</p>
            </div>
          }
        >
          <AcceptInviteForm />
        </Suspense>
      </div>
    </div>
  );
}
