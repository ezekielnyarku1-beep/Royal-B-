"use client";
import { LayoutGrid, Search, ShoppingBag } from "lucide-react";
import { AccountLink } from "./account-link";

export function MobileNavigation({ count, onSearch, onShop, onBag }: {
  count: number;
  onSearch: () => void;
  onShop: () => void;
  onBag: () => void;
}) {
  return <nav className="mobile-shopping-nav" aria-label="Mobile shopping">
    <a className="mobile-nav-item mobile-nav-current" href="#collection" onClick={onShop}><LayoutGrid size={21}/><span>Shop</span></a>
    <button className="mobile-nav-item" type="button" onClick={onSearch}><Search size={21}/><span>Search</span></button>
    <button className="mobile-nav-item" type="button" onClick={onBag} aria-label={`Open shopping bag, ${count} ${count === 1 ? "item" : "items"}`}>
      <span className="mobile-nav-icon"><ShoppingBag size={21}/>{count > 0 && <span className="mobile-nav-badge" aria-hidden="true">{count > 99 ? "99+" : count}</span>}</span><span>Bag</span>
    </button>
    <AccountLink mobile/>
  </nav>;
}
