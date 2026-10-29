import { test } from "node:test";
import assert from "node:assert/strict";
import { products, store, priceLabel, productImages, lineSubtotalGhs, unitPriceGhs } from "../src/lib/catalogue.ts";
import { addToCart, parseCart, cartPricing, cartLineKey, changeCartOption, MAX_QUANTITY, MAX_CUSTOMIZATION_LENGTH } from "../src/lib/cart.ts";
import { createOrderMessage, createWhatsAppUrl } from "../src/lib/whatsapp.ts";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

test("catalogue uses exactly the owner-supplied prices and never invents stock", () => {
  assert.equal(products.length, 102);
  assert.equal(store.currency, "GHS");
  const prices = new Map([
    ["customized-bracelets", 130], ["personalized-name-necklaces", 100],
    ["photo-customized-necklace", 140], ["customized-rings", 50], ["phone-charger", 150], ["white-charger-cable-kit", 150],
    ["built-in-cable-power-bank", 200], ["carry-loop-power-bank", 150], ["suction-style-power-bank", 150],
    ["rectangular-floor-mirror", 360], ["arched-floor-mirror", 360],
  ]);
  for (const product of products) {
    const categoryPrices: Record<string, number> = { Bracelets: 130, Necklaces: 100, Rings: 50, Jewelry: 60 };
    assert.equal(product.priceGhs, prices.get(product.id) ?? (product.priceOptions ? 350 : product.category === "Watches" ? 200 : categoryPrices[product.category] ?? null));
    assert.equal(product.availability, "confirm");
    if (product.priceGhs === null) assert.equal(priceLabel(product), "Contact for Price");
    else assert.match(priceLabel(product), new RegExp(`${product.priceGhs}\\.00`));
    if (product.imageIsPlaceholder) assert.equal(product.isSample, true);
  }
});

test("all 103 unique supplied photos are used with at most two photos per listing", () => {
  const images = new Set(products.flatMap(productImages));
  assert.equal(new Set(products.map(product => product.id)).size, products.length);
  for (const product of products) assert.ok(productImages(product).length <= 2, `${product.name} has at most two photos`);
  assert.equal([...images].filter(image => image.startsWith("/products/collection/")).length, 103);
  for (const image of readdirSync("public/products/collection")) assert.ok(images.has(`/products/collection/${image}`), `Supplied photo is visible: ${image}`);
  for (const image of images) assert.ok(existsSync(path.resolve("public", image.slice(1))), image);
  const photoNecklace = products.find(product => product.id === "photo-customized-necklace")!;
  assert.equal(photoNecklace.imageIsReference, false);
  assert.match(photoNecklace.image, /portrait-photo-necklace/);
  assert.equal(photoNecklace.requiresPhoto, true);
});

test("unpriced home items and non-watch sets keep quotes and relevant placeholders are replaced", () => {
  for (const category of ["Home & Living", "Curtains", "Bedsheets"]) {
    const entries = products.filter(product => product.category === category && !product.id.endsWith("floor-mirror"));
    assert.ok(entries.length > 0);
    assert.ok(entries.every(product => product.priceGhs === null && !product.imageIsPlaceholder && !product.isSample));
  }
  assert.equal(products.filter(product => product.imageIsPlaceholder).length, 3);
  const set = products.find(product => product.id === "photo-necklace-bracelet-set")!;
  const message = createOrderMessage([{ productId: set.id, quantity: 1, customization: "Own photo and name" }], products);
  assert.match(message, /Photo Necklace & Bracelet Gift Set/);
  assert.match(message, /Price: please quote/);
  assert.doesNotMatch(message, /Listed unit price/);
  for (const id of ["wood-look-gift-set", "joyceline-necklace-bracelet-set", "photo-necklace-bracelet-set"]) {
    assert.equal(products.find(product => product.id === id)!.priceGhs, null);
  }
});

test("jewellery and both mirrors use the latest supplied prices in the bag and draft", () => {
  const jewellery = products.filter(product => product.category === "Jewelry");
  const mirrors = products.filter(product => product.id.endsWith("floor-mirror"));
  assert.equal(jewellery.length, 3);
  assert.ok(jewellery.every(product => product.priceGhs === 60));
  assert.equal(mirrors.length, 2);
  assert.ok(mirrors.every(product => product.priceGhs === 360));
  const bag = [{ productId: jewellery[0].id, quantity: 1, customization: "" }, { productId: mirrors[0].id, quantity: 1, customization: "" }];
  assert.equal(cartPricing(bag, products).pricedSubtotal, 420);
  const message = createOrderMessage(bag, products);
  assert.match(message, /Listed unit price: GHS 60\.00/);
  assert.match(message, /Listed unit price: GHS 360\.00/);
  assert.match(message, /Items subtotal: GHS 420\.00/);
});

test("all two- and three-piece watch sets have explicit plain and customised prices", () => {
  const sets = products.filter(product => product.priceOptions);
  assert.equal(sets.length, 10);
  for (const product of sets) {
    assert.equal(product.category, "Gift Sets");
    assert.deepEqual(product.priceOptions!.map(option => [option.id, option.priceGhs]), [["plain", 350], ["customized", 400]]);
    assert.equal(unitPriceGhs(product, "plain"), 350);
    assert.equal(lineSubtotalGhs(product, 2, "customized"), 800);
    assert.equal(unitPriceGhs(product), null);
    assert.equal(unitPriceGhs(product, "invalid"), null);
  }
  assert.ok(products.find(product => product.id === "black-rectangular-watch-bracelet-set")!.priceOptions);
  assert.ok(products.find(product => product.id === "my-man-three-piece-gift-set")!.priceOptions);
});

test("watch estimates stay explicit while power-bank prices use the supplied capacities", () => {
  const watches = products.filter(product => product.category === "Watches");
  assert.ok(watches.every(product => product.priceGhs === 200 && product.priceIsEstimate));
  const bag = [
    { productId: "fashion-watches", quantity: 1, customization: "" },
    { productId: "built-in-cable-power-bank", quantity: 1, customization: "" },
    { productId: "carry-loop-power-bank", quantity: 1, customization: "" },
  ];
  assert.deepEqual(cartPricing(bag, products), { pricedSubtotal: 550, pricedQuantity: 3, unpricedQuantity: 0, hasEstimate: true });
  const message = createOrderMessage(bag, products);
  assert.match(message, /Guide unit price: GHS 200\.00/);
  assert.match(message, /Estimated items subtotal: GHS 550\.00/);
  assert.match(message, /confirm the final price for the selected model/);
  assert.match(message, /Listed unit price: GHS 150\.00/);
});

test("customisation options stay distinct, survive reload and set the WhatsApp prices", () => {
  const plain = { productId: "black-three-piece-gift-set", quantity: 1, customization: "", optionId: "plain" };
  const customized = { ...plain, quantity: 2, optionId: "customized" };
  const bag = addToCart([plain], customized);
  assert.equal(bag.length, 2);
  assert.deepEqual(parseCart(JSON.stringify(bag), products), bag.map(item => ({ ...item, referenceImage: undefined })));
  assert.equal(cartPricing(bag, products).pricedSubtotal, 1150);
  const message = createOrderMessage(bag, products);
  assert.match(message, /Customisation option: Without customisation/);
  assert.match(message, /Customisation option: With customisation/);
  assert.match(message, /Listed unit price: GHS 350\.00/);
  assert.match(message, /Listed unit price: GHS 400\.00/);
  assert.match(message, /Items subtotal: GHS 1150\.00/);
  assert.equal(parseCart(JSON.stringify([{ ...plain, optionId: "invalid", priceGhs: 1 }]), products).length, 0);
  const merged = changeCartOption(bag, cartLineKey(customized), "plain", products);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].quantity, 3);
  assert.equal(cartPricing(merged, products).pricedSubtotal, 1050);
  const full = [{ ...plain, quantity: 98 }, customized];
  assert.equal(changeCartOption(full, cartLineKey(customized), "plain", products), full);
});

test("old set enquiries stay unpriced until a customer chooses customisation", () => {
  const bag = parseCart(JSON.stringify([{ productId: "black-three-piece-gift-set", quantity: 1, customization: "Engrave Ama" }]), products);
  assert.equal(bag.length, 1);
  assert.equal(cartPricing(bag, products).unpricedQuantity, 1);
  assert.match(createOrderMessage(bag, products), /Customisation option: not selected; please confirm/);
  const selected = changeCartOption(bag, cartLineKey(bag[0]), "customized", products);
  assert.equal(cartPricing(selected, products).pricedSubtotal, 400);
});

test("selected photo references stay distinct and survive storage safely", () => {
  const product = products[0];
  const referenceImage = productImages(product)[1];
  const item = { productId: product.id, quantity: 1, customization: "Ama", referenceImage };
  const bag = addToCart([{ ...item, referenceImage: undefined }], item);
  assert.equal(bag.length, 2);
  const restored = parseCart(JSON.stringify(bag), products);
  assert.equal(restored[1].referenceImage, referenceImage);
  assert.equal(parseCart(JSON.stringify([{ ...item, referenceImage: "https://invalid.example/photo.jpg" }]), products).length, 0);
});

test("split photo listings keep their own price and migrate saved gallery selections", () => {
  const raw = JSON.stringify([
    { productId: "customized-bracelets", quantity: 2, customization: "Ama", referenceImage: "/products/collection/bracelet-kobby.jpg" },
    { productId: "customized-bracelets", quantity: 1, customization: "Ama", referenceImage: "/products/collection/bracelet-micheal.jpg" },
    { productId: "personalized-name-necklaces", quantity: 1, customization: "Esi", referenceImage: "/products/collection/bar-necklace.jpg" },
    { productId: "customized-rings", quantity: 1, customization: "Kofi", referenceImage: "/products/collection/black-ring.jpg" },
  ]);
  const cart = parseCart(raw, products);
  assert.deepEqual(cart.map(item => item.productId), ["bracelet-kobby", "bracelet-micheal", "bar-necklace", "black-ring"]);
  assert.equal(cartPricing(cart, products).pricedSubtotal, 540);
  assert.ok(cart.every(item => item.referenceImage === undefined));
  const message = createOrderMessage(cart, products);
  assert.match(message, /Kobby Style Bracelet/);
  assert.match(message, /Micheal Style Bracelet/);
  assert.match(message, /Personalized Bar Necklace/);
  assert.match(message, /Black Band Ring/);
});

test("mixed-price bags show only known subtotals and keep unknown quotes separate", () => {
  const bag = [{ productId: "customized-bracelets", quantity: 2, customization: "" }, { productId: "personalized-diaries", quantity: 3, customization: "" }];
  assert.deepEqual(cartPricing(bag, products), { pricedSubtotal: 260, pricedQuantity: 2, unpricedQuantity: 3, hasEstimate: false });
  assert.equal(lineSubtotalGhs(products[0], 2), 260);
  assert.equal(lineSubtotalGhs(products.find(product => product.id === "personalized-diaries")!, 3), null);
  assert.equal(cartPricing([{ ...bag[0], quantity: 3 }], [{ ...products[0], priceGhs: 1.15 }]).pricedSubtotal, 3.45);
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

test("adding above the per-option limit never drops part of a requested quantity", () => {
  const item = { productId: products[0].id, quantity: 98, customization: "Ama" };
  const cart = [item];
  assert.equal(addToCart(cart, { ...item, quantity: 2 }), cart);
  assert.equal(cart[0].quantity, 98);
  const full = addToCart(cart, { ...item, quantity: 1 });
  assert.equal(full[0].quantity, 99);
  assert.equal(addToCart(full, { ...item, quantity: 1 }), full);
  assert.equal(addToCart([], { ...item, quantity: 100 }).length, 0);
  assert.equal(addToCart(full, { ...item, customization: "Kofi", quantity: 1 }).length, 2);
});

test("restoring untrusted duplicate lines stays bounded at the limit", () => {
  const item = { productId: products[0].id, quantity: 60, customization: "Ama" };
  assert.equal(parseCart(JSON.stringify([item, item]), products)[0].quantity, 99);
});

test("WhatsApp draft includes products, quantities, preferences and quote requests", () => {
  const cart = [{ productId: products[0].id, quantity: 3, customization: "Ési & Kofi\nInitials: A+B" }];
  const message = createOrderMessage(cart, products);
  assert.match(message, /Customized Bracelets/);
  assert.match(message, /Quantity: 3/);
  assert.ok(message.includes(cart[0].customization));
  assert.match(message, /prices in Ghana Cedis \(GHS\), availability/);
  assert.match(message, /delivery options and charges/);
  assert.match(message, /not a paid or confirmed order/);
  assert.match(message, /Listed unit price: GHS 130\.00/);
  assert.match(message, /Item subtotal: GHS 390\.00/);
  const url = new URL(createWhatsAppUrl("+233 55 735 6892", message));
  assert.equal(url.origin, "https://wa.me");
  assert.equal(url.pathname, "/233557356892");
  assert.equal(url.searchParams.get("text"), message);
});

test("WhatsApp drafts include selected styles, unpriced quotes and photo-customisation instructions", () => {
  const referenceImage = productImages(products[0])[1];
  const message = createOrderMessage([
    { productId: "customized-bracelets", quantity: 2, customization: "Ama", referenceImage },
    { productId: "photo-customized-necklace", quantity: 1, customization: "Family photo" },
    { productId: "wireless-earbuds", quantity: 1, customization: "" },
  ], products);
  assert.match(message, /Style reference: photo 2 of 2/);
  assert.match(message, /bracelet-and-necklace-set\.jpg/);
  assert.match(message, /Photo customisation: I will send my photo in this chat/);
  assert.match(message, /Priced items subtotal: GHS 400\.00/);
  assert.match(message, /Please quote for 1 item\(s\) without a listed price/);
  assert.match(message, /Price: please quote/);
});

test("invalid recipients and empty or stale enquiries cannot create checkout", () => {
  assert.throws(() => createWhatsAppUrl("javascript:123456789", "Hello"));
  assert.throws(() => createOrderMessage([], products));
  assert.throws(() => createOrderMessage([{ productId: "removed", quantity: 1, customization: "" }], products));
});
