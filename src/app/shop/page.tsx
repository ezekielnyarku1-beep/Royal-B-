import type { Metadata } from "next";
import { Storefront } from "@/components/storefront/storefront";
import "./store.css";
import "./mobile.css";
import "./refinements.css";

export const metadata: Metadata = {
  title: "Big B Royale | Thoughtful finds. Personal touches.",
  description: "Explore personalisation and gifting ideas from Big B Royale. Ask about prices, availability and delivery directly on WhatsApp.",
};

export default function ShopPage() { return <Storefront />; }
