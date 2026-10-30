import type { Product } from "./catalogue.ts";

export const orderStatuses = ["requested", "confirmed", "customising", "ready", "out_for_delivery", "delivered", "cancelled"] as const;
export type OrderStatus = typeof orderStatuses[number];
export const orderStatusLabels: Record<OrderStatus, string> = {
  requested: "Awaiting confirmation", confirmed: "Confirmed", customising: "Being customised",
  ready: "Ready", out_for_delivery: "Out for delivery", delivered: "Delivered", cancelled: "Cancelled",
};
export const nextOrderStatuses: Record<OrderStatus, OrderStatus[]> = {
  requested: ["confirmed", "cancelled"], confirmed: ["customising", "ready", "out_for_delivery", "cancelled"],
  customising: ["ready", "cancelled"], ready: ["out_for_delivery", "delivered", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"], delivered: [], cancelled: [],
};
export interface StoreProductRow {
  id: string; details: Product; active: boolean; stock_quantity: number | null;
  stock_status: "confirm" | "available" | "unavailable"; updated_at: string;
}
export interface CustomerProfile {
  user_id: string; name: string; phone: string; city: string; address: string; landmark: string;
}
export interface OrderItem {
  productId: string; name: string; image: string; quantity: number; customization: string;
  optionId?: string; optionLabel?: string; unitPrice: number | null; estimated: boolean; requiresPhoto?: boolean;
}
export interface StoreOrder {
  id: string; reference: string; user_id: string; status: OrderStatus; items: OrderItem[];
  contact: Omit<CustomerProfile, "user_id"> & { email?: string }; subtotal: number;
  unpriced_quantity: number; has_estimate: boolean; created_at: string; updated_at: string;
}
export interface OrderEvent { id: number; order_id: string; status: OrderStatus; note: string; created_at: string }

export function orderDate(value: string): string {
  return new Intl.DateTimeFormat("en-GH", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export function safeProductImage(value: string): boolean {
  if (typeof value !== "string" || value.length > 2000 || /\s/.test(value)) return false;
  if (/^\/products\/[a-zA-Z0-9/_.-]+$/.test(value) && !value.includes("..")) return true;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; }
  catch { return false; }
}

/** Validate database/admin input before it reaches catalogue and image controls. */
export function validateProduct(product: Product): string | null {
  if (!product || typeof product !== "object") return "Check the product details.";
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(product.id)) return "Use a valid product ID.";
  if (typeof product.name !== "string" || !product.name.trim() || product.name.length > 150) return "Enter a product name of up to 150 characters.";
  if (typeof product.category !== "string" || !product.category.trim() || product.category.length > 60) return "Enter a category of up to 60 characters.";
  if (typeof product.description !== "string" || product.description.length > 2000) return "Keep the description under 2,000 characters.";
  if (product.priceGhs !== null && (!Number.isFinite(product.priceGhs) || product.priceGhs < 0 || product.priceGhs > 1000000)) return "Enter a valid price, or leave it empty for a quote.";
  if (product.gallery && !Array.isArray(product.gallery)) return "Use one or two valid product photos.";
  if (![product.image, ...(product.gallery ?? [])].every(safeProductImage) || (product.gallery?.length ?? 0) > 1) return "Use one or two valid product photos.";
  if (product.priceOptions && !Array.isArray(product.priceOptions)) return "Check the customisation prices.";
  if (product.priceOptions && (product.priceOptions.length !== 2 || new Set(product.priceOptions.map(option => option.id)).size !== 2 || product.priceOptions.some(option => !/^[a-z0-9-]{1,40}$/.test(option.id) || !option.label.trim() || option.label.length > 80 || !Number.isFinite(option.priceGhs) || option.priceGhs < 0 || option.priceGhs > 1000000))) return "Check the two customisation prices and labels.";
  return null;
}

export function validateProfile(profile: Omit<CustomerProfile, "user_id">): string | null {
  if (!profile.name.trim() || profile.name.length > 100) return "Enter your name.";
  if (profile.phone && !/^\+?[0-9 ()-]{7,24}$/.test(profile.phone)) return "Enter a valid phone number with country code.";
  if (profile.city.length > 100 || profile.address.length > 300 || profile.landmark.length > 200) return "Please shorten your delivery details.";
  return null;
}

export function orderWhatsAppMessage(order: StoreOrder): string {
  return [
    `Hello Big B Royale! My order request is ${order.reference}.`,
    ...order.items.map((item, index) => [
      `${index + 1}. ${item.name}`, `Quantity: ${item.quantity}`,
      ...(item.optionLabel ? [`Customisation option: ${item.optionLabel}`] : []),
      `Customisation / preferences: ${item.customization || "None specified"}`,
      `Product photo reference: ${item.image.split("/").pop()}`,
      item.unitPrice === null ? "Price: please quote" : `${item.estimated ? "Guide" : "Listed"} unit price: GHS ${item.unitPrice.toFixed(2)}`,
      ...(item.requiresPhoto ? ["I will send my photo in this chat; please confirm the design."] : []),
    ].join("\n")),
    ...(order.contact.phone ? [`Contact: ${order.contact.name}, ${order.contact.phone}`] : []),
    ...(order.contact.city || order.contact.address ? [`Delivery: ${[order.contact.address, order.contact.city, order.contact.landmark].filter(Boolean).join(", ")}`] : []),
    "Please confirm prices, availability, customisation and delivery charges. This is an order request, not a paid or confirmed order.",
  ].join("\n\n");
}
