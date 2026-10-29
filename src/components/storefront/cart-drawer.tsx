"use client";
import { useState } from "react";
import { ArrowRight, MessageCircle, ShoppingBag, Trash2, X } from "lucide-react";
import { products, store, priceLabel, formatPrice, lineSubtotalGhs, productImages, unitPriceGhs } from "@/lib/catalogue";
import { cartLineKey, cartPricing, type CartItem } from "@/lib/cart";
import { createOrderMessage, createWhatsAppUrl } from "@/lib/whatsapp";
import { QuantityControl } from "./quantity-control";
import { ProductImage } from "./product-card";
import { ProductPriceOptions } from "./product-price-options";

export function CartDrawer({ items, onClose, onUpdate, onOptionChange, onRemove }: { items: CartItem[]; onClose: () => void; onUpdate: (key: string, quantity: number) => void; onOptionChange: (key: string, optionId: string) => string | null; onRemove: (key: string) => void }) {
  const [optionError, setOptionError] = useState<{ key: string; message: string } | null>(null);
  const count = items.reduce((total, line) => total + line.quantity, 0);
  const message = items.length ? createOrderMessage(items, products) : "";
  const pricing = cartPricing(items, products);
  return <div className="cart-drawer-layout">
    <header className="cart-drawer-header"><div><span className="shop-eyebrow">YOUR THOUGHTFUL FINDS</span><h2 id="cart-dialog-title">Your bag <span>{count}</span></h2></div><button className="shop-icon-button" type="button" onClick={onClose} aria-label="Close shopping bag"><X size={23}/></button></header>
    {items.length ? <>
      <div className="cart-drawer-body"><p className="cart-enquiry-note">A little something for you. A quote from us.</p>
        <ul className="cart-items">{items.map(item => {
          const product = products.find(p => p.id === item.productId)!;
          const key = cartLineKey(item);
          const price = unitPriceGhs(product, item.optionId);
          const option = product.priceOptions?.find(option => option.id === item.optionId);
          const lineName = option ? `${product.name}, ${option.label}` : product.name;
          return <li className="cart-item" key={key}>
            <div className="cart-item-image"><ProductImage product={product} src={item.referenceImage || product.image}/>{product.imageIsPlaceholder && <span>Placeholder</span>}</div>
            <div className="cart-item-info"><h3>{product.name}</h3><span className="cart-item-price">{product.priceOptions && price === null ? "Choose customisation for price" : priceLabel(product, item.optionId)}</span>
              {price !== null && <span className="cart-line-subtotal">{product.priceIsEstimate && "Estimated: "}{item.quantity} × {formatPrice(price)} = {formatPrice(lineSubtotalGhs(product, item.quantity, item.optionId)!)}</span>}
              <ProductPriceOptions product={product} optionId={item.optionId} compact onChange={value => { const message = onOptionChange(key, value); setOptionError(message ? { key, message } : null); }}/>
              {optionError?.key === key && <p className="shop-inline-error" role="alert">{optionError.message}</p>}
              <span className="cart-item-availability">Confirm Availability{product.isSample && " · Sample"}</span>
              {productImages(product).length > 1 && <span className="cart-style-reference">Style reference: photo {productImages(product).indexOf(item.referenceImage || product.image) + 1} of {productImages(product).length}</span>}
              {item.customization && <p className="cart-customization"><strong>Preferences:</strong> {item.customization}</p>}
              <div className="cart-item-controls"><QuantityControl value={item.quantity} onChange={quantity => { setOptionError(null); onUpdate(key, quantity); }} name={lineName}/><button type="button" className="remove-item" onClick={() => { setOptionError(null); onRemove(key); }} aria-label={`Remove ${lineName}${item.customization ? ` (${item.customization})` : ""}`}><Trash2 size={16}/><span>Remove</span></button></div>
            </div>
          </li>;
        })}</ul>
        <details className="message-preview"><summary>Preview your WhatsApp enquiry</summary><pre>{message}</pre></details>
      </div>
      <footer className="cart-checkout">
        {pricing.pricedQuantity > 0 && <div className="cart-priced-subtotal"><span>{pricing.hasEstimate ? "Estimated items subtotal" : pricing.unpricedQuantity ? "Priced items subtotal" : "Items subtotal"}</span><strong>{formatPrice(pricing.pricedSubtotal)}</strong></div>}
        {pricing.unpricedQuantity > 0 && <div><span>{pricing.unpricedQuantity} {pricing.unpricedQuantity === 1 ? "item needs" : "items need"} a quote</span><strong>Contact for Price</strong></div>}
        <div><span>Delivery charges</span><strong>Confirmed by seller</strong></div>
        <div><span>Final total with delivery</span><strong>Confirmed on WhatsApp</strong></div>
        <p>{store.delivery}</p>
        <a className="shop-button" href={createWhatsAppUrl(store.whatsappNumber, message)} target="_blank" rel="noopener noreferrer"><MessageCircle size={19}/>Continue on WhatsApp<ArrowRight size={17}/></a>
        <small>Opens a draft for you to review and send. Your order is confirmed with the seller; no online payment is taken.</small>
      </footer>
    </> : <div className="empty-bag"><div><ShoppingBag size={36} strokeWidth={1.2}/></div><h3>A little room for something lovely.</h3><p>Your bag is empty. Explore the collection and make something yours.</p><button type="button" className="shop-button" onClick={onClose}>Explore the collection<ArrowRight size={17}/></button></div>}
  </div>;
}
