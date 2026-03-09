"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: {
  email: string;
  password: string;
}): Promise<{ error: string } | undefined> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) return { error: error.message };

  redirect("/");
}

export async function signUp(formData: {
  email: string;
  username: string;
  password: string;
}): Promise<{ error: string } | undefined> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: { username: formData.username },
    },
  });

  if (error) return { error: error.message };

  if (data.session) {
    redirect("/");
  }

  redirect("/login?message=check-email");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
