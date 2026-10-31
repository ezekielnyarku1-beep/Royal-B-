"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Check, Circle, Crown, Gem, Gift, Heart, Info, MessageCircle, Milk, Package, PenLine, PlugZap, Search, ShoppingBag, Sparkles, Truck, Watch, X, type LucideIcon } from "lucide-react";
import { Logo, ShoppingBags } from "@/components/brand";
import { availabilityLabel, store, type Product } from "@/lib/catalogue";
import { useCatalogue } from "@/components/commerce-provider";
import { useSavedProducts } from "@/hooks/use-saved-products";
import { addToCart, CART_STORAGE_KEY, cartLineKey, changeCartOption, MAX_CUSTOMIZATION_LENGTH, MAX_QUANTITY, parseCart, type CartItem } from "@/lib/cart";
import { createWhatsAppUrl } from "@/lib/whatsapp";
import { ProductCard } from "./product-card";
import { ProductDialogContent } from "./product-dialog";
import { CartDrawer } from "./cart-drawer";
import { BAG_CHANGED_EVENT, OPEN_BAG_EVENT } from "@/lib/bag-events";

const categoryIcons: Record<string, LucideIcon> = { Bracelets: Heart, Necklaces: Gem, Rings: Circle, Electronics: PlugZap, Bottles: Milk, Diaries: BookOpen, Pens: PenLine, Bedsheets: Package, Jewelry: Sparkles, Watches: Watch, "Gift Sets": Gift, "Home & Living": Package, Curtains: Package };
const contactUrl = createWhatsAppUrl(store.whatsappNumber, "Hello Big B Royale! I'd like to ask about your products, pricing, availability and delivery.");
const personalised = new Set(["Bracelets", "Necklaces", "Rings", "Bottles", "Diaries", "Pens", "Gift Sets"]);
const homeCategories = new Set(["Bedsheets", "Home & Living", "Curtains"]);

export function Storefront() {
  const { products, loading } = useCatalogue();
  const categories = [...new Set(products.map(product => product.category))];
  const saved = useSavedProducts();
  const [filter, setFilter] = useState("All products");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(12);
  const [sort, setSort] = useState("featured");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = products.find(product => product.id === selectedId) ?? null;
  const setSelected = (product: Product | null) => setSelectedId(product?.id ?? null);
  const [storedCart, setCart] = useState<CartItem[]>([]);
  const cart = parseCart(JSON.stringify(storedCart), products);
  const [cartReady, setCartReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const productDialog = useRef<HTMLDialogElement>(null);
  const cartDialog = useRef<HTMLDialogElement>(null);
  const bagRequestHandled = useRef(false);

  useEffect(() => {
    if (loading || cartReady) return;
    try { setCart(parseCart(localStorage.getItem(CART_STORAGE_KEY), products)); }
    catch { setNotice("Your bag works for this visit. Browser storage is unavailable."); }
    setCartReady(true);
  }, [products, loading, cartReady]);

  useEffect(() => {
    if (!cartReady) return;
    try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(parseCart(JSON.stringify(storedCart), products))); }
    catch { setNotice("Your bag is available for this visit, but could not be saved in this browser."); }
  }, [storedCart, products, cartReady]);

  useEffect(() => {
    function syncBag(event: StorageEvent) {
      if (event.key === CART_STORAGE_KEY || event.key === null) setCart(parseCart(event.newValue, products));
    }
    window.addEventListener("storage", syncBag);
    return () => window.removeEventListener("storage", syncBag);
  }, [products]);

  useEffect(() => {
    if (selected && !productDialog.current?.open) productDialog.current?.showModal();
    if (!selected && productDialog.current?.open) { productDialog.current.close(); setNotice("This product is no longer listed."); }
  }, [selected]);
  useEffect(() => {
    if (loading) return;
    const query = new URLSearchParams(window.location.search);
    if (query.get("bag") === "open" && !bagRequestHandled.current) {
      bagRequestHandled.current = true;
      setCartOpen(true);
    }
    const category = query.get("category");
    if (category && products.some(product => product.category === category)) setFilter(category);
    const id = query.get("product");
    if (!id) return;
    const product = products.find(product => product.id === id);
    if (product) setSelected(product);
    else setNotice("This product is no longer listed.");
    query.delete("product");
    window.history.replaceState(null, "", `/shop/${query.size ? `?${query}` : ""}`);
  }, [loading, products]);
  useEffect(() => { if (cartOpen && !cartDialog.current?.open) cartDialog.current?.showModal(); }, [cartOpen]);
  useEffect(() => {
    if (!selected && !cartOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [selected, cartOpen]);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 6500);
    return () => clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    if (cartReady) window.dispatchEvent(new CustomEvent(BAG_CHANGED_EVENT, { detail: cart.reduce((total, item) => total + item.quantity, 0) }));
  }, [cartReady, storedCart, products]);
  useEffect(() => {
    const open = () => setCartOpen(true);
    window.addEventListener(OPEN_BAG_EVENT, open);
    return () => window.removeEventListener(OPEN_BAG_EVENT, open);
  }, []);
  const sampleListings = products.some(product => product.isSample);
  const placeholderImages = products.some(product => product.imageIsPlaceholder);
  const visible = products.filter(product => {
    const matchesFilter = filter === "All products" || filter === product.category || filter === "Personalised gifts" && personalised.has(product.category) || filter === "Home & living" && homeCategories.has(product.category);
    const query = search.trim().toLocaleLowerCase().replaceAll(",", "");
    return matchesFilter && (!query || `${product.name} ${product.category}`.toLocaleLowerCase().replaceAll(",", "").includes(query));
  }).sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : 0);

  useEffect(() => { setPageSize(12); }, [filter, search, sort]);

  function selectCategory(category: string) { setFilter(category); }
  function updateOption(key: string, optionId: string) {
    const next = changeCartOption(cart, key, optionId, products);
    if (next === cart) return `This would exceed the limit of ${MAX_QUANTITY} for the same option and preferences. Reduce the quantity first.`;
    setCart(next);
    return null;
  }
  function addItem(item: CartItem) {
    if (!cartReady) return "Your bag is still loading. Please try again in a moment.";
    const product = products.find(product => product.id === item.productId);
    if (!product || availabilityLabel(product) === "Unavailable") return "This product is currently unavailable.";
    if (product.priceOptions && !product.priceOptions.some(option => option.id === item.optionId)) return "Please choose a current customisation option.";
    const requested = cart.filter(line => line.productId === item.productId).reduce((total, line) => total + line.quantity, 0) + item.quantity;
    if (product.stockQuantity != null && requested > product.stockQuantity) return `The listed quantity available is ${product.stockQuantity}. Please reduce the quantity in your bag.`;
    const normalized = { ...item, customization: item.customization.trim().slice(0, MAX_CUSTOMIZATION_LENGTH) };
    const existing = cart.find(line => cartLineKey(line) === cartLineKey(normalized));
    if (existing && existing.quantity + item.quantity > MAX_QUANTITY) {
      const remaining = MAX_QUANTITY - existing.quantity;
      return remaining > 0
        ? `Your bag already has ${existing.quantity} with these preferences. You can add up to ${remaining} more (maximum ${MAX_QUANTITY}).`
        : `Your bag has reached the limit of ${MAX_QUANTITY} with these preferences. Please change the quantity in your bag before adding more.`;
    }
    const next = addToCart(cart, normalized);
    if (next === cart) return "Your bag is full. Please remove an item before adding another.";
    setCart(next);
    setNotice(`${products.find(p => p.id === item.productId)?.name} added to your bag.`);
    productDialog.current?.close();
    return null;
  }

  return <div className="storefront" id="shop-top">
    <a className="shop-skip-link" href="#collection">Skip to products</a>
    <main>
      <div className="store-announcement"><span>Shop online. Confirm your order on WhatsApp.</span></div>
      <div className="shop-search-area store-container"><form className="store-search" role="search" onSubmit={event => { event.preventDefault(); event.currentTarget.querySelector("input")?.blur(); document.getElementById("collection")?.scrollIntoView({ behavior: "auto" }); }}>
          <Search size={19} aria-hidden="true"/><input aria-label="Search products" inputMode="search" enterKeyHint="search" placeholder="Search products" value={search} onChange={event => { setSearch(event.target.value); setFilter("All products"); }}/>
          {search ? <button type="button" aria-label="Clear search" onClick={() => setSearch("")}><X size={17}/></button> : <button type="submit" aria-label="Search the collection"><ArrowRight size={18}/></button>}
        </form></div>
      <section className="store-hero" aria-labelledby="store-hero-title"><div className="store-container hero-grid">
        <div className="hero-copy"><span className="hero-eyebrow"><span/>THOUGHTFUL FINDS. PERSONAL TOUCHES.</span><h1 id="store-hero-title">Shop Big B Royale</h1><p>Personalised gifts, watches and home essentials.</p><div className="hero-actions"><a href="#collection" className="shop-button shop-button-white" onClick={() => selectCategory("All products")}>Browse products<ArrowRight size={18}/></a><a className="hero-how-link" href="/about/#how-to-order">How to order<ArrowUpRight size={16}/></a></div><span className="hero-footnote"><MessageCircle size={15}/>Choose it. Personalise it. Let’s talk on WhatsApp.</span></div>
        <div className="hero-art" aria-hidden="true"><span className="hero-art-caption">A LITTLE EVERYDAY LUXURY</span><ShoppingBags/><div className="hero-gift-note"><span><Gift size={22} strokeWidth={1.4}/></span><div>It’s the thought that counts.<small>Make the little things yours.</small></div><Sparkles size={17}/></div></div>
      </div><div className="hero-bottom-line store-container"><span>PERSONALISE YOUR EVERYDAY</span><span>EXPLORE A LITTLE MORE <ArrowDown size={12}/></span></div></section>
      <section className="store-benefits" aria-label="A thoughtful way to shop"><div className="store-container benefits-grid"><div><Gift size={25} strokeWidth={1.4}/><p>Personal touches<small>Share your own names, ideas & preferences</small></p></div><div><MessageCircle size={25} strokeWidth={1.4}/><p>A real conversation<small>Confirm the details directly on WhatsApp</small></p></div><div><Truck size={26} strokeWidth={1.4}/><p>Delivery, your way<small>Get delivery charges for your location</small></p></div></div></section>
      <section className="category-section store-container" aria-labelledby="categories-heading"><div className="section-kicker"><span/>A LITTLE SOMETHING FOR EVERYONE</div><div className="section-heading"><h2 id="categories-heading">Shop by category</h2><a href="#collection" className="shop-text-link" onClick={() => selectCategory("All products")}>Explore all categories<ArrowUpRight size={16}/></a></div><div className="category-grid">{categories.map(category => { const Icon = categoryIcons[category] || Gift; return <a href="#collection" key={category} onClick={() => selectCategory(category)} className={filter === category ? "category-selected" : ""}><span className="category-icon"><Icon size={27} strokeWidth={1.3}/></span><span>{category}</span><ArrowUpRight className="category-arrow" size={13}/></a>; })}</div></section>
      <section className="collection-section" id="collection" aria-labelledby="collection-heading"><div className="store-container"><div className="section-kicker"><span/>THE BIG B ROYALE COLLECTION</div><div className="section-heading collection-heading"><div><h2 id="collection-heading">Browse products</h2><p>Choose a product to see its options.</p></div><label className="sort-label" htmlFor="product-sort">Sort by<select id="product-sort" value={sort} onChange={event => setSort(event.target.value)}><option value="featured">Featured</option><option value="name">Name: A–Z</option></select></label></div>
        <div className="collection-filters" role="group" aria-label="Filter products by category">{["All products", ...(products.some(product => personalised.has(product.category)) ? ["Personalised gifts"] : []), ...(products.some(product => homeCategories.has(product.category)) ? ["Home & living"] : []), ...categories].map(category => <button type="button" key={category} aria-pressed={filter === category} onClick={() => setFilter(category)}>{category}</button>)}</div>
        {(sampleListings || placeholderImages) && <div className="catalogue-notice"><Info size={17}/><p><strong>Product information</strong> {sampleListings ? "Sample listings are marked." : ""} {placeholderImages ? "Placeholder images are labelled." : ""} Confirm availability on WhatsApp.</p></div>}
        <div className="collection-count" role="status" aria-live="polite">{visible.length} {visible.length > 0 && visible.every(product => product.isSample) ? "sample " : ""}{visible.length === 1 ? "product" : "products"}{search && ` matching “${search}”`}{filter !== "All products" && ` · ${filter}`}</div>
        {visible.length ? <div className="product-grid">{visible.slice(0, pageSize).map(product => <ProductCard key={product.id} product={product} onSelect={setSelected} saved={saved.ids.includes(product.id)} saving={saved.pending.includes(product.id)} onSave={() => void saved.toggle(product.id)}/>)}</div> : <div className="empty-search"><Search size={31} strokeWidth={1.4}/><h3>No products found.</h3><p>Try another search or category.</p><button className="shop-button" type="button" onClick={() => { setSearch(""); setFilter("All products"); }}>Show all products<ArrowRight size={17}/></button></div>}
        {visible.length > 0 && <div className="collection-pagination"><p role="status">Showing {Math.min(pageSize, visible.length)} of {visible.length} products</p>{pageSize < visible.length && <button type="button" className="shop-button" onClick={() => setPageSize(size => size + 12)}>Show more<ArrowDown size={16}/></button>}</div>}
      </div></section>
      <section className="shop-help store-container" id="shopping-help" aria-labelledby="shopping-help-title"><div><span className="shop-eyebrow">Here to help</span><h2 id="shopping-help-title">A few things to know</h2><p>Speak directly with Big B Royale about your selection.</p><a className="shop-button" href={contactUrl} target="_blank" rel="noopener noreferrer">WhatsApp us<ArrowUpRight size={18}/></a><a className="shop-help-phone" href="tel:+233557356892">{store.whatsappDisplay}</a></div><div className="shop-help-questions"><details><summary>Delivery and preparation</summary><p>Share your town or city on WhatsApp. The seller will confirm delivery charges and the preparation and delivery times for your items before you confirm your order.</p></details><details><summary>Customisation and product details</summary><p>Tell us your preferred name, photo, colour, size or finish in the product notes. Available materials, dimensions and personalisation options are confirmed with the seller. For photo gifts, send your image in the WhatsApp chat.</p></details><details><summary>Changes, returns and problems</summary><p>Contact the seller to agree on cancellation, return and exchange terms before confirming your order, especially for personalised items. If something is wrong, send your order details and photos on WhatsApp so the seller can help.</p></details><details><summary>Ordering and payment</summary><p>You can browse and send a WhatsApp enquiry without an account. Sending your bag opens a draft for you to review. Pricing, availability, delivery and payment arrangements are agreed with the seller; this website does not take online payment.</p></details></div></section>
      <section className="store-note store-container" aria-labelledby="story-heading"><span><Crown size={25} strokeWidth={1.2}/></span><h2 id="story-heading">Thoughtfully chosen. Personally yours.</h2><p>From a name on a necklace to a note in a diary, the small details make it personal.<br/>Welcome to Big B Royale. A little everyday luxury, with a touch of you.</p><span className="note-signature">Big B Royale</span></section>
    </main>
    <footer className="store-footer"><div className="store-container"><div className="footer-grid"><div className="footer-brand"><Logo light/><p>Personalised gifts and everyday essentials.</p><span className="footer-ghana"><span className="ghana-flag" aria-hidden="true"><span>★</span></span>Proudly Ghanaian · Ghana / GHS</span></div><div><h2>Explore</h2><Link href="/">Home</Link><a href="#collection" onClick={() => selectCategory("All products")}>Shop the collection</a><a href="#collection" onClick={() => selectCategory("Personalised gifts")}>Personalised gifts</a><a href="/about/#how-to-order">How to order</a><a href="#shopping-help">Delivery & help</a><Link href="/account/">Your account</Link><Link href="/account/?tab=orders">Track orders</Link></div><div><h2>Let’s talk</h2><a href={contactUrl} target="_blank" rel="noopener noreferrer">WhatsApp us<ArrowUpRight size={13}/></a><a href={contactUrl} target="_blank" rel="noopener noreferrer">{store.whatsappDisplay}</a><p>Questions about a product or your order? Send us a message.</p></div><div className="footer-delivery"><Truck size={24} strokeWidth={1.3}/><h2>A note on delivery</h2><p>{store.delivery}</p><span>All quotes are in Ghana Cedis (GHS).</span></div></div><div className="footer-bottom"><span>© 2026 Big B Royale. All rights reserved.</span><span></span><a href="#store-hero-title">Back to top ↑</a></div></div></footer>
    <a className="shop-back-top" href="#shop-top" aria-label="Back to top">↑ Top</a>
    <a className="floating-whatsapp" href={contactUrl} target="_blank" rel="noopener noreferrer" aria-label="Chat with Big B Royale on WhatsApp"><MessageCircle size={21}/><span>WhatsApp</span><ArrowUpRight size={14}/></a>
    <div className="shop-toast-region" role="status" aria-live="polite" aria-atomic="true">{(notice || saved.error) && <div className="shop-toast"><Check size={18}/><span>{saved.error || notice}{saved.error && !saved.user && <> <Link href="/login/">Sign in</Link></>}</span><button type="button" aria-label="Dismiss notification" onClick={() => { setNotice(""); saved.clearError(); }}><X size={16}/></button></div>}</div>
    <dialog className="shop-dialog product-dialog" ref={productDialog} aria-labelledby="product-dialog-title" onClose={() => setSelected(null)}>{selected && <ProductDialogContent key={selected.id} product={selected} ready={cartReady} onClose={() => productDialog.current?.close()} onAdd={addItem}/>}</dialog>
    <dialog className="shop-dialog cart-dialog" ref={cartDialog} aria-labelledby="cart-dialog-title" onClose={() => setCartOpen(false)}><CartDrawer items={cart} products={products} ready={cartReady} onClose={() => cartDialog.current?.close()} onUpdate={(key, quantity) => setCart(items => items.map(item => cartLineKey(item) === key ? { ...item, quantity } : item))} onOptionChange={updateOption} onRemove={key => setCart(items => items.filter(item => cartLineKey(item) !== key))}/></dialog>
  </div>;
}
