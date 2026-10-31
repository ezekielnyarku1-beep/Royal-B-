"use client";
import { useEffect, useRef, useState } from "react";
import { useAccount } from "./use-account";
import { commerceError, fetchFavorites, setFavorite } from "@/lib/commerce";

export function useSavedProducts() {
  const { user, loading: accountLoading } = useAccount();
  const [ids, setIds] = useState<string[]>([]);
  const [pending, setPending] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const currentUser = useRef(user?.id);
  currentUser.current = user?.id;
  useEffect(() => {
    setIds([]); setError(""); setLoadError(""); setPending([]); setLoading(Boolean(user));
    let active = true;
    if (user) void fetchFavorites(user.id).then(saved => { if (active) setIds(saved); }).catch(failure => { if (active) setLoadError(commerceError(failure)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id]);
  async function toggle(productId: string) {
    if (!user) { setError("Sign in to save products to your account."); return; }
    if (pending.includes(productId)) return;
    const userId = user.id; const save = !ids.includes(productId);
    setIds(items => save ? [...new Set([...items, productId])] : items.filter(id => id !== productId));
    setPending(items => [...items, productId]); setError("");
    try {
      await setFavorite(userId, productId, save);
    } catch (failure) {
      if (currentUser.current === userId) {
        setIds(items => save ? items.filter(id => id !== productId) : [...new Set([...items, productId])]);
        setError(commerceError(failure));
      }
    }
    finally { if (currentUser.current === userId) setPending(items => items.filter(id => id !== productId)); }
  }
  return { ids, pending, error, loadError, loading, clearError: () => setError(""), toggle, user, accountLoading };
}
