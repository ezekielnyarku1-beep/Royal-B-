"use client";
import { useEffect } from "react";
import { isLegacyAuthReturn } from "@/lib/auth-return";

/** Keep existing email confirmation/reset URLs working after moving the login page. */
export function LegacyAuthRedirect() {
  useEffect(() => {
    if (isLegacyAuthReturn(window.location.search, window.location.hash)) {
      window.location.replace(`/login/${window.location.search}${window.location.hash}`);
    }
  }, []);
  return null;
}
