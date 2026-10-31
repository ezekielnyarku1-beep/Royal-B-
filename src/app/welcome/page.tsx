import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { HomeCollection } from "@/components/home-collection";
import { store } from "@/lib/catalogue";
import { createWhatsAppUrl } from "@/lib/whatsapp";
import "./welcome.css";

export const metadata: Metadata = {
  title: "Welcome to Big B Royale",
  description: "Your ideas, our customization. Personalised gifts, watches, jewellery and home essentials from a Ghanaian business with a personal touch.",
};
const contactUrl = createWhatsAppUrl(store.whatsappNumber, "Hello Big B Royale! I'd like to ask about your products and personalisation.");

export default function WelcomePage() {
  return <div className="royale-intro" id="intro-top">
    <a className="intro-skip" href="#intro-start">Skip to shopping</a>
    <main>
      <section className="intro-hero" aria-labelledby="intro-welcome-title">
        <div className="intro-copy">
          <p className="intro-eyebrow">PERSONAL TOUCHES. PROUDLY GHANAIAN.</p>
          <h1 id="intro-welcome-title">Your ideas.<br/>Your style.<br/><em>Big B Royale.</em></h1>
          <p>Personalised gifts, watches, jewellery and home essentials. Find something for yourself or make a thoughtful gift your own.</p>
          <div className="intro-actions"><Link className="intro-primary" href="/shop/">Shop the collection<ArrowRight size={18}/></Link><a className="intro-chat" href={contactUrl} target="_blank" rel="noopener noreferrer"><MessageCircle size={18}/>WhatsApp us</a></div>
          <span className="intro-caption">Browse freely. Confirm your order on WhatsApp.</span>
        </div>
        <div className="intro-hero-photo"><Image src="/landing/photo1-768.webp" alt="The owner of Big B Royale smiling in front of a blue and white building." width={768} height={1024} sizes="(max-width: 700px) 100vw, 45vw" unoptimized preload/><span>A personal touch, from Ghana.</span></div>
      </section>
      <HomeCollection/>
      <section className="intro-founder" aria-labelledby="founder-heading">
        <div className="intro-founder-photos"><Image src="/landing/photo2-480.webp" alt="A close-up portrait of the Big B Royale owner outdoors." width={480} height={640} sizes="(max-width: 700px) 45vw, 240px" loading="lazy" unoptimized/><Image src="/landing/photo3-480.webp" alt="The Big B Royale owner wearing a black-and-gold dress at an event." width={480} height={720} sizes="(max-width: 700px) 38vw, 200px" loading="lazy" unoptimized/></div>
        <div><p className="intro-eyebrow">MEET THE FOUNDER</p><h2 id="founder-heading">A business with<br/>a personal story.</h2><p>Behind Big B Royale is a Ghanaian entrepreneur building a business around personal expression. From a name on a bracelet to a gift chosen with care, this is a place to bring your ideas and make them your own.</p><p>A name, a favourite photo, a message that matters. Share your idea and let’s talk about making it yours.</p><a className="intro-story-link" href={contactUrl} target="_blank" rel="noopener noreferrer">Start a conversation<ArrowRight size={17}/></a></div>
      </section>
    </main>
  </div>;
}
