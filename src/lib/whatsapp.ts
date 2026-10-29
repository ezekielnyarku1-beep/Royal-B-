import type { Product } from "./catalogue.ts";
import type { CartItem } from "./cart.ts";

export function createOrderMessage(cart: CartItem[], catalogue: Product[]): string {
  if (!cart.length) throw new Error("Add a product to your bag first.");
  const lines = cart.map((item, index) => {
    const product = catalogue.find(product => product.id === item.productId);
    if (!product) throw new Error("A product is no longer available in the catalogue.");
    return `${index + 1}. ${product.name}${product.isSample ? " (sample listing)" : ""}\nQuantity: ${item.quantity}\nCustomisation / preferences: ${item.customization || "None specified"}\nPrice and availability: please confirm`;
  });
  return [
    "Hello Big B Royale! I'd like to enquire about the following:",
    ...lines,
    "Please confirm the prices in Ghana Cedis (GHS), availability, and whether my customisation requests are possible.",
    "Please also confirm delivery options and charges for my location. I'll share my location in this chat.",
    "I understand the product images may be illustrative placeholders. This is an enquiry, not a paid or confirmed order.",
  ].join("\n\n");
}

export function createWhatsAppUrl(number: string, message: string): string {
  const digits = number.replace(/[\s+()-]/g, "");
  if (!/^[1-9]\d{7,14}$/.test(digits)) throw new Error("A valid WhatsApp business number is required.");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
