"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function readField(formData: FormData, field: string) {
  return String(formData.get(field) ?? "");
}

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(200),
});

export async function signUpWithPassword(formData: FormData) {
  const input = credentialsSchema.parse({
    email: readField(formData, "email"),
    password: readField(formData, "password"),
  });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
  });

  if (error || !data.user) {
    redirect("/sign-in?mode=signup&error=signup");
  }

  // If email confirmation is on, session may be null — still send to onboarding when session exists.
  if (!data.session) {
    redirect("/sign-in?mode=signup&error=signup");
  }

  redirect("/onboarding");
}

export async function signInWithPassword(formData: FormData) {
  const input = credentialsSchema.parse({
    email: readField(formData, "email"),
    password: readField(formData, "password"),
  });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    redirect("/sign-in?error=credentials");
  }

  redirect("/dashboard");
}
