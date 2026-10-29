import { lineSubtotalGhs, productImages, unitPriceGhs, type Product } from "./catalogue.ts";
import { cartPricing, type CartItem } from "./cart.ts";

export function createOrderMessage(cart: CartItem[], catalogue: Product[]): string {
  if (!cart.length) throw new Error("Add a product to your bag first.");
  const lines = cart.map((item, index) => {
    const product = catalogue.find(product => product.id === item.productId);
    if (!product) throw new Error("A product is no longer available in the catalogue.");
    const images = productImages(product);
    const reference = images.indexOf(item.referenceImage || product.image) + 1;
    const unitPrice = unitPriceGhs(product, item.optionId);
    const subtotal = lineSubtotalGhs(product, item.quantity, item.optionId);
    const option = product.priceOptions?.find(option => option.id === item.optionId);
    return [
      `${index + 1}. ${product.name}${product.isSample ? " (sample listing)" : ""}`,
      `Quantity: ${item.quantity}`,
      ...(product.priceOptions ? [`Customisation option: ${option?.label ?? "not selected; please confirm"}`] : []),
      `Customisation / preferences: ${item.customization || "None specified"}`,
      ...(images.length > 1 ? [`Style reference: photo ${reference} of ${images.length} (${(item.referenceImage || product.image).split("/").pop()})`] : []),
      ...(product.requiresPhoto ? ["Photo customisation: I will send my photo in this chat; please confirm the design."] : []),
      unitPrice === null ? "Price: please quote" : `${product.priceIsEstimate ? "Guide" : "Listed"} unit price: GHS ${unitPrice.toFixed(2)}\n${product.priceIsEstimate ? "Estimated item" : "Item"} subtotal: GHS ${subtotal!.toFixed(2)}`,
      "Availability: please confirm",
    ].join("\n");
  });
  const pricing = cartPricing(cart, catalogue);
  const needsImageNote = cart.some(item => { const product = catalogue.find(product => product.id === item.productId)!; return product.isSample || product.imageIsPlaceholder || product.imageIsReference; });
  return [
    "Hello Big B Royale! I'd like to enquire about the following:",
    ...lines,
    ...(pricing.pricedQuantity > 0 ? [`${pricing.hasEstimate ? "Estimated items subtotal" : pricing.unpricedQuantity ? "Priced items subtotal" : "Items subtotal"}: GHS ${pricing.pricedSubtotal.toFixed(2)} (delivery excluded).`] : []),
    ...(pricing.hasEstimate ? ["Watch prices are a guide; please confirm the final price for the selected model."] : []),
    ...(pricing.unpricedQuantity > 0 ? [`Please quote for ${pricing.unpricedQuantity} item(s) without a listed price before confirming the final total.`] : []),
    "Please confirm the prices in Ghana Cedis (GHS), availability, and whether my customisation requests are possible.",
    "Please also confirm delivery options and charges for my location. I'll share my location in this chat.",
    ...(needsImageNote ? ["Listings marked as samples, placeholders or style references are illustrative; please confirm the final product."] : []),
    "This is an enquiry, not a paid or confirmed order.",
  ].join("\n\n");
}

export function createWhatsAppUrl(number: string, message: string): string {
  const digits = number.replace(/[\s+()-]/g, "");
  if (!/^[1-9]\d{7,14}$/.test(digits)) throw new Error("A valid WhatsApp business number is required.");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
