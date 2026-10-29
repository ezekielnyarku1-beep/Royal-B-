"use client";
import { useState } from "react";
import { ArrowRight, Info, ShoppingBag, X } from "lucide-react";
import { priceLabel, type Product } from "@/lib/catalogue";
import { MAX_CUSTOMIZATION_LENGTH, type CartItem } from "@/lib/cart";
import { QuantityControl } from "./quantity-control";
import { ProductImage } from "./product-card";

export function ProductDialogContent({ product, onClose, onAdd }: { product: Product; onClose: () => void; onAdd: (item: CartItem) => boolean }) {
  const [quantity, setQuantity] = useState(1);
  const [customization, setCustomization] = useState("");
  const [error, setError] = useState("");
  return <>
    <button className="shop-dialog-close" type="button" onClick={onClose} aria-label="Close product details"><X size={21}/></button>
    <div className="product-dialog-grid">
      <div className="product-dialog-image"><ProductImage product={product}/>{product.imageIsPlaceholder && <p>Illustrative placeholder · Actual product photo to follow</p>}</div>
      <form className="product-dialog-content" onSubmit={event => { event.preventDefault(); if (!onAdd({ productId: product.id, quantity, customization })) setError("Your bag is full. Please remove an item before adding another."); }}>
        <div className="shop-eyebrow">{product.category}{product.isSample && " · Sample product"}</div>
        <h2 id="product-dialog-title">{product.name}</h2>
        <p className="detail-price">{priceLabel(product)}</p><p className="availability"><span/>Confirm Availability</p>
        <p className="product-description">{product.description}</p>
        <label className="shop-label" htmlFor="product-customization">{product.customizationLabel}<span>Optional</span></label>
        <textarea id="product-customization" rows={3} maxLength={MAX_CUSTOMIZATION_LENGTH} value={customization} onChange={event => setCustomization(event.target.value)} placeholder={product.customizationHint} aria-describedby="customization-help"/>
        <p className="customization-help" id="customization-help">Share your preferences. The seller will confirm what’s possible.</p>
        <div className="product-quantity-row"><span className="shop-label">Quantity</span><QuantityControl value={quantity} onChange={setQuantity} name={product.name}/></div>
        {error && <p className="shop-inline-error" role="alert">{error}</p>}
        <button type="submit" className="shop-button"><ShoppingBag size={18}/>Add to bag<ArrowRight size={17}/></button>
        <div className="product-disclaimer"><Info size={16}/><p>{product.isSample ? "This is a sample listing. " : ""}Prices, availability, styles and delivery charges are confirmed by the seller on WhatsApp. No online payment is required.</p></div>
      </form>
    </div>
  </>;
}
