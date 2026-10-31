import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { store } from "@/lib/catalogue";
import { createWhatsAppUrl } from "@/lib/whatsapp";
import "./about.css";

export const metadata: Metadata = {
  title: "About Big B Royale",
  description: "Meet the Ghanaian entrepreneur behind Big B Royale and learn how to order personalised gifts, watches and home essentials.",
};
const contactUrl = createWhatsAppUrl(store.whatsappNumber, "Hello Big B Royale! I'd like to ask about your products and personalisation.");

export default function AboutPage() {
  return <main className="about-page" id="about-main">
    <section className="about-founder" aria-labelledby="about-heading">
      <div className="about-copy"><p className="about-eyebrow">MEET THE FOUNDER</p><h1 id="about-heading">A business with<br/>a personal story.</h1><p>Behind Big B Royale is a Ghanaian entrepreneur building a business around personal expression. From a name on a bracelet to a gift chosen with care, this is a place to bring your ideas and make them your own.</p><p>A name, a favourite photo, a message that matters. Share your idea and let’s talk about making it yours.</p><div className="about-actions"><Link className="about-primary" href="/shop/">Shop the collection<ArrowRight size={18}/></Link><a href={contactUrl} target="_blank" rel="noopener noreferrer"><MessageCircle size={18}/>WhatsApp us</a></div></div>
      <div className="about-portraits"><Image unoptimized preload src="/landing/photo1-768.webp" alt="The owner of Big B Royale smiling in front of a blue and white building." width={768} height={1024} sizes="(max-width: 700px) 90vw, 40vw"/><div><Image unoptimized src="/landing/photo2-480.webp" alt="A close-up portrait of the Big B Royale owner outdoors." width={480} height={640} sizes="(max-width: 700px) 44vw, 20vw"/><Image unoptimized src="/landing/photo3-480.webp" alt="The Big B Royale owner wearing a black-and-gold dress at an event." width={480} height={720} sizes="(max-width: 700px) 44vw, 20vw"/></div></div>
    </section>
    <section className="about-order" id="how-to-order" aria-labelledby="order-heading"><p className="about-eyebrow">A PERSONAL WAY TO SHOP</p><h2 id="order-heading">How to order</h2><p>Choose your items and send your request on WhatsApp.</p><ol>
      <li><span>01</span><div><h3>Choose your products</h3><p>Browse products and choose quantities.</p></div></li>
      <li><span>02</span><div><h3>Add your details</h3><p>Choose quantities and tell us about names, styles or special requests.</p></div></li>
      <li><span>03</span><div><h3>Send your request</h3><p>Send your bag on WhatsApp. We’ll confirm pricing, availability, customisation and delivery charges.</p></div></li>
    </ol><p className="about-delivery">{store.delivery}</p><div className="about-actions"><Link className="about-primary" href="/shop/">Start shopping<ArrowRight size={18}/></Link><a href={contactUrl} target="_blank" rel="noopener noreferrer"><MessageCircle size={18}/>Talk to us on WhatsApp</a></div></section>
  </main>;
}
