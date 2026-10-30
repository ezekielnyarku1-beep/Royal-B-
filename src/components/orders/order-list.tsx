"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Package, RefreshCw, X } from "lucide-react";
import { formatPrice } from "@/lib/catalogue";
import { commerceError, fetchOrderEvents, updateOrderStatus } from "@/lib/commerce";
import { nextOrderStatuses, orderDate, orderStatusLabels, type OrderEvent, type OrderStatus, type StoreOrder } from "@/lib/commerce-types";

export function OrderList({ orders, owner = false, onRefresh, busy = false }: { orders: StoreOrder[]; owner?: boolean; onRefresh: () => void; busy?: boolean }) {
  const [selected, setSelected] = useState<StoreOrder | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (selected && !dialog.current?.open) dialog.current?.showModal(); }, [selected]);
  useEffect(() => {
    if (!selected) return;
    const before = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = before; };
  }, [selected]);
  return <>
    <div className="workspace-section-heading"><h2>{owner ? "Recent order requests" : "Your orders"}</h2><button className="workspace-button workspace-button-secondary" type="button" disabled={busy} onClick={onRefresh}><RefreshCw size={17}/>Refresh</button></div>
    {orders.length === 0 ? <div className="workspace-empty"><Package size={34}/><h3>No order requests yet</h3><p>{owner ? "Saved customer requests will appear here. WhatsApp-only enquiries are not added automatically." : "Save a request from your bag to get a reference and track updates here."}</p>{!owner && <Link href="/shop/" className="workspace-button">Shop products<ArrowRight size={18}/></Link>}</div> : <div className="orders-list">{orders.map(order => <button type="button" key={order.id} className="order-card" onClick={() => setSelected(order)}><div className="order-card-top"><strong>{order.reference}</strong><span className={`order-status status-${order.status}`}>{orderStatusLabels[order.status]}</span></div><span className="order-date">{orderDate(order.created_at)}</span><div className="order-card-items">{order.items.slice(0, 2).map((item, index) => <img key={index} src={item.image} alt="" width="64" height="64" loading="lazy"/>)}<span>{order.items.reduce((total, item) => total + item.quantity, 0)} items<br/>{order.has_estimate ? "Estimate: " : ""}{formatPrice(order.subtotal)}{order.unpriced_quantity > 0 && " + items to quote"}</span><ArrowRight size={20}/></div>{owner && <span className="order-customer">{order.contact.name || order.contact.email || "Customer request"}</span>}</button>)}</div>}
    <dialog className="workspace-dialog" ref={dialog} aria-labelledby="order-details-title" onClose={() => setSelected(null)}>{selected && <OrderDetail key={selected.id} order={selected} owner={owner} onClose={() => dialog.current?.close()} onUpdated={order => { setSelected(order); onRefresh(); }}/>}</dialog>
  </>;
}

function OrderDetail({ order, owner, onClose, onUpdated }: { order: StoreOrder; owner: boolean; onClose: () => void; onUpdated: (order: StoreOrder) => void }) {
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [eventError, setEventError] = useState("");
  const [next, setNext] = useState<OrderStatus | "">("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    let active = true;
    void fetchOrderEvents(order.id).then(data => { if (active) { setEvents(data); setEventError(""); } }).catch(failure => { if (active) setEventError(commerceError(failure)); });
    return () => { active = false; };
  }, [order.id, order.updated_at]);
  async function update() {
    if (!next || pending) return;
    setPending(true); setError("");
    try { const updated = await updateOrderStatus(order.id, next, note.trim()); setNext(""); setNote(""); onUpdated(updated); }
    catch (failure) { setError(commerceError(failure)); }
    finally { setPending(false); }
  }
  return <>
    <header className="workspace-dialog-header"><div><h2 id="order-details-title">{order.reference}</h2><span className={`order-status status-${order.status}`}>{orderStatusLabels[order.status]}</span></div><button className="workspace-icon-button" type="button" onClick={onClose} aria-label="Close order details"><X size={22}/></button></header>
    <div className="workspace-dialog-body"><p className="workspace-muted">Requested {orderDate(order.created_at)}. Payment and final delivery charges are confirmed with the seller.</p>
      <ul className="order-detail-items">{order.items.map((item, index) => <li key={index}><img src={item.image} alt={item.name} width="84" height="84"/><div><h3>{item.name}</h3><p>Quantity: {item.quantity}</p>{item.optionLabel && <p>{item.optionLabel}</p>}<p>{item.unitPrice === null ? "Price to be confirmed" : `${item.estimated ? "Guide price: " : "Unit price: "}${formatPrice(item.unitPrice)}`}</p>{item.customization && <p className="order-preferences">{item.customization}</p>}</div></li>)}</ul>
      <div className="order-total"><span>{order.has_estimate ? "Estimated items subtotal" : "Items subtotal"}</span><strong>{formatPrice(order.subtotal)}</strong></div>{order.unpriced_quantity > 0 && <p>{order.unpriced_quantity} items need a quote.</p>}
      {owner && <section className="order-contact"><h3>Customer details</h3><p>{order.contact.name || "Name not saved"}</p>{order.contact.email && <p>{order.contact.email}</p>}{order.contact.phone && <p>{order.contact.phone}</p>}<p>{[order.contact.address, order.contact.city, order.contact.landmark].filter(Boolean).join(", ") || "Delivery details to be confirmed on WhatsApp."}</p></section>}
      <section><h3>Updates</h3>{eventError ? <p className="workspace-error" role="alert">{eventError}</p> : <ol className="order-timeline">{events.map(event => <li key={event.id}><strong>{orderStatusLabels[event.status]}</strong><span>{orderDate(event.created_at)}</span>{event.note && <p>{event.note}</p>}</li>)}</ol>}</section>
      {owner && nextOrderStatuses[order.status].length > 0 && <form className="workspace-form order-update-form" onSubmit={event => { event.preventDefault(); void update(); }}><h3>Update this order</h3><label>Status<select value={next} onChange={event => setNext(event.target.value as OrderStatus)} required><option value="">Choose status</option>{nextOrderStatuses[order.status].map(status => <option key={status} value={status}>{orderStatusLabels[status]}</option>)}</select></label><label>Update note <span>(shown to customer)</span><textarea rows={3} maxLength={500} value={note} onChange={event => setNote(event.target.value)}/></label>{error && <p className="workspace-error" role="alert">{error}</p>}<button className="workspace-button" disabled={pending || !next} type="submit">{pending ? "Updating…" : "Save update"}</button></form>}
    </div>
  </>;
}
