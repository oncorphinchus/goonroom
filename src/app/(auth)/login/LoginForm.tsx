"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/features/auth/actions";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  redirectTo: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  redirectTo?: string;
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { redirectTo: redirectTo ?? "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    const result = await signIn({
      email: data.email,
      password: data.password,
      redirectTo: data.redirectTo || undefined,
    });
    if (result?.error) setServerError(result.error);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-[#b9bbbe]">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          className="border-[#1e1f22] bg-[#1e1f22] text-white placeholder:text-[#4f545c] focus-visible:ring-[#5865f2]"
          placeholder="you@example.com"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-[#ed4245]">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-[#b9bbbe]">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          className="border-[#1e1f22] bg-[#1e1f22] text-white placeholder:text-[#4f545c] focus-visible:ring-[#5865f2]"
          placeholder="••••••••"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-[#ed4245]">{errors.password.message}</p>
        )}
      </div>

      {serverError && (
        <div className="rounded-md bg-[#ed4245]/20 border border-[#ed4245]/40 px-3 py-2 text-sm text-[#ed4245]">
          {serverError}
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#5865f2] text-white hover:bg-[#4752c4] active:scale-[0.98] transition-transform"
      >
        {isSubmitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
