import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isLocalAuthBypassEnabled } from "@/lib/dev-auth";

function isProtectedPath(pathname: string) {
  return pathname.startsWith("/dashboard") || pathname === "/onboarding" || pathname.startsWith("/onboarding/");
}

function signInRedirect(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/sign-in";
  redirectUrl.search = "";
  return NextResponse.redirect(redirectUrl);
}

export async function proxy(request: NextRequest) {
  if (isLocalAuthBypassEnabled(request.nextUrl.hostname)) {
    return NextResponse.next({ request });
  }

  const protectedPath = isProtectedPath(request.nextUrl.pathname);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (protectedPath && (!url || !anonKey)) {
    return signInRedirect(request);
  }

  let response = NextResponse.next({ request });
  if (!url || !anonKey) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && protectedPath) {
    return signInRedirect(request);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding", "/onboarding/:path*"],
};
