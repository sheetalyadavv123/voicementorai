import { Suspense } from "react";
import { AuthForm } from "@/features/auth/components/auth-form";

export const metadata = {
  title: "Sign in — Voice Mentor AI",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-12">
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}
