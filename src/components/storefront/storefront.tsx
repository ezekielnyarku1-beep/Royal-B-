"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown, Crown, Gem, Gift, Heart, Info, Menu, MessageCircle, Milk, Package, PenLine, Search, ShoppingBag, Sparkles, Truck, UserRound, Watch, X } from "lucide-react";
import { Logo, ShoppingBags } from "@/components/brand";
import { categories, products, store, type Product } from "@/lib/catalogue";
import { addToCart, CART_STORAGE_KEY, cartLineKey, parseCart, type CartItem } from "@/lib/cart";
import { createWhatsAppUrl } from "@/lib/whatsapp";
import { ProductCard } from "./product-card";
import { ProductDialogContent } from "./product-dialog";
import { CartDrawer } from "./cart-drawer";

const categoryIcons = [Heart, Gem, Milk, BookOpen, PenLine, Package, Sparkles, Watch];
const contactUrl = createWhatsAppUrl(store.whatsappNumber, "Hello Big B Royale! I'd like to ask about your products, pricing, availability and delivery.");
const personalised = new Set(["Bracelets", "Necklaces", "Bottles", "Diaries", "Pens"]);

export function Storefront() {
  const [filter, setFilter] = useState("All products");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartReady, setCartReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const productDialog = useRef<HTMLDialogElement>(null);
  const cartDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    try { setCart(parseCart(localStorage.getItem(CART_STORAGE_KEY), products)); }
    catch { setNotice("Your bag works for this visit. Browser storage is unavailable."); }
    setCartReady(true);
  }, []);

  useEffect(() => {
    if (!cartReady) return;
    try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)); }
    catch { setNotice("Your bag is available for this visit, but could not be saved in this browser."); }
  }, [cart, cartReady]);

  useEffect(() => {
    function syncBag(event: StorageEvent) {
      if (event.key === CART_STORAGE_KEY || event.key === null) setCart(parseCart(event.newValue, products));
    }
    window.addEventListener("storage", syncBag);
    return () => window.removeEventListener("storage", syncBag);
  }, []);

  useEffect(() => { if (selected && !productDialog.current?.open) productDialog.current?.showModal(); }, [selected]);
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

  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const sampleListings = products.some(product => product.isSample);
  const placeholderImages = products.some(product => product.imageIsPlaceholder);
  const visible = products.filter(product => {
    const matchesFilter = filter === "All products" || filter === product.category || filter === "Personalised gifts" && personalised.has(product.category);
    const query = search.trim().toLocaleLowerCase();
    return matchesFilter && (!query || `${product.name} ${product.category}`.toLocaleLowerCase().includes(query));
  }).sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : 0);

  function selectCategory(category: string) { setFilter(category); setMobileMenu(false); }
  function addItem(item: CartItem) {
    const next = addToCart(cart, item);
    if (next === cart) return false;
    setCart(next);
    setNotice(`${products.find(p => p.id === item.productId)?.name} added to your bag.`);
    productDialog.current?.close();
    return true;
  }

  return <div className="storefront">
    <a className="shop-skip-link" href="#collection">Skip to products</a>
    <div className="store-announcement"><Sparkles size={13}/><span>A little everyday luxury. A personal touch.</span><Sparkles size={13}/></div>
    <header className="store-header">
      <div className="store-container store-header-main">
        <Link className="store-logo-link" href="/shop/" aria-label="Big B Royale shop home"><Logo light/></Link>
        <form className="store-search" role="search" onSubmit={event => { event.preventDefault(); document.getElementById("collection")?.scrollIntoView({ behavior: "auto" }); }}>
          <Search size={19} aria-hidden="true"/><input aria-label="Search products" placeholder="Find your next favourite…" value={search} onChange={event => setSearch(event.target.value)}/>
          {search ? <button type="button" aria-label="Clear search" onClick={() => setSearch("")}><X size={17}/></button> : <button type="submit" aria-label="Search the collection"><ArrowRight size={18}/></button>}
        </form>
        <div className="store-header-actions"><Link className="store-account" href="/" aria-label="Log in or sign up"><UserRound size={21}/><span>Your account</span></Link><button type="button" className="header-bag" aria-label={`Open shopping bag, ${count} ${count === 1 ? "item" : "items"}`} onClick={() => setCartOpen(true)}><ShoppingBag size={22}/><span className="bag-label">Your bag</span><span className="bag-count">{count}</span></button><button className="mobile-menu-button" type="button" aria-label={mobileMenu ? "Close navigation" : "Open navigation"} aria-expanded={mobileMenu} aria-controls="store-navigation" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X size={23}/> : <Menu size={23}/>}</button></div>
      </div>
      <nav className={`store-navigation ${mobileMenu ? "menu-open" : ""}`} id="store-navigation" aria-label="Store navigation"><div className="store-container"><div className="store-navigation-links"><a className={filter === "All products" ? "nav-active" : ""} href="#collection" onClick={() => selectCategory("All products")}>Shop all<ChevronDown size={12}/></a><a href="#collection" onClick={() => selectCategory("Personalised gifts")}>Personalised gifts</a><a href="#collection" onClick={() => selectCategory("Jewelry")}>Jewelry</a><a href="#collection" onClick={() => selectCategory("Bedsheets")}>Home & living</a><a href="#how-to-order" onClick={() => setMobileMenu(false)}>How to order</a></div><span className="store-location"><span className="ghana-flag" aria-hidden="true"><span>★</span></span>Ghana <span>·</span> GHS</span></div></nav>
    </header>
    <main>
      <section className="store-hero" aria-labelledby="store-hero-title"><div className="store-container hero-grid">
        <div className="hero-copy"><span className="hero-eyebrow"><span/>THOUGHTFUL FINDS. PERSONAL TOUCHES.</span><h1 id="store-hero-title">Your everyday,<br/><em>made personal.</em></h1><p>For your moments. For your people. For you.<br/>Discover the little things that mean a little more.</p><div className="hero-actions"><a href="#collection" className="shop-button shop-button-white" onClick={() => selectCategory("All products")}>Explore the collection<ArrowRight size={18}/></a><a className="hero-how-link" href="#how-to-order">How to order<ArrowUpRight size={16}/></a></div><span className="hero-footnote"><MessageCircle size={15}/>Choose it. Personalise it. Let’s talk on WhatsApp.</span></div>
        <div className="hero-art" aria-hidden="true"><span className="hero-art-caption">A LITTLE EVERYDAY LUXURY</span><ShoppingBags/><div className="hero-gift-note"><span><Gift size={22} strokeWidth={1.4}/></span><div>It’s the thought that counts.<small>Make the little things yours.</small></div><Sparkles size={17}/></div></div>
      </div><div className="hero-bottom-line store-container"><span>PERSONALISE YOUR EVERYDAY</span><span>EXPLORE A LITTLE MORE <ArrowDown size={12}/></span></div></section>
      <section className="store-benefits" aria-label="A thoughtful way to shop"><div className="store-container benefits-grid"><div><Gift size={25} strokeWidth={1.4}/><p>Personal touches<small>Share your own names, ideas & preferences</small></p></div><div><MessageCircle size={25} strokeWidth={1.4}/><p>A real conversation<small>Confirm the details directly on WhatsApp</small></p></div><div><Truck size={26} strokeWidth={1.4}/><p>Delivery, your way<small>Get delivery charges for your location</small></p></div></div></section>
      <section className="category-section store-container" aria-labelledby="categories-heading"><div className="section-kicker"><span/>A LITTLE SOMETHING FOR EVERYONE</div><div className="section-heading"><h2 id="categories-heading">Find your kind of lovely.</h2><a href="#collection" className="shop-text-link" onClick={() => selectCategory("All products")}>Explore all categories<ArrowUpRight size={16}/></a></div><div className="category-grid">{categories.map((category, index) => { const Icon = categoryIcons[index] || Gift; return <a href="#collection" key={category} onClick={() => selectCategory(category)} className={filter === category ? "category-selected" : ""}><span className="category-icon"><Icon size={27} strokeWidth={1.3}/></span><span>{category}</span><ArrowUpRight className="category-arrow" size={13}/></a>; })}</div></section>
      <section className="collection-section" id="collection" aria-labelledby="collection-heading"><div className="store-container"><div className="section-kicker"><span/>THE BIG B ROYALE COLLECTION</div><div className="section-heading collection-heading"><div><h2 id="collection-heading">Little finds. Big meaning.</h2><p>Explore gifting ideas and everyday favourites, with your own personal touch.</p></div><label className="sort-label" htmlFor="product-sort">Sort by<select id="product-sort" value={sort} onChange={event => setSort(event.target.value)}><option value="featured">Featured</option><option value="name">Name: A–Z</option></select></label></div>
        <div className="collection-filters" role="group" aria-label="Filter products by category">{["All products", ...categories].map(category => <button type="button" key={category} aria-pressed={filter === category} onClick={() => setFilter(category)}>{category}</button>)}</div>
        {(sampleListings || placeholderImages) && <div className="catalogue-notice"><Info size={17}/><p><strong>A first look at our collection.</strong> {sampleListings ? "Sample listings are marked." : ""} {placeholderImages ? "Images marked as illustrative placeholders are not actual product photos." : ""} Prices, styles and availability are confirmed with the seller on WhatsApp.</p></div>}
        <div className="collection-count" role="status" aria-live="polite">{visible.length} {visible.length > 0 && visible.every(product => product.isSample) ? "sample " : ""}{visible.length === 1 ? "product" : "products"}{search && ` matching “${search}”`}{filter !== "All products" && ` · ${filter}`}</div>
        {visible.length ? <div className="product-grid">{visible.map(product => <ProductCard key={product.id} product={product} onSelect={setSelected}/>)}</div> : <div className="empty-search"><Search size={31} strokeWidth={1.4}/><h3>No finds just yet.</h3><p>Try a different search or explore the full collection.</p><button className="shop-button" type="button" onClick={() => { setSearch(""); setFilter("All products"); }}>Show all products<ArrowRight size={17}/></button></div>}
      </div></section>
      <section className="order-section" id="how-to-order" aria-labelledby="order-heading"><div className="store-container order-grid"><div><div className="hero-eyebrow"><span/>A PERSONAL WAY TO SHOP</div><h2 id="order-heading">A few little steps.<br/><em>Something truly yours.</em></h2><p>No online payment. No complicated checkout.<br/>Just you, your ideas, and a conversation.</p><a href={contactUrl} target="_blank" rel="noopener noreferrer" className="shop-text-link">Talk to us on WhatsApp<ArrowUpRight size={16}/></a></div><ol className="order-steps"><li><span>01</span><div><h3>Find your favourites</h3><p>Browse the sample collection and choose what catches your eye.</p></div><ShoppingBag size={22} strokeWidth={1.3}/></li><li><span>02</span><div><h3>Make it personal</h3><p>Choose quantities and tell us about names, styles or special requests.</p></div><PenLine size={22} strokeWidth={1.3}/></li><li><span>03</span><div><h3>Let’s make it happen</h3><p>Send your bag on WhatsApp. We’ll confirm pricing, availability, customisation and delivery charges.</p></div><MessageCircle size={22} strokeWidth={1.3}/></li></ol></div></section>
      <section className="store-note store-container" aria-labelledby="story-heading"><span><Crown size={25} strokeWidth={1.2}/></span><h2 id="story-heading">Thoughtfully chosen. Personally yours.</h2><p>From a name on a necklace to a note in a diary, the small details make it personal.<br/>Welcome to Big B Royale. A little everyday luxury, with a touch of you.</p><span className="note-signature">Big B Royale</span></section>
    </main>
    <footer className="store-footer"><div className="store-container"><div className="footer-grid"><div className="footer-brand"><Logo light/><p>Everyday finds. Thoughtful gifts.<br/>A little royal treatment, just for you.</p><span className="footer-ghana"><span className="ghana-flag" aria-hidden="true"><span>★</span></span>Proudly Ghanaian</span></div><div><h2>Explore</h2><a href="#collection" onClick={() => selectCategory("All products")}>Shop the collection</a><a href="#collection" onClick={() => selectCategory("Personalised gifts")}>Personalised gifts</a><a href="#how-to-order">How to order</a><Link href="/">Your account</Link></div><div><h2>Let’s talk</h2><a href={contactUrl} target="_blank" rel="noopener noreferrer">WhatsApp us<ArrowUpRight size={13}/></a><a href={contactUrl} target="_blank" rel="noopener noreferrer">{store.whatsappDisplay}</a><p>Questions, personalisation or delivery?<br/>A conversation is a lovely place to start.</p></div><div className="footer-delivery"><Truck size={24} strokeWidth={1.3}/><h2>A note on delivery</h2><p>{store.delivery}</p><span>All quotes are in Ghana Cedis (GHS).</span></div></div><div className="footer-bottom"><span>© 2026 Big B Royale. All rights reserved.</span><span>Royal in the details.</span><a href="#store-hero-title">Back to top ↑</a></div></div></footer>
    <a className="floating-whatsapp" href={contactUrl} target="_blank" rel="noopener noreferrer" aria-label="Chat with Big B Royale on WhatsApp"><MessageCircle size={21}/><span>Let’s chat</span><ArrowUpRight size={14}/></a>
    <div className="shop-toast-region" role="status" aria-live="polite" aria-atomic="true">{notice && <div className="shop-toast"><Check size={18}/><span>{notice}</span><button type="button" aria-label="Dismiss notification" onClick={() => setNotice("")}><X size={16}/></button></div>}</div>
    <dialog className="shop-dialog product-dialog" ref={productDialog} aria-labelledby="product-dialog-title" onClose={() => setSelected(null)}>{selected && <ProductDialogContent key={selected.id} product={selected} onClose={() => productDialog.current?.close()} onAdd={addItem}/>}</dialog>
    <dialog className="shop-dialog cart-dialog" ref={cartDialog} aria-labelledby="cart-dialog-title" onClose={() => setCartOpen(false)}><CartDrawer items={cart} onClose={() => cartDialog.current?.close()} onUpdate={(key, quantity) => setCart(items => items.map(item => cartLineKey(item) === key ? { ...item, quantity } : item))} onRemove={key => setCart(items => items.filter(item => cartLineKey(item) !== key))}/></dialog>
  </div>;
}
