import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand";
import { IntroReveal } from "./reveal";
import "./welcome.css";

export const metadata: Metadata = {
  title: "Welcome to Big B Royale",
  description: "Your ideas, our customization. Discover Big B Royale and find something to make your own.",
};

function Portrait({ name, alt, priority = false, width = 960, height = 1280 }: { name: string; alt: string; priority?: boolean; width?: number; height?: number }) {
  const sizes = [...new Set([480, 768, 960].map(size => Math.min(size, width)))];
  return <div className="intro-portrait" style={{ aspectRatio: `${width} / ${height}` }} data-intro-reveal>
    <img
      src={`/landing/${name}-${width}.webp`}
      srcSet={sizes.map(size => `/landing/${name}-${size}.webp ${size}w`).join(", ")}
      sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1200px) 44vw, 480px"
      width={width} height={height} alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
    />
  </div>;
}

export default function WelcomePage() {
  return <div className="royale-intro" id="intro-top">
    <a className="intro-skip" href="#intro-start">Skip to Get Started</a>
    <header className="intro-header"><a href="#intro-top"><Logo light/></a></header>
    <main>
      <section className="intro-section intro-welcome" aria-labelledby="intro-welcome-title">
        <div className="intro-layout">
          <div className="intro-copy" data-intro-reveal>
            <span className="intro-rule" aria-hidden="true"/>
            <h1 id="intro-welcome-title">Welcome to<br/><span>Big B Royale.</span></h1>
            <a href="#intro-collection" className="intro-scroll"><ArrowDown size={19} aria-hidden="true"/><span>Scroll to discover</span></a>
          </div>
          <Portrait name="photo1" alt="The owner of Big B Royale smiling in front of a blue and white building." priority/>
        </div>
      </section>
      <section className="intro-section intro-collection" id="intro-collection" aria-labelledby="intro-collection-title">
        <div className="intro-layout">
          <Portrait name="photo2" alt="A close-up portrait of the Big B Royale owner outdoors."/>
          <div className="intro-copy" data-intro-reveal><p className="intro-section-label">Our collection</p><h2 id="intro-collection-title">Your Ideas,<br/><em>Our Customization.</em></h2></div>
        </div>
      </section>
      <section className="intro-section intro-style" aria-labelledby="intro-style-title">
        <div className="intro-layout">
          <div className="intro-copy" data-intro-reveal><p className="intro-section-label">Our style</p><h2 id="intro-style-title">Your Style,<br/><em>Your Royale.</em></h2></div>
          <Portrait name="photo3" width={720} height={1080} alt="The Big B Royale owner wearing a black-and-gold dress at an event."/>
        </div>
      </section>
      <section className="intro-start" id="intro-start" aria-labelledby="intro-start-title">
        <div className="intro-start-content" data-intro-reveal>
          <Logo/>
          <h2 id="intro-start-title">Make it personal.</h2>
          <p>Find your next gift. Add your own touch.</p>
          <Link className="intro-start-button" href="/shop/">Get Started<span><ArrowRight size={20} aria-hidden="true"/></span></Link>
          <p className="intro-guest-note">Browse without an account.</p>
          <Link className="intro-signin" href="/">Sign In</Link>
        </div>
      </section>
    </main>
    <footer className="intro-footer"><span>© 2026 Big B Royale</span><a href="#intro-top">Back to top<ArrowDown size={15} aria-hidden="true"/></a></footer>
    <IntroReveal/>
  </div>;
}
