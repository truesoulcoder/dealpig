import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async (cookieStore: ReturnType<typeof cookies>) => {
  // Await the cookies promise to get the actual cookies object
  const resolvedCookies = await cookieStore;
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return resolvedCookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            resolvedCookies.set(name, value, options);
          } catch (error) {
            // This can be ignored if you have middleware refreshing user sessions
            console.log("Cookie set error (can be ignored if using middleware):", error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            resolvedCookies.set(name, '', { ...options, maxAge: 0 });
          } catch (error) {
            // This can be ignored if you have middleware refreshing user sessions
            console.log("Cookie remove error (can be ignored if using middleware):", error);
          }
        },
      },
    }
  );
};
