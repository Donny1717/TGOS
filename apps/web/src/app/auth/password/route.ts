import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const mode = String(form.get("mode") ?? "signin");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

  if (!url || !anonKey) {
    return NextResponse.redirect(new URL("/sign-in?error=signup&detail=Missing+Supabase+URL+or+anon+key", request.url));
  }

  if (!email || password.length < 6) {
    return NextResponse.redirect(
      new URL("/sign-in?error=credentials&detail=Email+and+password+(min+6)+required", request.url),
    );
  }

  // 1) Sign-up: create confirmed user with service role (no email wait)
  if (mode === "signup") {
    if (!serviceKey) {
      return NextResponse.redirect(
        new URL("/sign-in?mode=signup&error=signup&detail=Missing+SUPABASE_SERVICE_ROLE_KEY+in+.env", request.url),
      );
    }
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError) {
      const already = /already|registered|exists/i.test(createError.message);
      const detail = encodeURIComponent(
        already ? "This email is already registered. Use Sign in." : createError.message,
      );
      return NextResponse.redirect(new URL(`/sign-in?mode=signup&error=signup&detail=${detail}`, request.url));
    }
  }

  // 2) Sign in and attach session cookies to the redirect response
  const destination = new URL(mode === "signup" ? "/onboarding" : "/dashboard", appUrl);
  const response = NextResponse.redirect(destination);

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    const detail = encodeURIComponent(signInError.message);
    return NextResponse.redirect(new URL(`/sign-in?error=credentials&detail=${detail}`, request.url));
  }

  return response;
}
