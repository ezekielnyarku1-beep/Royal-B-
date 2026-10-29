import type { AuthChangeEvent, User } from "@supabase/supabase-js";
import { AuthConfigurationError, createClient, getRememberSession, setRememberSession } from "./supabase/client.ts";
import { providerErrorMessage } from "./auth-errors.ts";

export { AuthConfigurationError } from "./supabase/client.ts";
export { authErrorReference } from "./auth-errors.ts";
export type AccountUser = Pick<User, "id" | "email" | "user_metadata">;
export type AuthResult = { message: string; authenticated?: boolean };

export interface AuthAdapter {
  signIn(input: { email: string; password: string; remember: boolean }): Promise<AuthResult>;
  signUp(input: { name: string; email: string; password: string }): Promise<AuthResult>;
  resetPassword(input: { email: string }): Promise<{ message: string }>;
  updatePassword(input: { password: string }): Promise<{ message: string }>;
  signOut(): Promise<void>;
  onAuthStateChange(callback: (event: AuthChangeEvent, user: AccountUser | null) => void): () => void;
}

export const authAdapter: AuthAdapter = {
  async signIn({ email, password, remember }) {
    const previousRememberChoice = getRememberSession();
    setRememberSession(remember);
    try {
      const { data, error } = await createClient().auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.session) throw new Error("Authentication did not return a session.");
    } catch (error) {
      setRememberSession(previousRememberChoice);
      throw error;
    }
    setRememberSession(remember, true);
    return { message: "You're signed in.", authenticated: true };
  },

  async signUp({ name, email, password }) {
    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    if (!data.user && !data.session) throw new Error("Signup did not return an account or confirmation result.");
    return {
      authenticated: Boolean(data.session),
      message: data.session
        ? "Your account is ready. Taking you to the store."
        : "If this email can be registered, a confirmation link will arrive shortly. Check your inbox and spam folder, then open the link in this browser to finish signing up. If you already have an account, log in or use Forgot password.",
    };
  },

  async resetPassword({ email }) {
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
    return { message: "If an account exists for this email, reset instructions will arrive shortly." };
  },

  async updatePassword({ password }) {
    const { error } = await createClient().auth.updateUser({ password });
    if (error) throw error;
    return { message: "Your password has been updated." };
  },

  async signOut() {
    const { error } = await createClient().auth.signOut({ scope: "local" });
    // The SDK clears this browser's session even if remote revocation fails.
    setRememberSession(false, true);
    if (error) throw error;
  },

  onAuthStateChange(callback) {
    const { data: { subscription } } = createClient().auth.onAuthStateChange((event, session) => {
      const user = session?.user;
      callback(event, user ? { id: user.id, email: user.email, user_metadata: user.user_metadata } : null);
    });
    return () => subscription.unsubscribe();
  },
};

export function authErrorMessage(error: unknown): string {
  return error instanceof AuthConfigurationError
    ? error.message
    : providerErrorMessage(error);
}
