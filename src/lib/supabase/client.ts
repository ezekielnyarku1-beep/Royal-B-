import { createBrowserClient } from "@supabase/ssr";
import { parseCookie, stringifySetCookie } from "cookie";
import type { SupabaseClient } from "@supabase/supabase-js";

const rememberedMaxAge = 60 * 60 * 24 * 400;
const rememberCookieName = "bbr-remember-session";

let browserClient: SupabaseClient | undefined;
let rememberSession = false;

export class AuthConfigurationError extends Error {
  constructor() {
    super("Account services aren't configured. Please contact support.");
    this.name = "AuthConfigurationError";
  }
}

export function createClient(): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error("The Supabase browser client can only be used in a browser.");
  }

  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new AuthConfigurationError();

  rememberSession = parseCookie(document.cookie)[rememberCookieName] === "1";
  browserClient = createBrowserClient(url, key, {
    cookies: {
      getAll() {
        return Object.entries(parseCookie(document.cookie)).flatMap(([name, value]) =>
          value === undefined ? [] : [{ name, value }],
        );
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          document.cookie = stringifySetCookie({
            name,
            value,
            ...options,
            maxAge: options.maxAge === 0 ? 0 : rememberSession ? rememberedMaxAge : undefined,
            path: options.path ?? "/",
            sameSite: options.sameSite ?? "lax",
            secure: window.location.protocol === "https:" || options.secure,
          });
        }
      },
    },
  });

  return browserClient;
}

export function getRememberSession(): boolean {
  return rememberSession;
}

export function setRememberSession(remember: boolean, persistChoice = false): void {
  rememberSession = remember;
  if (!persistChoice) return;

  document.cookie = stringifySetCookie({
    name: rememberCookieName,
    value: remember ? "1" : "",
    maxAge: remember ? rememberedMaxAge : 0,
    path: "/",
    sameSite: "lax",
    secure: window.location.protocol === "https:",
  });
}
