import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "./SignupForm";

export const metadata = {
  title: "Create an account | Perpetual Core",
};

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create an account"
      subtitle="Enter your details to get started with Perpetual Core"
      productCopyKey="signUp"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
