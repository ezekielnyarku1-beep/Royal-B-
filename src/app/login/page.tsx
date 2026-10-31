import Image from "next/image";
import { AuthForm } from "@/components/auth-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import "./login.css";

export const metadata: Metadata = { title: "Log in or sign up | Big B Royale" };

export default function LoginPage() {
  return (
    <main className="auth-page login-redesign">
      <aside className="login-founder-panel" aria-label="Meet the founder of Big B Royale">
        <div className="login-founder-story">
          <p className="login-founder-label">Big B Royale · Ghana</p>
          <h1>Built with purpose.<br/><em>Made personal.</em></h1>
          <p>A business of her own. A personal touch for you. Meet the Ghanaian entrepreneur behind Big B Royale, bringing your ideas, your style and thoughtful gifting into one place.</p>
        </div>
        <figure className="login-founder-portrait">
          <Image unoptimized src="/landing/photo3-480.webp" sizes="260px" width={720} height={1080} alt="The founder of Big B Royale wearing a black-and-gold dress."/>
          <figcaption><strong>The founder behind Big B Royale</strong><span>A Ghanaian business. A personal connection.</span></figcaption>
        </figure>
        <Link className="login-founder-more" href="/">Get to know Big B Royale<ArrowLeft size={17} aria-hidden="true"/></Link>
      </aside>
      <section className="form-side" aria-label="Your Big B Royale account">
        <div className="form-stage"><AuthForm /></div>
      </section>
    </main>
  );
}
