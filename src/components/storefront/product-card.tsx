"use client";
import { ArrowUpRight, Plus } from "lucide-react";
import { priceLabel, type Product } from "@/lib/catalogue";

export function ProductImage({ product }: { product: Product }) {
  // Plain local images support static export and easy replacement with real photos.
  return <img src={product.image} alt={`${product.imageIsPlaceholder ? "Illustrative placeholder for" : "Photo of"} ${product.name}`} loading="lazy" width="480" height="480"/>;
}

export function ProductCard({ product, onSelect }: { product: Product; onSelect: (product: Product) => void }) {
  return <article className="product-card">
    <button className="product-image-button" type="button" onClick={() => onSelect(product)} aria-label={`View ${product.name}`}>
      <span className="sample-badge">{product.isSample ? "Sample product" : product.category}</span>
      <ProductImage product={product}/><span className="product-open-icon"><ArrowUpRight size={17}/></span>
      {product.imageIsPlaceholder && <span className="placeholder-label">Illustrative placeholder</span>}
    </button>
    <div className="product-info"><span className="product-category">{product.category}</span>
      <h3><button type="button" onClick={() => onSelect(product)}>{product.name}</button></h3>
      <div className="product-price">{priceLabel(product)}</div>
      <p className="availability"><span/>Confirm Availability</p>
      <button className="product-add" type="button" onClick={() => onSelect(product)} aria-label={`Choose options for ${product.name}`}>Choose options<Plus size={16}/></button>
    </div>
  </article>;
}
