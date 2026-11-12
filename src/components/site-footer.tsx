"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "./brand";
import { store } from "@/lib/catalogue";
import { createWhatsAppUrl } from "@/lib/whatsapp";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/shop")) return null;
  return <footer className="site-footer"><div>
    <div className="site-footer-top">
      <div className="site-footer-brand"><Link href="/" aria-label="Big B Royale home"><Logo light/></Link><p>Thoughtfully chosen. Personally yours.<br/>Gifts and everyday finds with a touch of you.</p></div>
      <div><h2>Find your something</h2><nav aria-label="Footer navigation"><Link href="/shop/">Shopping</Link><Link href="/about/">Our story</Link><Link href="/about/#how-to-order">How to order</Link></nav></div>
      <div><h2>A real conversation</h2><a href={createWhatsAppUrl(store.whatsappNumber, "Hello Big B Royale! I'd like to ask about your products and ordering.")} target="_blank" rel="noopener noreferrer">WhatsApp us</a><p>{store.whatsappDisplay}<br/>Ask about personalisation and delivery.</p></div>
    </div>
    <div className="site-footer-bottom"><span>© 2026 Big B Royale. All rights reserved.</span><span>Proudly Ghanaian · Ghana / GHS</span></div>
  </div></footer>;
}
