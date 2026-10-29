import type { AuthChangeEvent } from "@supabase/supabase-js";
import { AuthConfigurationError, createClient, getRememberSession, setRememberSession } from "./supabase/client.ts";

export { AuthConfigurationError } from "./supabase/client.ts";

export interface AuthAdapter {
  signIn(input: { email: string; password: string; remember: boolean }): Promise<{ message: string }>;
  signUp(input: { name: string; email: string; password: string }): Promise<{ message: string }>;
  resetPassword(input: { email: string }): Promise<{ message: string }>;
  updatePassword(input: { password: string }): Promise<{ message: string }>;
  onAuthStateChange(callback: (event: AuthChangeEvent) => void): () => void;
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
    return { message: "You're signed in." };
  },

  async signUp({ name, email, password }) {
    const { error } = await createClient().auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return { message: "If an account can be created with this email, you'll receive next steps shortly." };
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
    return { message: "Your password has been updated. You can now return to log in." };
  },

  onAuthStateChange(callback) {
    const { data: { subscription } } = createClient().auth.onAuthStateChange(callback);
    return () => subscription.unsubscribe();
  },
};

export function authErrorMessage(error: unknown): string {
  return error instanceof AuthConfigurationError
    ? error.message
    : "We couldn't complete that request. Please try again in a moment.";
}
