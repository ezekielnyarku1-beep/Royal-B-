"use client";
import Image from "next/image";
import { Heart, Images, Plus } from "lucide-react";
import { priceLabel, productImages, type Product } from "@/lib/catalogue";
import { productImageSrc } from "@/lib/product-image";

function markImageReady(event: React.SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.dataset.loaded = "true";
}

export function ProductImage({ product, src = product.image, sizes = "(max-width: 760px) 45vw, (max-width: 1100px) 30vw, 280px", decorative = false }: { product: Product; src?: string; sizes?: string; decorative?: boolean }) {
  return <Image src={productImageSrc(src)} alt={decorative ? "" : `${product.imageIsPlaceholder ? "Illustrative placeholder for" : product.imageIsReference ? "Style reference for" : "Product example for"} ${product.name}`} loading="lazy" width={480} height={480} sizes={sizes} className="product-image-fade" onLoad={markImageReady} onError={markImageReady}/>;
}

export function ProductCard({ product, onSelect, saved = false, saving = false, onSave }: { product: Product; onSelect: (product: Product) => void; saved?: boolean; saving?: boolean; onSave?: () => void }) {
  return <article className="product-card">
    <div className="product-media"><button className="product-image-button" type="button" onClick={() => onSelect(product)} aria-label={`View ${product.name}`}>
      {product.isSample && <span className="sample-badge">Sample product</span>}
      <ProductImage product={product}/>
      {product.imageIsReference && <span className="placeholder-label">Pendant style reference</span>}
      {productImages(product).length > 1 && <span className="photo-count"><Images size={12}/>{productImages(product).length} photos</span>}
    </button>{onSave && <button className="product-save-button" type="button" disabled={saving} aria-pressed={saved} aria-label={`${saved ? "Remove" : "Save"} ${product.name}${saved ? " from saved products" : " to saved products"}`} onClick={onSave}><Heart size={20} fill={saved ? "currentColor" : "none"}/></button>}</div>
    <div className="product-info"><span className="product-category">{product.category}</span>
      <h3><button type="button" onClick={() => onSelect(product)}>{product.name}</button></h3>
      <div className={`product-price${product.priceGhs === null && !product.priceOptions ? " product-price-contact" : ""}`}>{priceLabel(product).replace("GH₵", "GH₵ ")}</div>
      <button className="product-add" type="button" onClick={() => onSelect(product)} aria-label={`Choose options for ${product.name}`}>Choose options<Plus size={16}/></button>
    </div>
  </article>;
}
