"use client";
import { formatPrice, type Product } from "@/lib/catalogue";

export function ProductPriceOptions({ product, optionId, onChange, compact = false }: {
  product: Product;
  optionId?: string;
  onChange: (optionId: string) => void;
  compact?: boolean;
}) {
  if (!product.priceOptions) return null;
  return <label className="price-option-field"><span>Customisation</span>
    <select aria-label={`Customisation for ${product.name}`} value={optionId ?? ""} onChange={event => onChange(event.target.value)}>
      <option value="" disabled>Choose customisation</option>
      {product.priceOptions.map(option => <option key={option.id} value={option.id}>{option.label}{!compact && ` — ${formatPrice(option.priceGhs)}`}</option>)}
    </select>
  </label>;
}
