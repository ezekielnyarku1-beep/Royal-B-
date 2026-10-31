"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, ShoppingBag, UserRound, Info } from "lucide-react";
import { Logo } from "./brand";
import { useAccount } from "@/hooks/use-account";
import { useCatalogue } from "./commerce-provider";
import { CART_STORAGE_KEY, parseCart } from "@/lib/cart";
import { BAG_CHANGED_EVENT, OPEN_BAG_EVENT } from "@/lib/bag-events";

export function SiteHeader() {
  const pathname = usePathname().replace(/\/$/, "") || "/";
  const router = useRouter();
  const { user } = useAccount();
  const { products } = useCatalogue();
  const [count, setCount] = useState(0);
  const [countReady, setCountReady] = useState(false);
  useEffect(() => {
    function sync() {
      try { setCount(parseCart(localStorage.getItem(CART_STORAGE_KEY), products).reduce((sum, item) => sum + item.quantity, 0)); }
      catch { /* The shop can still keep a bag for this visit. */ }
      finally { setCountReady(true); }
    }
    function changed(event: Event) { setCount((event as CustomEvent<number>).detail); setCountReady(true); }
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    window.addEventListener(BAG_CHANGED_EVENT, changed);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("focus", sync); window.removeEventListener(BAG_CHANGED_EVENT, changed); };
  }, [products, pathname]);
  const links = [
    { label: "Home", href: "/", active: pathname === "/" || pathname === "/welcome", Icon: Home },
    { label: "Shopping", href: "/shop/", active: pathname === "/shop", Icon: ShoppingBag },
    { label: "Account", href: user ? "/account/" : "/login/", active: ["/login", "/account", "/admin"].includes(pathname), Icon: UserRound },
    { label: "About", href: "/about/", active: pathname === "/about", Icon: Info },
  ];
  return <header className="site-header">
    <div className="site-header-inner">
      <Link href="/" className="site-logo" aria-label="Big B Royale home"><Logo/></Link>
      <nav className="site-main-nav" aria-label="Main navigation">{links.map(({ label, href, active, Icon }) => <Link key={label} href={href} aria-current={active ? "page" : undefined}><Icon size={19} aria-hidden="true"/><span>{label}</span></Link>)}</nav>
      <button type="button" className="site-bag" aria-label={`Open shopping bag${countReady ? `, ${count} ${count === 1 ? "item" : "items"}` : ""}`} onClick={() => { if (pathname === "/shop") window.dispatchEvent(new Event(OPEN_BAG_EVENT)); else router.push("/shop/?bag=open"); }}><ShoppingBag size={21} aria-hidden="true"/><span aria-hidden="true" data-ready={countReady}>{count > 99 ? "99+" : count}</span></button>
    </div>
  </header>;
}
