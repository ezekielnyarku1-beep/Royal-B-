import { AuthForm } from "@/components/auth-form";
import { BrandPanel, Logo } from "@/components/brand";
import Link from "next/link";

export default function Home() {
  return (
    <main className="auth-page">
      <BrandPanel />
      <section className="form-side" aria-label="Your Big B Royale account">
        <header className="form-header">
          <div className="mobile-logo"><Logo /></div>
          <span className="ghana-badge"><span className="ghana-flag" aria-hidden="true"><span>★</span></span> Proudly Ghanaian</span>
        </header>
        <div className="form-stage"><AuthForm /></div>
        <footer className="page-footer"><span>© 2026 Big B Royale</span><Link href="/shop/" className="account-store-link">Visit the store ↗</Link></footer>
      </section>
    </main>
  );
}
