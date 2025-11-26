import { headers } from "next/headers";

/**
 * Gets the site URL for email redirects.
 * Priority:
 * 1. NEXT_PUBLIC_SITE_URL environment variable
 * 2. Request origin from headers (for server actions)
 * 3. Fallback to production URL
 */
export async function getSiteUrl(): Promise<string> {
  // First, try the environment variable
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  // Fallback: try to get from request headers (for server actions)
  try {
    const headersList = await headers();
    const host = headersList.get("host");
    const protocol = headersList.get("x-forwarded-proto") || "https";
    
    if (host) {
      // Don't use localhost in production
      if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
        return `${protocol}://${host}`;
      }
    }
  } catch {
    // Headers might not be available in all contexts
  }

  // Final fallback - should not happen in production
  return "https://epsiwordle.vercel.app";
}
