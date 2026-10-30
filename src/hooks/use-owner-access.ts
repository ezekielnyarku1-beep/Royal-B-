"use client";
import { useEffect, useState } from "react";
import { useAccount } from "./use-account";
import { commerceError, isStoreOwner } from "@/lib/commerce";

export function useOwnerAccess() {
  const account = useAccount();
  const [result, setResult] = useState<{ userId: string; owner: boolean; error: string } | null>(null);
  useEffect(() => {
    setResult(null);
    if (!account.user) return;
    let active = true; const userId = account.user.id;
    void isStoreOwner().then(owner => { if (active) setResult({ userId, owner, error: "" }); }).catch(error => { if (active) setResult({ userId, owner: false, error: commerceError(error) }); });
    return () => { active = false; };
  }, [account.user?.id]);
  const current = result?.userId === account.user?.id ? result : null;
  return { ...account, owner: Boolean(current?.owner), checking: account.loading || Boolean(account.user && !current), error: current?.error ?? "" };
}
