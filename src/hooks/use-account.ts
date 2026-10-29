"use client";
import { useEffect, useState } from "react";
import { authAdapter, type AccountUser } from "@/lib/auth";

/** Client-side account display; authorization remains the provider's responsibility. */
export function useAccount() {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    try {
      const unsubscribe = authAdapter.onAuthStateChange((_event, currentUser) => {
        if (!active) return;
        setUser(currentUser);
        setLoading(false);
      });
      return () => { active = false; unsubscribe(); };
    } catch {
      setLoading(false);
      return () => { active = false; };
    }
  }, []);

  return { user, loading };
}
