import { test } from "node:test";
import assert from "node:assert/strict";
import { products, store, priceLabel } from "../src/lib/catalogue.ts";
import { addToCart, parseCart, MAX_QUANTITY, MAX_CUSTOMIZATION_LENGTH } from "../src/lib/cart.ts";
import { createOrderMessage, createWhatsAppUrl } from "../src/lib/whatsapp.ts";

test("owner-supplied sample catalogue never invents price or stock", () => {
  assert.equal(products.length, 8);
  assert.equal(store.currency, "GHS");
  for (const product of products) {
    assert.equal(product.priceGhs, null);
    assert.equal(product.availability, "confirm");
    assert.equal(product.isSample, true);
    assert.equal(product.imageIsPlaceholder, true);
    assert.equal(priceLabel(product), "Contact for Price");
  }
});

test("bag combines matching preferences and preserves distinct customisations", () => {
  const item = { productId: products[0].id, quantity: 2, customization: "Ama & Kofi" };
  const first = addToCart([], item);
  const merged = addToCart(first, { ...item, quantity: 3, customization: " Ama & Kofi " });
  assert.equal(merged.length, 1);
  assert.equal(merged[0].quantity, 5);
  const distinct = addToCart(merged, { ...item, customization: "Esi" });
  assert.equal(distinct.length, 2);
  assert.equal(first[0].quantity, 2);
});

test("stored bags reject malformed or removed items and bound user input", () => {
  assert.deepEqual(parseCart("not json", products), []);
  assert.deepEqual(parseCart('{"quantity":1}', products), []);
  const raw = JSON.stringify([
    { productId: "removed", quantity: 2, customization: "test" },
    { productId: products[0].id, quantity: -5, customization: "test" },
    { productId: products[0].id, quantity: 1.5, customization: "test" },
    { productId: products[0].id, quantity: 1, customization: { bad: true } },
    { productId: products[0].id, quantity: 999, customization: "x".repeat(1000) },
  ]);
  const parsed = parseCart(raw, products);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].quantity, MAX_QUANTITY);
  assert.equal(parsed[0].customization.length, MAX_CUSTOMIZATION_LENGTH);
});

test("WhatsApp draft includes products, quantities, preferences and quote requests", () => {
  const cart = [{ productId: products[0].id, quantity: 3, customization: "Ési & Kofi\nInitials: A+B" }];
  const message = createOrderMessage(cart, products);
  assert.match(message, /Customized Bracelets \(sample listing\)/);
  assert.match(message, /Quantity: 3/);
  assert.ok(message.includes(cart[0].customization));
  assert.match(message, /prices in Ghana Cedis \(GHS\), availability/);
  assert.match(message, /delivery options and charges/);
  assert.match(message, /not a paid or confirmed order/);
  const url = new URL(createWhatsAppUrl("+233 55 735 6892", message));
  assert.equal(url.origin, "https://wa.me");
  assert.equal(url.pathname, "/233557356892");
  assert.equal(url.searchParams.get("text"), message);
});

test("invalid recipients and empty or stale enquiries cannot create checkout", () => {
  assert.throws(() => createWhatsAppUrl("javascript:123456789", "Hello"));
  assert.throws(() => createOrderMessage([], products));
  assert.throws(() => createOrderMessage([{ productId: "removed", quantity: 1, customization: "" }], products));
});
