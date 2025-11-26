import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set({
              name,
              value,
              ...options,
            })
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshing the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  const protectedPaths = ["/game", "/profile", "/stats", "/settings"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (user && (request.nextUrl.pathname === "/" || request.nextUrl.pathname.startsWith("/auth"))) {
    // Redirect logged in users to game
    return NextResponse.redirect(new URL("/game", request.url));
  }

  if (!user && isProtectedPath) {
    // Redirect unauthenticated users to login
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return response;
}

