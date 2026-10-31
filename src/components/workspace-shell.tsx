"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Heart, LayoutGrid, LogOut, Package, ShoppingBag, UserRound } from "lucide-react";
import { authAdapter } from "@/lib/auth";

export function WorkspaceShell({ title, subtitle, tab, onTab, owner = false, signedIn = false, children }: {
  title: string; subtitle?: string; tab?: string; onTab?: (tab: string) => void;
  owner?: boolean; signedIn?: boolean; children: ReactNode;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const tabs = owner ? [{ id: "products", label: "Products", Icon: LayoutGrid }, { id: "orders", label: "Orders", Icon: Package }] : [{ id: "orders", label: "Orders", Icon: Package }, { id: "saved", label: "Saved", Icon: Heart }, { id: "details", label: "My details", Icon: UserRound }];
  async function signOut() {
    setPending(true); setError("");
    try { await authAdapter.signOut(); router.replace("/login/"); }
    catch { setError("We couldn’t sign you out. Please try again."); }
    finally { setPending(false); }
  }
  return <div className="workspace">
    <a className="workspace-skip" href="#workspace-main">Skip to content</a>
    <main id="workspace-main" className="workspace-main"><div className="workspace-title"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div><div className="workspace-title-actions">{owner && <Link href="/account/" className="workspace-link">My account</Link>}{signedIn && <button className="workspace-link workspace-signout" type="button" onClick={signOut} disabled={pending} aria-label="Sign out"><LogOut size={18}/><span>{pending ? "Signing out…" : "Sign out"}</span></button>}</div></div>
{tab && onTab && <nav className="workspace-navigation" aria-label={owner ? "Owner dashboard" : "Account sections"}><div><Link href="/shop/" className="workspace-nav-item"><ShoppingBag size={22}/><span>Shop</span></Link>{tabs.map(({ id, label, Icon }) => <button key={id} className="workspace-nav-item" type="button" aria-current={tab === id ? "page" : undefined} onClick={() => onTab(id)}><Icon size={22}/><span>{label}</span></button>)}</div></nav>}
      {error && <p className="workspace-error" role="alert">{error}</p>}
      {children}
    </main>
  </div>;
}
