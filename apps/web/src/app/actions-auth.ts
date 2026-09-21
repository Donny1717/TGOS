"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function readField(formData: FormData, field: string) {
  return String(formData.get(field) ?? "");
}

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(200),
});

function encodeError(message: string) {
  return encodeURIComponent(message.slice(0, 180));
}

/** Create a confirmed user (no email wait), then open a real session with cookies. */
export async function signUpWithPassword(formData: FormData) {
  let input: z.infer<typeof credentialsSchema>;
  try {
    input = credentialsSchema.parse({
      email: readField(formData, "email"),
      password: readField(formData, "password"),
    });
  } catch {
    redirect("/sign-in?mode=signup&error=signup&detail=" + encodeError("Invalid email or password (min 6 characters)."));
  }

  try {
    const admin = createSupabaseAdminClient();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
    });

    if (createError || !created.user) {
      const msg = createError?.message ?? "Could not create user";
      // User may already exist — try sign-in path message
      redirect(
        "/sign-in?mode=signup&error=signup&detail=" +
          encodeError(msg.includes("already") ? "This email is already registered. Use Sign in instead." : msg),
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Signup failed";
    redirect("/sign-in?mode=signup&error=signup&detail=" + encodeError(msg));
  }

  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (signInError) {
    redirect(
      "/sign-in?error=credentials&detail=" +
        encodeError(signInError.message + " — account may exist; try Sign in."),
    );
  }

  redirect("/onboarding");
}

export async function signInWithPassword(formData: FormData) {
  let input: z.infer<typeof credentialsSchema>;
  try {
    input = credentialsSchema.parse({
      email: readField(formData, "email"),
      password: readField(formData, "password"),
    });
  } catch {
    redirect("/sign-in?error=credentials&detail=" + encodeError("Invalid email or password."));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    redirect("/sign-in?error=credentials&detail=" + encodeError(error.message));
  }

  redirect("/dashboard");
}
