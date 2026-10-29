import { productImages, unitPriceGhs, type Product } from "./catalogue.ts";

export interface CartItem { productId: string; quantity: number; customization: string; referenceImage?: string; optionId?: string }
export const CART_STORAGE_KEY = "bbr-shopping-bag-v1";
export const MAX_QUANTITY = 99; // An enquiry limit, not a statement of inventory.
export const MAX_CUSTOMIZATION_LENGTH = 300;
export const MAX_BAG_LINES = 40;

export function cartLineKey(item: Pick<CartItem, "productId" | "customization" | "referenceImage" | "optionId">): string {
  if (item.optionId) return JSON.stringify([item.productId, item.customization, item.referenceImage ?? null, item.optionId]);
  return JSON.stringify(item.referenceImage ? [item.productId, item.customization, item.referenceImage] : [item.productId, item.customization]);
}

export function cartPricing(cart: CartItem[], catalogue: Product[]) {
  let subtotalPesewas = 0;
  let unpricedQuantity = 0;
  let pricedQuantity = 0;
  let hasEstimate = false;
  for (const item of cart) {
    const product = catalogue.find(product => product.id === item.productId);
    if (!product) continue;
    const price = unitPriceGhs(product, item.optionId);
    if (price === null) unpricedQuantity += item.quantity;
    else { subtotalPesewas += Math.round(price * 100) * item.quantity; pricedQuantity += item.quantity; hasEstimate ||= Boolean(product.priceIsEstimate); }
  }
  return { pricedSubtotal: subtotalPesewas / 100, pricedQuantity, unpricedQuantity, hasEstimate };
}

export function addToCart(cart: CartItem[], item: CartItem): CartItem[] {
  if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY) return cart;
  const normalized = { ...item, quantity: Math.max(1, Math.min(MAX_QUANTITY, Math.trunc(item.quantity) || 1)), customization: item.customization.trim().slice(0, MAX_CUSTOMIZATION_LENGTH) };
  const index = cart.findIndex(line => cartLineKey(line) === cartLineKey(normalized));
  if (index === -1) return cart.length >= MAX_BAG_LINES ? cart : [...cart, normalized];
  if (cart[index].quantity + normalized.quantity > MAX_QUANTITY) return cart;
  return cart.map((line, i) => i === index ? { ...line, quantity: line.quantity + normalized.quantity } : line);
}

export function changeCartOption(cart: CartItem[], key: string, optionId: string, catalogue: Product[]): CartItem[] {
  const index = cart.findIndex(item => cartLineKey(item) === key);
  if (index === -1) return cart;
  const item = cart[index];
  const product = catalogue.find(product => product.id === item.productId);
  if (!product?.priceOptions?.some(option => option.id === optionId) || item.optionId === optionId) return cart;
  const changed = { ...item, optionId };
  const matching = cart.findIndex((line, position) => position !== index && cartLineKey(line) === cartLineKey(changed));
  if (matching === -1) return cart.map((line, position) => position === index ? changed : line);
  if (cart[matching].quantity + item.quantity > MAX_QUANTITY) return cart;
  return cart.map((line, position) => position === matching ? { ...line, quantity: line.quantity + item.quantity } : line).filter((_, position) => position !== index);
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
      const customization = line.customization.trim().slice(0, MAX_CUSTOMIZATION_LENGTH);
      let productId = line.productId;
      let product = catalogue.find(product => product.id === productId)!;
      if (line.referenceImage !== undefined) {
        if (typeof line.referenceImage !== "string") return cart;
        if (!productImages(product).includes(line.referenceImage)) {
          // Preserve saved selections from the old grouped galleries when a
          // photo becomes its own listing, without changing its price/category.
          if (!["customized-bracelets", "personalized-name-necklaces", "customized-rings"].includes(productId)) return cart;
          const style = catalogue.find(candidate => candidate.category === product.category && candidate.priceGhs === product.priceGhs && productImages(candidate).includes(line.referenceImage as string));
          if (!style) return cart;
          product = style;
          productId = style.id;
        }
      }
      const referenceImage = typeof line.referenceImage === "string" && line.referenceImage !== product.image ? line.referenceImage : undefined;
      if (line.optionId !== undefined && (typeof line.optionId !== "string" || !product.priceOptions?.some(option => option.id === line.optionId))) return cart;
      const optionId = typeof line.optionId === "string" ? line.optionId : undefined;
      const existing = cart.find(item => cartLineKey(item) === cartLineKey({ productId, customization, referenceImage, optionId }));
      const room = MAX_QUANTITY - (existing?.quantity ?? 0);
      return room > 0 ? addToCart(cart, { productId, quantity: Math.min(line.quantity, room), customization, referenceImage, optionId }) : cart;
    }, []);
  } catch { return []; }
}
