import Link from "next/link";
import { LoginForm } from "./LoginForm";

interface LoginPageProps {
  searchParams: Promise<{ message?: string; error?: string; redirectTo?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold text-white">Welcome back</h2>
      <p className="mb-6 text-sm text-[#8e9297]">Sign in to your account</p>

      {params.message === "check-email" && (
        <div className="mb-4 rounded-md bg-[#5865f2]/20 border border-[#5865f2]/40 px-4 py-3 text-sm text-[#b9bbbe]">
          Check your email for a confirmation link before signing in.
        </div>
      )}

      {params.error && (
        <div className="mb-4 rounded-md bg-[#ed4245]/20 border border-[#ed4245]/40 px-4 py-3 text-sm text-[#ed4245]">
          Authentication failed. Please try again.
        </div>
      )}

      <LoginForm redirectTo={params.redirectTo} />

      <p className="mt-6 text-center text-sm text-[#8e9297]">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-[#5865f2] hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
