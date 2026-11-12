"use client";
import Image from "next/image";
import Link from "next/link";
import { useCatalogue } from "./commerce-provider";
import { priceLabel } from "@/lib/catalogue";
import { productImageSrc } from "@/lib/product-image";

const categoryOrder = ["Bracelets", "Necklaces", "Watches", "Gift Sets", "Home & Living", "Bedsheets"];
const categoryNotes: Record<string, string> = {
  Bracelets: "A name worth keeping", Necklaces: "Close to your heart", Watches: "Make time for your style",
  "Gift Sets": "A little more thoughtful", "Home & Living": "Make yourself at home", Bedsheets: "Your everyday comfort",
};

export function HomeCollection() {
  const { products } = useCatalogue();
  const available = [...new Set(products.map(product => product.category))];
  const categories = [...categoryOrder.filter(category => available.includes(category)), ...available.filter(category => !categoryOrder.includes(category))];
  const picks = ["Bracelets", "Necklaces", "Watches", "Rings"].map(category => products.find(product => product.category === category && !product.imageIsPlaceholder)).filter(product => product !== undefined);
  return <>
    <section className="intro-collection" id="intro-start" aria-labelledby="collection-title">
      <div className="intro-collection-heading"><div><p className="intro-eyebrow">THE COLLECTION</p><h2 id="collection-title">Find your <em>kind of lovely.</em></h2></div><Link href="/shop/">Explore everything</Link></div>
      <div className="intro-category-row">{categories.map((category, index) => {
        const product = products.find(item => item.category === category)!;
        return <Link href={`/shop/?category=${encodeURIComponent(category)}#collection`} key={category} aria-label={category}><div><Image src={productImageSrc(product.image)} alt={product.name} width={300} height={360} sizes="(max-width: 700px) 160px, 195px" loading="lazy"/><span className="intro-category-index">{String(index + 1).padStart(2, "0")}</span></div><span>{category}</span><small>{categoryNotes[category] ?? "Discover the collection"}</small></Link>;
      })}</div>
    </section>
    {picks.length > 0 && <section className="intro-picks" aria-labelledby="picks-heading"><div className="intro-collection-heading"><div><p className="intro-eyebrow">A FEW PLACES TO START</p><h2 id="picks-heading">Little details. <em>Big meaning.</em></h2></div><Link href="/shop/">Shop all</Link></div><div className="intro-picks-grid">{picks.map(product => <Link href={`/shop/?product=${encodeURIComponent(product.id)}`} key={product.id} className="intro-pick"><div><Image src={productImageSrc(product.image)} alt={product.name} width={320} height={360} sizes="(max-width: 700px) 45vw, 280px" loading="lazy"/></div><small>{product.category}</small><h3>{product.name}</h3><p>{priceLabel(product)}</p></Link>)}</div></section>}
  </>;
}
