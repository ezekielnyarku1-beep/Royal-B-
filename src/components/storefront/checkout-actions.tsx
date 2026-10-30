"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, MessageCircle } from "lucide-react";
import { useAccount } from "@/hooks/use-account";
import { useCatalogue } from "@/components/commerce-provider";
import { commerceError, saveOrderRequest } from "@/lib/commerce";
import { orderWhatsAppMessage, type StoreOrder } from "@/lib/commerce-types";
import { store } from "@/lib/catalogue";
import type { CartItem } from "@/lib/cart";
import { createWhatsAppUrl } from "@/lib/whatsapp";

export function CheckoutActions({ items, message }: { items: CartItem[]; message: string }) {
  const { user } = useAccount();
  const { live } = useCatalogue();
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const requestKey = useRef<string | null>(null);
  const signature = JSON.stringify(items) + (user?.id ?? "guest");
  const currentSignature = useRef(signature);
  currentSignature.current = signature;
  useEffect(() => { setOrder(null); setError(""); setPending(false); requestKey.current = null; }, [signature]);

  async function save() {
    if (!user || pending || order) return;
    const savedSignature = signature;
    setPending(true); setError("");
    requestKey.current ??= crypto.randomUUID();
    try { const result = await saveOrderRequest(items, requestKey.current); if (currentSignature.current === savedSignature) setOrder(result); }
    catch (failure) { if (currentSignature.current === savedSignature) setError(commerceError(failure)); }
    finally { if (currentSignature.current === savedSignature) setPending(false); }
  }

  return <div className="checkout-actions">
    {user && live && !order && <><button className="checkout-save-request" type="button" disabled={pending} onClick={save}>{pending ? "Saving request…" : "Save request for tracking"}</button><p>Optional. Save a reference and follow updates in your account.</p></>}
    {order && order.user_id === user?.id && <div className="saved-order-note" role="status"><Check size={18}/><div><strong>{order.reference}</strong><p>Request saved. Send it on WhatsApp for confirmation.</p><Link href="/account/?tab=orders">View your orders</Link></div></div>}
    {error && <p className="shop-inline-error" role="alert">{error}</p>}
    <a className="shop-button" href={createWhatsAppUrl(store.whatsappNumber, order ? orderWhatsAppMessage(order) : message)} target="_blank" rel="noopener noreferrer"><MessageCircle size={19}/>Continue on WhatsApp<ArrowRight size={17}/></a>
    {!user && <Link className="checkout-account-link" href="/login/">Sign in to save and track requests</Link>}
  </div>;
}
