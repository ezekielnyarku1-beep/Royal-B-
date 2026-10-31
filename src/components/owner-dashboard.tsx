"use client";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { WorkspaceShell } from "./workspace-shell";
import { OrderList } from "./orders/order-list";
import { useCatalogue } from "./commerce-provider";
import { useOwnerAccess } from "@/hooks/use-owner-access";
import { commerceError, fetchOrders, fetchOwnerProducts, saveOwnerProduct, uploadProductPhoto } from "@/lib/commerce";
import { availabilityLabel, formatPrice, type Product } from "@/lib/catalogue";
import { productImageSrc } from "@/lib/product-image";
import type { StoreOrder, StoreProductRow } from "@/lib/commerce-types";

export function OwnerDashboard() {
  const access = useOwnerAccess();
  const { reload: refreshCatalogue } = useCatalogue();
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState<StoreProductRow[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<StoreProductRow | "new" | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const currentUser = useRef(access.user?.id); currentUser.current = access.user?.id;
  const reload = useCallback(async () => {
    if (!access.owner) return;
    const userId = access.user?.id;
    setBusy(true); setError("");
    try {
      const [rows, requests] = await Promise.all([fetchOwnerProducts(), fetchOrders()]);
      if (currentUser.current === userId) { setProducts(rows); setOrders(requests); }
    } catch (failure) { if (currentUser.current === userId) setError(commerceError(failure)); }
    finally { if (currentUser.current === userId) setBusy(false); }
  }, [access.owner, access.user?.id]);
  useEffect(() => { setProducts([]); setOrders([]); setEditing(null); void reload(); }, [reload]);
  useEffect(() => {
    if (!editing) return;
    dialog.current?.showModal();
    const previous = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [editing]);
  const matches = products.filter(row => `${row.details.name} ${row.details.category}`.toLowerCase().includes(search.toLowerCase()));
  return <WorkspaceShell title="Owner dashboard" subtitle="Manage products and customer requests." owner signedIn={Boolean(access.user)} tab={access.owner ? tab : undefined} onTab={setTab}>
    {access.loading || access.checking ? <p role="status">Checking access...</p> : !access.user ? <section className="workspace-empty"><h2>Sign in to continue</h2><Link href="/login/" className="workspace-button">Log in</Link></section> : access.error ? <p className="workspace-error" role="alert">{access.error}</p> : !access.owner ? <section className="workspace-empty"><h2>Owner access required</h2><p>This account cannot manage the store.</p><Link href="/account/" className="workspace-button">My account</Link></section> : <>
      {error && <p className="workspace-error" role="alert">{error}<button type="button" onClick={() => void reload()}>Try again</button></p>}
      {tab === "products" ? <section aria-busy={busy}><div className="workspace-section-heading"><h2>Products <span>({products.length})</span></h2><button type="button" className="workspace-button" onClick={() => setEditing("new")}><Plus size={19}/>Add product</button></div><label className="owner-search">Find a product<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by name or category"/></label>{busy && products.length === 0 ? <p role="status">Loading products...</p> : <div className="owner-products">{matches.map(row => <button type="button" className="owner-product" key={row.id} onClick={() => setEditing(row)}><Image src={productImageSrc(row.details.image)} alt="" width={88} height={88} sizes="88px" loading="lazy"/><div><h3>{row.details.name}</h3><p>{row.details.category} · {row.details.priceOptions ? "Price options" : row.details.priceGhs === null ? "Contact for Price" : formatPrice(row.details.priceGhs)}</p><p>{row.active ? availabilityLabel({ ...row.details, availability: row.stock_status, stockQuantity: row.stock_quantity }) : "Hidden from shop"}{row.stock_quantity !== null && ` · ${row.stock_quantity} in stock`}</p></div><span>Edit</span></button>)}</div>}{!busy && matches.length === 0 && <p>No matching products.</p>}</section> : <OrderList orders={orders} owner onRefresh={() => { void reload(); void refreshCatalogue(); }} busy={busy}/>}
      <dialog className="workspace-dialog" ref={dialog} aria-labelledby="product-editor-title" onClose={() => setEditing(null)}>{editing && <ProductEditor key={editing === "new" ? "new" : editing.id} row={editing === "new" ? null : editing} categories={[...new Set(products.map(row => row.details.category))]} onClose={() => dialog.current?.close()} onSaved={() => { dialog.current?.close(); void reload(); void refreshCatalogue(); }}/>}</dialog>
    </>}
  </WorkspaceShell>;
}

function ProductEditor({ row, categories, onClose, onSaved }: { row: StoreProductRow | null; categories: string[]; onClose: () => void; onSaved: () => void }) {
  const [product, setProduct] = useState<Product>(row?.details ?? { id: `product-${crypto.randomUUID()}`, name: "", category: "", description: "", image: "", imageIsPlaceholder: false, isSample: false, priceGhs: null, availability: "confirm", customizationLabel: "Preferences", customizationHint: "Add any requests for the seller" });
  const [active, setActive] = useState(row?.active ?? true);
  const [stock, setStock] = useState(row?.stock_quantity?.toString() ?? "");
  const [availability, setAvailability] = useState(row?.stock_status ?? "confirm");
  const [options, setOptions] = useState(Boolean(row?.details.priceOptions));
  const [plain, setPlain] = useState(row?.details.priceOptions?.[0]?.priceGhs.toString() ?? "350");
  const [custom, setCustom] = useState(row?.details.priceOptions?.[1]?.priceGhs.toString() ?? "400");
  const [pending, setPending] = useState(false); const [uploading, setUploading] = useState(false); const [error, setError] = useState("");
  const update = <K extends keyof Product>(key: K, value: Product[K]) => setProduct(previous => ({ ...previous, [key]: value }));
  async function upload(file: File | undefined, index: number) {
    if (!file || uploading) return;
    setUploading(true); setError("");
    try { const image = await uploadProductPhoto(file); if (index === 0) update("image", image); else update("gallery", [image]); }
    catch (failure) { setError(commerceError(failure)); }
    finally { setUploading(false); }
  }
  async function save() {
    if (pending || uploading) return;
    setPending(true); setError("");
    try {
      if (options && (!plain.trim() || !custom.trim())) throw new Error("Enter both prices.");
      const details = { ...product, name: product.name.trim(), category: product.category.trim(), availability, priceOptions: options ? [
        { id: product.priceOptions?.[0]?.id ?? "plain", label: product.priceOptions?.[0]?.label ?? "Without customisation", priceGhs: Number(plain) },
        { id: product.priceOptions?.[1]?.id ?? "customized", label: product.priceOptions?.[1]?.label ?? "With customisation", priceGhs: Number(custom) },
      ] : undefined };
      await saveOwnerProduct({ id: details.id, details, active, stock_quantity: stock.trim() ? Number(stock) : null, stock_status: availability }); onSaved();
    } catch (failure) { setError(commerceError(failure)); }
    finally { setPending(false); }
  }
  return <><header className="workspace-dialog-header"><h2 id="product-editor-title">{row ? "Edit product" : "Add product"}</h2><button type="button" className="workspace-icon-button" aria-label="Close product editor" onClick={onClose} disabled={pending || uploading}><X size={22}/></button></header><form className="workspace-dialog-body workspace-form" onSubmit={event => { event.preventDefault(); void save(); }} aria-busy={pending || uploading}>
    <label>Product name<input required maxLength={120} value={product.name} onChange={event => update("name", event.target.value)}/></label>
    <label>Category<input required list="product-categories" maxLength={60} value={product.category} onChange={event => update("category", event.target.value)}/><datalist id="product-categories">{categories.map(category => <option key={category} value={category}/>)}</datalist></label>
    <label>Description<textarea rows={3} maxLength={2000} value={product.description} onChange={event => update("description", event.target.value)}/></label>
    <fieldset className="owner-photos"><legend>Product photos (up to 2)</legend>{[0, 1].map(index => <div key={index}>{(index === 0 ? product.image : product.gallery?.[0]) && <Image src={productImageSrc(index === 0 ? product.image : product.gallery?.[0] ?? "")} width={100} height={100} sizes="100px" alt={`Product photo ${index + 1}`} loading="lazy"/>}<label>Photo {index + 1} {index === 1 && "(optional)"}<input type="text" inputMode="url" aria-label={`Photo ${index + 1} URL`} placeholder="https://..." value={index === 0 ? product.image : product.gallery?.[0] ?? ""} onChange={event => index === 0 ? update("image", event.target.value) : update("gallery", event.target.value ? [event.target.value] : [])}/></label><label className="owner-upload">Upload photo {index + 1}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading || pending} onChange={event => { void upload(event.target.files?.[0], index); event.target.value = ""; }}/></label></div>)}<p>JPG, PNG or WebP. Maximum 5 MB each.</p>{uploading && <p role="status">Uploading photo...</p>}</fieldset>
    <label className="workspace-checkbox"><input type="checkbox" checked={options} onChange={event => setOptions(event.target.checked)}/>Plain and customised prices</label>
    {options ? <div className="workspace-form-grid"><label>Without customisation (GH₵)<input required type="number" min="0" max="1000000" step="0.01" value={plain} onChange={event => setPlain(event.target.value)}/></label><label>With customisation (GH₵)<input required type="number" min="0" max="1000000" step="0.01" value={custom} onChange={event => setCustom(event.target.value)}/></label></div> : <><label>Price (GH₵)<input type="number" min="0" max="1000000" step="0.01" value={product.priceGhs ?? ""} onChange={event => update("priceGhs", event.target.value === "" ? null : Number(event.target.value))}/><span>Leave blank for Contact for Price.</span></label><label className="workspace-checkbox"><input type="checkbox" checked={product.priceIsEstimate ?? false} onChange={event => update("priceIsEstimate", event.target.checked)}/>Show as a guide price</label></>}
    <div className="workspace-form-grid"><label>Availability<select value={availability} onChange={event => setAvailability(event.target.value as Product["availability"])}><option value="confirm">Confirm Availability</option><option value="available">Available</option><option value="unavailable">Unavailable</option></select></label><label>Stock quantity<input type="number" min="0" max="100000" step="1" value={stock} onChange={event => setStock(event.target.value)}/><span>Leave blank if unknown.</span></label></div>
    <label className="workspace-checkbox"><input type="checkbox" checked={active} onChange={event => setActive(event.target.checked)}/>Show product in shop</label>
    {error && <p className="workspace-error" role="alert">{error}</p>}<button type="submit" className="workspace-button" disabled={pending || uploading}>{pending ? "Saving..." : "Save product"}</button>
  </form></>;
}
