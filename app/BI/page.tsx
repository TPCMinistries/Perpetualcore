import { redirect } from 'next/navigation';

// Serves the BlackIvy Meeting Gym (static, self-contained, passcode-gated
// client-side) at a clean URL. Private prep material — noindex'd; keep out
// of any sitemap or nav.
export default function BIPage() {
  redirect('/BI.html');
}
