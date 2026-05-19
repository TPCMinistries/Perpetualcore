import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata = {
  title: "Reset your password | Perpetual Core",
};

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email address and we'll send you a link to reset your password."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
