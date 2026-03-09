import Link from "next/link";
import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold text-white">Create an account</h2>
      <p className="mb-6 text-sm text-[#8e9297]">Join GoonRoom today</p>

      <RegisterForm />

      <p className="mt-6 text-center text-sm text-[#8e9297]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-[#5865f2] hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
