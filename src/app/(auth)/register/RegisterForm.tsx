"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/features/auth/actions";

const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be 20 characters or fewer")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Username can only contain letters, numbers, underscores, and dashes"
      ),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    const result = await signUp({
      email: data.email,
      username: data.username,
      password: data.password,
    });
    if (result?.error) setServerError(result.error);
  };

  const inputClass =
    "border-[#1e1f22] bg-[#1e1f22] text-white placeholder:text-[#4f545c] focus-visible:ring-[#5865f2]";

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
          className={inputClass}
          placeholder="you@example.com"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-[#ed4245]">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="username" className="text-xs font-semibold uppercase tracking-wide text-[#b9bbbe]">
          Username
        </Label>
        <Input
          id="username"
          type="text"
          autoComplete="username"
          className={inputClass}
          placeholder="cooluser123"
          {...register("username")}
        />
        {errors.username && (
          <p className="text-xs text-[#ed4245]">{errors.username.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-[#b9bbbe]">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          className={inputClass}
          placeholder="••••••••"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-[#ed4245]">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wide text-[#b9bbbe]">
          Confirm password
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          className={inputClass}
          placeholder="••••••••"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-[#ed4245]">{errors.confirmPassword.message}</p>
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
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
