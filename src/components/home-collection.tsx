"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useCatalogue } from "./commerce-provider";
import { productImageSrc } from "@/lib/product-image";

export function HomeCollection() {
  const { products } = useCatalogue();
  const categories = [...new Set(products.map(product => product.category))];
  return <section className="intro-collection" id="intro-start" aria-labelledby="collection-title">
    <div className="intro-collection-heading"><div><p className="intro-eyebrow">FIND SOMETHING THAT FEELS LIKE YOU</p><h2 id="collection-title">Make it personal.</h2></div><Link href="/shop/">View all<ArrowUpRight size={17}/></Link></div>
    <div className="intro-category-row">{categories.map(category => {
      const product = products.find(item => item.category === category)!;
      return <Link href={`/shop/?category=${encodeURIComponent(category)}#collection`} key={category}><div><Image src={productImageSrc(product.image)} alt={product.name} width={300} height={300} sizes="(max-width: 700px) 150px, 190px" loading="lazy"/></div><span>{category}<ArrowUpRight size={16}/></span></Link>;
    })}</div>
  </section>;
}
