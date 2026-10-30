import { AuthForm } from "@/components/auth-form";
import { Logo } from "@/components/brand";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import "./login.css";

export const metadata: Metadata = { title: "Log in or sign up | Big B Royale" };

export default function LoginPage() {
  return (
    <main className="auth-page login-redesign">
      <aside className="login-founder-panel" aria-label="Meet the founder of Big B Royale">
        <Link href="/" className="login-founder-logo"><Logo light/></Link>
        <div className="login-founder-story">
          <p className="login-founder-label">Big B Royale · Ghana</p>
          <h1>Built with purpose.<br/><em>Made personal.</em></h1>
          <p>A business of her own. A personal touch for you. Meet the Ghanaian entrepreneur behind Big B Royale, bringing your ideas, your style and thoughtful gifting into one place.</p>
        </div>
        <figure className="login-founder-portrait">
          <img src="/landing/photo3-720.webp" srcSet="/landing/photo3-480.webp 480w, /landing/photo3-720.webp 720w" sizes="260px" width={720} height={1080} alt="The founder of Big B Royale wearing a black-and-gold dress."/>
          <figcaption><strong>The founder behind Big B Royale</strong><span>A Ghanaian business. A personal connection.</span></figcaption>
        </figure>
        <Link className="login-founder-more" href="/">Get to know Big B Royale<ArrowLeft size={17} aria-hidden="true"/></Link>
      </aside>
      <section className="form-side" aria-label="Your Big B Royale account">
        <header className="form-header">
          <Link href="/" className="login-mobile-brand"><Logo light/></Link>
          <Link href="/" className="login-home-link"><ArrowLeft size={18} aria-hidden="true"/><span className="login-desktop-label">Back to home</span><span className="login-mobile-label">Home</span></Link>
        </header>
        <div className="form-stage"><AuthForm /></div>
        <footer className="page-footer"><span>© 2026 Big B Royale</span><Link href="/shop/" className="account-store-link">Visit the store ↗</Link></footer>
      </section>
    </main>
  );
}
