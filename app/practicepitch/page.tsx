import { redirect } from 'next/navigation';

// Serves the Kept Count Pitch Gym (static, self-contained) at a clean URL.
export default function PracticePitchPage() {
  redirect('/practicepitch.html');
}
