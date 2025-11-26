import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
      <SignupForm />
    </div>
  );
}

