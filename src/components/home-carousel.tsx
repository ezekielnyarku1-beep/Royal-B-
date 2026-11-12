"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const slides = [
  {
    src: "/landing/photo1-960.webp",
    srcSet: "/landing/photo1-480.webp 480w, /landing/photo1-768.webp 768w, /landing/photo1-960.webp 960w",
    alt: "The Big B Royale founder smiling outside a blue and white building.",
    caption: "A warm welcome. A personal touch.",
    width: 960,
    height: 1280,
  },
  {
    src: "/landing/photo2-960.webp",
    srcSet: "/landing/photo2-480.webp 480w, /landing/photo2-768.webp 768w, /landing/photo2-960.webp 960w",
    alt: "An outdoor portrait of the Big B Royale founder.",
    caption: "Your ideas, made personal.",
    width: 960,
    height: 1280,
  },
  {
    src: "/landing/photo3-720.webp",
    srcSet: "/landing/photo3-480.webp 480w, /landing/photo3-720.webp 720w",
    alt: "The Big B Royale founder wearing a black and gold dress at an event.",
    caption: "Your own kind of royal.",
    width: 720,
    height: 1080,
  },
];

export function HomeCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const region = useRef<HTMLElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const rotating = !paused && !reducedMotion && !hovered && inView && pageVisible;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateMotion();
    updateVisibility();
    media.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.1 },
    );
    if (region.current) observer?.observe(region.current);
    return () => {
      media.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setTimeout(() => setActive(current => (current + 1) % slides.length), 7500);
    return () => window.clearTimeout(timer);
  }, [active, rotating]);

  function choose(index: number) {
    setPaused(true);
    setActive((index + slides.length) % slides.length);
  }

  return (
    <section
      className="royale-campaign"
      ref={region}
      aria-roledescription="carousel"
      aria-label="The Big B Royale story"
      onPointerEnter={event => { if (event.pointerType === "mouse") setHovered(true); }}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={event => {
        if (!(event.target instanceof Element) || !event.target.closest(".campaign-play")) setPaused(true);
      }}
      onKeyDown={event => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.key === "ArrowRight") { event.preventDefault(); choose(active + 1); }
        if (event.key === "ArrowLeft") { event.preventDefault(); choose(active - 1); }
      }}
      onTouchStart={event => {
        if (event.touches.length !== 1 || (event.target instanceof Element && event.target.closest("a, button"))) {
          touchStart.current = null;
          return;
        }
        touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }}
      onTouchCancel={() => { touchStart.current = null; }}
      onTouchEnd={event => {
        const start = touchStart.current;
        touchStart.current = null;
        if (!start || event.changedTouches.length !== 1) return;
        const dx = start.x - event.changedTouches[0].clientX;
        const dy = start.y - event.changedTouches[0].clientY;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) choose(active + (dx > 0 ? 1 : -1));
      }}
    >
      <div className="campaign-portraits">
        {slides.map((slide, index) => (
          <div className="campaign-slide" data-active={active === index} aria-hidden={active !== index} key={slide.src}>
            <div className="campaign-frame">
              <img src={slide.src} srcSet={slide.srcSet} sizes="(max-width: 800px) 90vw, 50vw" width={slide.width} height={slide.height} alt={slide.alt} fetchPriority={index === 0 ? "high" : "low"} loading="eager" decoding="async"/>
            </div>
          </div>
        ))}
      </div>
      <div className="campaign-content">
        <p className="campaign-eyebrow"><span aria-hidden="true"/>PERSONAL TOUCHES. PROUDLY GHANAIAN.</p>
        <h1 id="intro-welcome-title"><em>Big B Royale.</em></h1>
        <p className="campaign-description">Personalised gifts, watches and everyday finds.<br/>A little something that feels like you.</p>
        <div className="campaign-actions">
          <Link href="/shop/" className="campaign-shop">Shop the collection</Link>
          <a href="#intro-start" className="campaign-explore">Explore collections</a>
        </div>
      </div>
      <div className="campaign-bottom">
        <a className="campaign-scroll" href="#intro-start"><span aria-hidden="true"/>SCROLL TO DISCOVER</a>
        <div className="campaign-controls">
          <span className="campaign-number" aria-hidden="true">0{active + 1}<span> / 03</span></span>
          <div className="campaign-dots" role="group" aria-label="Choose a photograph">
            {slides.map((slide, index) => <button type="button" key={slide.src} aria-label={`Show photo ${index + 1}: ${slide.caption}`} aria-pressed={active === index} onClick={() => choose(index)}><span/></button>)}
          </div>
          {!reducedMotion && <button type="button" className="campaign-play" aria-label={paused ? "Play slideshow" : "Pause slideshow"} onClick={() => setPaused(current => !current)}>{paused ? "Play" : "Pause"}</button>}
        </div>
        <div className="campaign-caption" aria-hidden="true"><span>THE BIG B ROYALE STORY</span><p>{slides[active].caption}</p></div>
        <div className="campaign-navigation" role="group" aria-label="Browse photographs"><button type="button" onClick={() => choose(active - 1)} aria-label="Previous photo">Previous</button><button type="button" onClick={() => choose(active + 1)} aria-label="Next photo">Next</button></div>
      </div>
      <p className="campaign-sr-only" aria-live={rotating ? "off" : "polite"} aria-atomic="true">Photo {active + 1} of 3: {slides[active].caption}</p>
    </section>
  );
}
