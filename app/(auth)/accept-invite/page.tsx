/**
 * /accept-invite?token=... — Accept an org invite.
 *
 * Server shell wraps AcceptInviteForm in <AuthShell> so it picks up the
 * host-aware chrome (dark+emerald on rfp.*, default elsewhere). The form
 * itself runs its own state machine for loading / choose / signup / login
 * / accepting / done, and renders dynamic copy inside the shell body.
 */

import { Suspense } from 'react';
import { AcceptInviteForm } from '@/components/rfp/AcceptInviteForm';
import { AuthShell } from '@/components/auth/AuthShell';

export const metadata = {
  title: 'Accept Invite | Perpetual Core',
};

export default function AcceptInvitePage() {
  return (
    <AuthShell
      title="Accept your invite"
      subtitle="Join your team and start capturing the right opportunities."
    >
      <Suspense
        fallback={
          <p className="text-center text-sm text-muted-foreground">
            Loading invite...
          </p>
        }
      >
        <AcceptInviteForm />
      </Suspense>
    </AuthShell>
  );
}
