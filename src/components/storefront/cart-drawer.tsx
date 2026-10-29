"use client";
import { ArrowRight, MessageCircle, ShoppingBag, Trash2, X } from "lucide-react";
import { products, store, priceLabel } from "@/lib/catalogue";
import { cartLineKey, type CartItem } from "@/lib/cart";
import { createOrderMessage, createWhatsAppUrl } from "@/lib/whatsapp";
import { QuantityControl } from "./quantity-control";
import { ProductImage } from "./product-card";

export function CartDrawer({ items, onClose, onUpdate, onRemove }: { items: CartItem[]; onClose: () => void; onUpdate: (key: string, quantity: number) => void; onRemove: (key: string) => void }) {
  const count = items.reduce((total, line) => total + line.quantity, 0);
  const message = items.length ? createOrderMessage(items, products) : "";
  return <div className="cart-drawer-layout">
    <header className="cart-drawer-header"><div><span className="shop-eyebrow">YOUR THOUGHTFUL FINDS</span><h2 id="cart-dialog-title">Your bag <span>{count}</span></h2></div><button className="shop-icon-button" type="button" onClick={onClose} aria-label="Close shopping bag"><X size={23}/></button></header>
    {items.length ? <>
      <div className="cart-drawer-body"><p className="cart-enquiry-note">A little something for you. A quote from us.</p>
        <ul className="cart-items">{items.map(item => {
          const product = products.find(p => p.id === item.productId)!;
          const key = cartLineKey(item);
          return <li className="cart-item" key={key}>
            <div className="cart-item-image"><ProductImage product={product}/>{product.imageIsPlaceholder && <span>Placeholder</span>}</div>
            <div className="cart-item-info"><h3>{product.name}</h3><span className="cart-item-price">{priceLabel(product)}</span>
              <span className="cart-item-availability">Confirm Availability{product.isSample && " · Sample"}</span>
              {item.customization && <p className="cart-customization"><strong>Preferences:</strong> {item.customization}</p>}
              <div className="cart-item-controls"><QuantityControl value={item.quantity} onChange={quantity => onUpdate(key, quantity)} name={product.name}/><button type="button" className="remove-item" onClick={() => onRemove(key)} aria-label={`Remove ${product.name}${item.customization ? ` (${item.customization})` : ""}`}><Trash2 size={16}/><span>Remove</span></button></div>
            </div>
          </li>;
        })}</ul>
        <details className="message-preview"><summary>Preview your WhatsApp enquiry</summary><pre>{message}</pre></details>
      </div>
      <footer className="cart-checkout"><div><span>Product pricing</span><strong>Confirmed by seller</strong></div><div><span>Delivery charges</span><strong>Based on your location</strong></div>
        <p>{store.delivery}</p>
        <a className="shop-button" href={createWhatsAppUrl(store.whatsappNumber, message)} target="_blank" rel="noopener noreferrer"><MessageCircle size={19}/>Continue on WhatsApp<ArrowRight size={17}/></a>
        <small>Opens a draft for you to review and send. Your order is confirmed with the seller; no online payment is taken.</small>
      </footer>
    </> : <div className="empty-bag"><div><ShoppingBag size={36} strokeWidth={1.2}/></div><h3>A little room for something lovely.</h3><p>Your bag is empty. Explore the collection and make something yours.</p><button type="button" className="shop-button" onClick={onClose}>Explore the collection<ArrowRight size={17}/></button></div>}
  </div>;
}
