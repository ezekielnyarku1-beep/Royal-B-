import type { Metadata } from "next";
import Image from "next/image";
import { Cormorant_Garamond } from "next/font/google";
import Link from "next/link";
import { MessageCircle, Sparkle } from "lucide-react";
import { HomeCollection } from "@/components/home-collection";
import { HomeCarousel } from "@/components/home-carousel";
import { store } from "@/lib/catalogue";
import { createWhatsAppUrl } from "@/lib/whatsapp";
import "./welcome.css";
import "./campaign.css";

const campaignFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-campaign",
});

export const metadata: Metadata = {
  title: "Big B Royale | Thoughtful finds. Personal touches.",
  description: "Discover personalised gifts, watches, jewellery and home essentials from Big B Royale. Thoughtfully chosen in Ghana. Personally yours.",
};
const contactUrl = createWhatsAppUrl(store.whatsappNumber, "Hello Big B Royale! I'd like to ask about your products and personalisation.");

export default function WelcomePage() {
  return <div className={`royale-intro ${campaignFont.variable}`} id="intro-top">
    <a className="intro-skip" href="#intro-start">Skip to shopping</a>
    <main>
      <div className="intro-announcement">Thoughtful finds. Personal touches. <span>Proudly Ghanaian.</span></div>
      <HomeCarousel/>
      <HomeCollection/>
      <section className="intro-personal" aria-labelledby="personal-heading">
        <div className="intro-personal-heading"><p className="intro-eyebrow">FROM AN IDEA TO SOMETHING YOURS</p><h2 id="personal-heading">Good gifts start<br/>with <em>a little thought.</em></h2><Link className="intro-text-link" href="/about/#how-to-order">Here’s how it works</Link></div>
        <ol className="intro-order-steps">
          <li><span>01</span><div><h3>Find your something.</h3><p>Explore the collection and add your favourites to your bag.</p></div></li>
          <li><span>02</span><div><h3>Make it personal.</h3><p>Add a name, a favourite photo or a note about the style you have in mind.</p></div></li>
          <li><span>03</span><div><h3>Let’s talk details.</h3><p>Send your request on WhatsApp. We’ll confirm pricing, availability and delivery.</p></div></li>
        </ol>
      </section>
      <section className="intro-founder" aria-labelledby="founder-heading">
        <div className="intro-founder-photos"><Image src="/landing/photo1-768.webp" alt="The owner of Big B Royale smiling in front of a blue and white building." width={768} height={1024} sizes="(max-width: 700px) 70vw, 340px" loading="lazy" unoptimized/><Image src="/landing/photo2-480.webp" alt="A close-up portrait of the Big B Royale owner outdoors." width={480} height={640} sizes="(max-width: 700px) 33vw, 190px" loading="lazy" unoptimized/><span>From Ghana, with a personal touch.</span></div>
        <div className="intro-founder-copy"><p className="intro-eyebrow">THE PERSON BEHIND THE PERSONAL</p><h2 id="founder-heading">A small business.<br/><em>A personal story.</em></h2><p>Behind Big B Royale is a Ghanaian entrepreneur with a simple idea: the things we choose should mean something.</p><p>From a name on a bracelet to a gift chosen with care, this is a place to bring your ideas and make them your own.</p><Link className="intro-story-link" href="/about/">Meet the founder</Link></div>
      </section>
      <section className="intro-invitation" aria-labelledby="invitation-heading"><Sparkle size={26} strokeWidth={1.1} aria-hidden="true"/><p className="intro-eyebrow">SOMETHING IN MIND?</p><h2 id="invitation-heading">Let’s make it <em>yours.</em></h2><p>Have a gift idea or a question? There’s a real person on the other side.</p><a className="intro-primary" href={contactUrl} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true"/>Start a conversation</a></section>
    </main>
  </div>;
}
