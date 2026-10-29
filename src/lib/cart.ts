import type { Product } from "./catalogue.ts";

export interface CartItem { productId: string; quantity: number; customization: string }
export const CART_STORAGE_KEY = "bbr-shopping-bag-v1";
export const MAX_QUANTITY = 99; // An enquiry limit, not a statement of inventory.
export const MAX_CUSTOMIZATION_LENGTH = 300;
export const MAX_BAG_LINES = 40;

export function cartLineKey(item: Pick<CartItem, "productId" | "customization">): string {
  return JSON.stringify([item.productId, item.customization]);
}

export function addToCart(cart: CartItem[], item: CartItem): CartItem[] {
  const normalized = { ...item, quantity: Math.max(1, Math.min(MAX_QUANTITY, Math.trunc(item.quantity) || 1)), customization: item.customization.trim().slice(0, MAX_CUSTOMIZATION_LENGTH) };
  const index = cart.findIndex(line => cartLineKey(line) === cartLineKey(normalized));
  if (index === -1) return cart.length >= MAX_BAG_LINES ? cart : [...cart, normalized];
  return cart.map((line, i) => i === index ? { ...line, quantity: Math.min(MAX_QUANTITY, line.quantity + normalized.quantity) } : line);
}

/** Storage is untrusted: keep known products and bounded quantities/text only. */
export function parseCart(raw: string | null, catalogue: Product[]): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const ids = new Set(catalogue.map(p => p.id));
    return parsed.slice(0, MAX_BAG_LINES).reduce<CartItem[]>((cart, item: unknown) => {
      if (!item || typeof item !== "object") return cart;
      const line = item as Record<string, unknown>;
      if (typeof line.productId !== "string" || !ids.has(line.productId) || typeof line.quantity !== "number" || !Number.isInteger(line.quantity) || line.quantity < 1 || typeof line.customization !== "string") return cart;
      return addToCart(cart, { productId: line.productId, quantity: line.quantity, customization: line.customization });
    }, []);
  } catch { return []; }
}
