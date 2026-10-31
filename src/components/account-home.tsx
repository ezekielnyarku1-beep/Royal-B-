"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Heart, Settings } from "lucide-react";
import { WorkspaceShell } from "./workspace-shell";
import { OrderList } from "./orders/order-list";
import { ProductCard } from "./storefront/product-card";
import { useCatalogue } from "./commerce-provider";
import { useSavedProducts } from "@/hooks/use-saved-products";
import { useOwnerAccess } from "@/hooks/use-owner-access";
import { commerceError, fetchOrders, fetchProfile, saveProfile } from "@/lib/commerce";
import type { CustomerProfile, StoreOrder } from "@/lib/commerce-types";

export function AccountHome() {
  const access = useOwnerAccess();
  const saved = useSavedProducts();
  const { products } = useCatalogue();
  const router = useRouter();
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [ordersError, setOrdersError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataUserId, setDataUserId] = useState<string | null>(null);
  const activeUser = useRef(access.user?.id); activeUser.current = access.user?.id;
  const request = useRef(0);
  const reload = useCallback(async () => {
    if (!access.user) return;
    const userId = access.user.id; const sequence = ++request.current;
    setLoading(true);
    const results = await Promise.allSettled([fetchOrders(userId), fetchProfile(userId)]);
    if (activeUser.current !== userId || sequence !== request.current) return;
    setDataUserId(userId);
    if (results[0].status === "fulfilled") { setOrders(results[0].value); setOrdersError(""); } else setOrdersError(commerceError(results[0].reason));
    if (results[1].status === "fulfilled") { setProfile(results[1].value); setProfileError(""); } else setProfileError(commerceError(results[1].reason));
    setLoading(false);
  }, [access.user?.id]);
  useEffect(() => {
    setOrders([]); setProfile(null); setOrdersError(""); setProfileError("");
    void reload();
    const refresh = () => { if (document.visibilityState === "visible") void reload(); };
    window.addEventListener("focus", refresh); return () => window.removeEventListener("focus", refresh);
  }, [reload]);
  useEffect(() => { const requested = new URLSearchParams(window.location.search).get("tab"); if (["orders", "saved", "details"].includes(requested ?? "")) setTab(requested!); }, []);
  function selectTab(value: string) { setTab(value); window.history.replaceState(null, "", `/account/?tab=${value}`); }

  return <WorkspaceShell title="My account" subtitle={access.user?.email} signedIn={Boolean(access.user)} tab={access.user ? tab : undefined} onTab={selectTab}>
    {access.loading ? <p role="status">Loading your account…</p> : !access.user ? <section className="workspace-empty"><h2>Sign in to your account</h2><p>Track order requests, save products and keep your delivery details in one place.</p><Link className="workspace-button" href="/login/">Log in or sign up<ArrowRight size={18}/></Link></section> : <>
      {access.owner && <Link href="/admin/" className="owner-dashboard-link"><Settings size={20}/><span>Open owner dashboard</span><ArrowRight size={18}/></Link>}
      {tab === "orders" && (dataUserId !== access.user.id ? <p role="status">Loading orders…</p> : ordersError ? <p className="workspace-error" role="alert">{ordersError}</p> : <div aria-busy={loading}><OrderList key={access.user.id} orders={orders} onRefresh={() => void reload()} busy={loading}/></div>)}
      {tab === "saved" && <section><div className="workspace-section-heading"><h2>Saved products</h2><span>{products.filter(product => saved.ids.includes(product.id)).length}</span></div>{saved.loadError || saved.error ? <p className="workspace-error" role="alert">{saved.error || saved.loadError}</p> : saved.loading ? <p role="status">Loading saved products…</p> : saved.ids.length === 0 ? <div className="workspace-empty"><Heart size={34}/><h3>No saved products yet</h3><p>Tap the heart on a product to save it here.</p><Link href="/shop/" className="workspace-button">Shop products</Link></div> : <div className="account-saved-grid">{products.filter(product => saved.ids.includes(product.id)).map(product => <ProductCard key={product.id} product={product} onSelect={() => router.push(`/shop/?product=${encodeURIComponent(product.id)}`)} saved saving={saved.pending.includes(product.id)} onSave={() => void saved.toggle(product.id)}/>)}</div>}</section>}
      {tab === "details" && (dataUserId !== access.user.id ? <p role="status">Loading your details…</p> : profileError ? <p className="workspace-error" role="alert">{profileError}</p> : <ProfileForm key={access.user.id} userId={access.user.id} profile={profile} initialName={typeof access.user.user_metadata?.name === "string" ? access.user.user_metadata.name : ""} onSaved={setProfile}/>)}
    </>}
  </WorkspaceShell>;
}

function ProfileForm({ userId, profile, initialName, onSaved }: { userId: string; profile: CustomerProfile | null; initialName: string; onSaved: (profile: CustomerProfile) => void }) {
  const [values, setValues] = useState<CustomerProfile>(profile ?? { user_id: userId, name: initialName, phone: "", city: "", address: "", landmark: "" });
  const [pending, setPending] = useState(false); const [error, setError] = useState(""); const [saved, setSaved] = useState(false);
  async function submit() {
    setPending(true); setError(""); setSaved(false);
    try { await saveProfile(values); onSaved(values); setSaved(true); }
    catch (failure) { setError(commerceError(failure)); }
    finally { setPending(false); }
  }
  const field = (key: keyof CustomerProfile) => ({ value: values[key], onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setValues(previous => ({ ...previous, [key]: event.target.value })); setSaved(false); setError(""); } });
  return <section className="workspace-panel"><h2>Contact & delivery details</h2><p className="workspace-muted">Saved details are added to new order requests. You can update them at any time.</p><form className="workspace-form" onSubmit={event => { event.preventDefault(); void submit(); }} aria-busy={pending}><div className="workspace-form-grid"><label>Full name<input {...field("name")} autoComplete="name" required maxLength={100}/></label><label>Phone number <span>(include country code)</span><input {...field("phone")} type="tel" autoComplete="tel" placeholder="+233" maxLength={24}/></label><label>Town or city<input {...field("city")} autoComplete="address-level2" maxLength={100}/></label><label>Landmark <span>(optional)</span><input {...field("landmark")} maxLength={200}/></label></div><label>Delivery address<textarea {...field("address")} autoComplete="street-address" rows={3} maxLength={300}/></label>{error && <p className="workspace-error" role="alert">{error}</p>}{saved && <p className="workspace-success" role="status">Your details are saved.</p>}<button type="submit" className="workspace-button" disabled={pending}>{pending ? "Saving…" : "Save details"}</button></form></section>;
}
