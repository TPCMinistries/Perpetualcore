import { AuthShell } from "@/components/auth/AuthShell";
import { UpdatePasswordForm } from "./UpdatePasswordForm";

export const metadata = {
  title: "Set new password | Perpetual Core",
};

export default function UpdatePasswordPage() {
  return (
    <AuthShell
      title="Set new password"
      subtitle="Enter your new password below."
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}
