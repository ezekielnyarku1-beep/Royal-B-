"use client";
import { Heart, Images, Plus } from "lucide-react";
import { availabilityLabel, priceLabel, productImages, type Product } from "@/lib/catalogue";

export function ProductImage({ product, src = product.image }: { product: Product; src?: string }) {
  // Plain local images support static export and easy replacement with real photos.
  return <img src={src} alt={`${product.imageIsPlaceholder ? "Illustrative placeholder for" : product.imageIsReference ? "Style reference for" : "Product example for"} ${product.name}`} loading="lazy" width="480" height="480"/>;
}

export function ProductCard({ product, onSelect, saved = false, saving = false, onSave }: { product: Product; onSelect: (product: Product) => void; saved?: boolean; saving?: boolean; onSave?: () => void }) {
  return <article className="product-card">
    <div className="product-media"><button className="product-image-button" type="button" onClick={() => onSelect(product)} aria-label={`View ${product.name}`}>
      {product.isSample && <span className="sample-badge">Sample product</span>}
      <ProductImage product={product}/>
      {product.imageIsPlaceholder && <span className="placeholder-label">Illustrative placeholder</span>}
      {product.imageIsReference && <span className="placeholder-label">Pendant style reference</span>}
      {productImages(product).length > 1 && <span className="photo-count"><Images size={12}/>{productImages(product).length} photos</span>}
    </button>{onSave && <button className="product-save-button" type="button" disabled={saving} aria-pressed={saved} aria-label={`${saved ? "Remove" : "Save"} ${product.name}${saved ? " from saved products" : " to saved products"}`} onClick={onSave}><Heart size={20} fill={saved ? "currentColor" : "none"}/></button>}</div>
    <div className="product-info"><span className="product-category">{product.category}</span>
      <h3><button type="button" onClick={() => onSelect(product)}>{product.name}</button></h3>
      <div className="product-price">{priceLabel(product)}</div>
      <p className="availability"><span/>{availabilityLabel(product)}</p>
      <button className="product-add" type="button" onClick={() => onSelect(product)} aria-label={`Choose options for ${product.name}`}>Choose options<Plus size={16}/></button>
    </div>
  </article>;
}
