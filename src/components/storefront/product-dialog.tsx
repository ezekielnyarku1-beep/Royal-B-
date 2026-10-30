"use client";
import { useState } from "react";
import { ArrowRight, Info, ShoppingBag, X } from "lucide-react";
import { availabilityLabel, priceLabel, productImages, type Product } from "@/lib/catalogue";
import { MAX_CUSTOMIZATION_LENGTH, MAX_QUANTITY, type CartItem } from "@/lib/cart";
import { QuantityControl } from "./quantity-control";
import { ProductGallery } from "./product-gallery";
import { ProductPriceOptions } from "./product-price-options";

export function ProductDialogContent({ product, ready = true, onClose, onAdd }: { product: Product; ready?: boolean; onClose: () => void; onAdd: (item: CartItem) => string | null }) {
  const [quantity, setQuantity] = useState(1);
  const [customization, setCustomization] = useState("");
  const [requestedOption, setOptionId] = useState(product.priceOptions?.[0]?.id);
  const [requestedImage, setSelectedImage] = useState(product.image);
  const optionId = product.priceOptions?.some(option => option.id === requestedOption) ? requestedOption : product.priceOptions?.[0]?.id;
  const selectedImage = productImages(product).includes(requestedImage) ? requestedImage : product.image;
  const [error, setError] = useState("");
  return <>
    <button className="shop-dialog-close" type="button" onClick={onClose} aria-label="Close product details"><X size={21}/></button>
    <div className="product-dialog-grid">
      <ProductGallery product={product} selectedImage={selectedImage} onSelect={src => { setSelectedImage(src); setError(""); }}/>
      <form className="product-dialog-content" onSubmit={event => { event.preventDefault(); setError(onAdd({ productId: product.id, quantity, customization, optionId, referenceImage: selectedImage !== product.image ? selectedImage : undefined }) || ""); }}>
        <div className="shop-eyebrow">{product.category}{product.isSample && " · Sample product"}</div>
        <h2 id="product-dialog-title">{product.name}</h2>
        <p className="detail-price" aria-live="polite" aria-atomic="true">{priceLabel(product, optionId)}</p><p className="availability"><span/>{availabilityLabel(product)}</p>
        {product.priceIsEstimate && <p className="price-guide-note">Most watches are GH₵200. The seller will confirm the price for your selected model.</p>}
        <p className="product-description">{product.description}</p>
        <details className="product-facts"><summary>Details & delivery</summary><dl><div><dt>Sizes, colours & materials</dt><dd>Ask the seller to confirm the options for this style.</dd></div><div><dt>Personalisation</dt><dd>Enter your preferences below. The seller will confirm the design before your order is agreed.</dd></div><div><dt>Delivery & preparation</dt><dd>Timing and charges are confirmed for your location on WhatsApp.</dd></div></dl></details>
        <ProductPriceOptions product={product} optionId={optionId} onChange={value => { setOptionId(value); setError(""); }}/>
        {product.priceOptions && <p className="customization-help">Choose With customisation for names, engraving or other personalisation. Without customisation excludes these changes.</p>}
        <label className="shop-label" htmlFor="product-customization">{product.customizationLabel}<span>Optional</span></label>
        <textarea id="product-customization" rows={3} maxLength={MAX_CUSTOMIZATION_LENGTH} value={customization} onChange={event => { setCustomization(event.target.value); setError(""); }} placeholder={product.customizationHint} aria-describedby="customization-help"/>
        <p className="customization-help" id="customization-help">{product.requiresPhoto ? "Send your photo directly to the seller on WhatsApp after opening your enquiry." : "Share your preferences. The seller will confirm what’s possible."}</p>
        <div className="product-quantity-row"><span className="shop-label">Quantity</span><QuantityControl value={quantity} onChange={value => { setQuantity(value); setError(""); }} name={product.name}/></div>
        <p className="quantity-limit-note">Maximum {MAX_QUANTITY} per personalisation request. This is an enquiry limit; availability is confirmed by the seller.</p>
        {error && <p className="shop-inline-error" role="alert">{error}</p>}
        <div className="product-purchase-bar"><button type="submit" className="shop-button" disabled={!ready || availabilityLabel(product) === "Unavailable"} aria-busy={!ready}><ShoppingBag size={18}/>{!ready ? "Loading bag…" : availabilityLabel(product) === "Unavailable" ? "Currently unavailable" : "Add to bag"}<ArrowRight size={17}/></button></div>
        <div className="product-disclaimer"><Info size={16}/><p>{product.isSample ? "This is a sample listing. " : ""}Prices, availability, styles and delivery charges are confirmed by the seller on WhatsApp. No online payment is required.</p></div>
      </form>
    </div>
  </>;
}
