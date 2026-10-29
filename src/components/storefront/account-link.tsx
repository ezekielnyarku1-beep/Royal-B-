"use client";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { useAccount } from "@/hooks/use-account";

export function AccountLink({ mobile = false }: { mobile?: boolean }) {
  const { user } = useAccount();
  return <Link className={mobile ? "mobile-nav-item" : "store-account"} href="/" aria-label={user ? "Your account" : "Log in or sign up"}><UserRound size={21}/><span>{mobile ? "Account" : "Your account"}</span></Link>;
}
