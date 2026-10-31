"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { store } from "@/lib/catalogue";
import { createWhatsAppUrl } from "@/lib/whatsapp";

export function SiteFooter() {
  const pathname = usePathname();
  // The shop retains its detailed delivery and contact footer.
  if (pathname.startsWith("/shop")) return null;
  return <footer className="site-footer"><div><span>© 2026 Big B Royale · Ghana / GHS</span><nav aria-label="Footer navigation"><Link href="/shop/">Shopping</Link><Link href="/about/#how-to-order">How to order</Link><a href={createWhatsAppUrl(store.whatsappNumber, "Hello Big B Royale! I'd like to ask about your products and ordering.")} target="_blank" rel="noopener noreferrer">WhatsApp</a></nav></div></footer>;
}
