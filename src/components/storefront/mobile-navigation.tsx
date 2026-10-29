"use client";
import { LayoutGrid, MessageCircle, ShoppingBag } from "lucide-react";
import { AccountLink } from "./account-link";

export function MobileNavigation({ count, contactUrl, onShop, onBag }: {
  count: number;
  contactUrl: string;
  onShop: () => void;
  onBag: () => void;
}) {
  return <nav className="mobile-shopping-nav" aria-label="Mobile shopping">
    <a className="mobile-nav-item mobile-nav-current" href="#collection" onClick={onShop}><LayoutGrid size={21}/><span>Shop</span></a>
    <button className="mobile-nav-item" type="button" onClick={onBag} aria-label={`Open shopping bag, ${count} ${count === 1 ? "item" : "items"}`}>
      <span className="mobile-nav-icon"><ShoppingBag size={21}/>{count > 0 && <span className="mobile-nav-badge" aria-hidden="true">{count > 99 ? "99+" : count}</span>}</span><span>Bag</span>
    </button>
    <a className="mobile-nav-item" href={contactUrl} target="_blank" rel="noopener noreferrer" aria-label="Chat with Big B Royale on WhatsApp"><MessageCircle size={21}/><span>WhatsApp</span></a>
    <AccountLink mobile/>
  </nav>;
}
