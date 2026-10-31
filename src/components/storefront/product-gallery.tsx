"use client";
import { productImages, type Product } from "@/lib/catalogue";
import { ProductImage } from "./product-card";

export function ProductGallery({ product, selectedImage, onSelect }: { product: Product; selectedImage: string; onSelect: (image: string) => void }) {
  const images = productImages(product);
  const selectedIndex = images.indexOf(selectedImage);
  return <div className="product-dialog-image product-gallery">
    <div className="product-gallery-stage"><ProductImage product={product} src={selectedImage} sizes="(max-width: 760px) calc(100vw - 48px), 44vw"/></div>
    {images.length > 1 && <>
      <div className="product-thumbnails" role="group" aria-label={`Photos for ${product.name}`}>
        {images.map((src, index) => <button key={src} type="button" aria-label={`Choose photo ${index + 1} of ${images.length} for ${product.name}`} aria-pressed={selectedImage === src} onClick={() => onSelect(src)}><ProductImage product={product} src={src} sizes="56px" decorative/></button>)}
      </div>
      <p className="gallery-photo-reference">Selected style reference: photo {selectedIndex + 1} of {images.length}. Included with your enquiry.</p>
    </>}
    {(product.imageIsPlaceholder || product.imageNote) && <p className="gallery-caption">{product.imageIsPlaceholder ? "Illustrative placeholder · Actual product photo to follow" : product.imageNote}</p>}
  </div>;
}
