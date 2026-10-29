"use client";
import { ArrowUpRight, Images, Plus } from "lucide-react";
import { priceLabel, productImages, type Product } from "@/lib/catalogue";

export function ProductImage({ product, src = product.image }: { product: Product; src?: string }) {
  // Plain local images support static export and easy replacement with real photos.
  return <img src={src} alt={`${product.imageIsPlaceholder ? "Illustrative placeholder for" : product.imageIsReference ? "Style reference for" : "Product example for"} ${product.name}`} loading="lazy" width="480" height="480"/>;
}

export function ProductCard({ product, onSelect }: { product: Product; onSelect: (product: Product) => void }) {
  return <article className="product-card">
    <button className="product-image-button" type="button" onClick={() => onSelect(product)} aria-label={`View ${product.name}`}>
      <span className="sample-badge">{product.isSample ? "Sample product" : product.category}</span>
      <ProductImage product={product}/><span className="product-open-icon"><ArrowUpRight size={17}/></span>
      {product.imageIsPlaceholder && <span className="placeholder-label">Illustrative placeholder</span>}
      {product.imageIsReference && <span className="placeholder-label">Pendant style reference</span>}
      {productImages(product).length > 1 && <span className="photo-count"><Images size={12}/>{productImages(product).length} photos</span>}
    </button>
    <div className="product-info"><span className="product-category">{product.category}</span>
      <h3><button type="button" onClick={() => onSelect(product)}>{product.name}</button></h3>
      <div className="product-price">{priceLabel(product)}</div>
      <p className="availability"><span/>Confirm Availability</p>
      <button className="product-add" type="button" onClick={() => onSelect(product)} aria-label={`Choose options for ${product.name}`}>Choose options<Plus size={16}/></button>
    </div>
  </article>;
}
