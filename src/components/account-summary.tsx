"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, LogOut, ShieldCheck } from "lucide-react";
import { authAdapter, type AccountUser } from "@/lib/auth";

export function AccountSummary({ user }: { user: AccountUser }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const name = typeof user.user_metadata?.name === "string" ? user.user_metadata.name.trim() : "";

  async function signOut() {
    if (pending) return;
    setPending(true); setError("");
    try { await authAdapter.signOut(); }
    catch { setError("We couldn’t complete sign-out. Please try again."); }
    finally { setPending(false); }
  }

  return <section className="auth-content account-summary" aria-labelledby="account-title" aria-busy={pending}>
    <div className="welcome-icon" aria-hidden="true"><ShieldCheck size={25} strokeWidth={1.5}/></div>
    <div className="auth-heading"><div className="form-eyebrow">WELCOME TO THE ROYAL FAMILY</div><h2 id="account-title">Your royal space.</h2><p>{name ? `Good to see you, ${name}.` : "Good to see you again."}</p></div>
    <div className="account-details"><span>Signed in as</span><p>{user.email || "Big B Royale member"}</p></div>
    <Link href="/shop/" className="primary-button account-continue">Continue shopping<ArrowRight size={18}/></Link>
    <button type="button" className="account-signout" disabled={pending} onClick={signOut}><LogOut size={17}/>{pending ? "Signing out…" : "Sign out"}</button>
    {error && <p className="field-error" role="alert">{error}</p>}
    <p className="account-session-note">Sign out ends this browser’s session. Your shopping bag stays saved on this device.</p>
  </section>;
}
