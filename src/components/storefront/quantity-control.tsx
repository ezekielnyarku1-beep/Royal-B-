"use client";
import { Minus, Plus } from "lucide-react";
import { MAX_QUANTITY } from "@/lib/cart";

export function QuantityControl({ value, onChange, name }: { value: number; onChange: (value: number) => void; name: string }) {
  return <div className="quantity-control" role="group" aria-label={`Quantity for ${name}`}>
    <button type="button" aria-label={`Decrease quantity for ${name}`} disabled={value <= 1} onClick={() => onChange(value - 1)}><Minus size={15}/></button>
    <span aria-live="polite" aria-atomic="true">{value}</span>
    <button type="button" aria-label={`Increase quantity for ${name}`} disabled={value >= MAX_QUANTITY} onClick={() => onChange(value + 1)}><Plus size={15}/></button>
  </div>;
}
