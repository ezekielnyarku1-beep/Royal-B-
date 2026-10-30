"use client";
import { useEffect } from "react";

/** Keep the page visible without JavaScript; reveal only off-screen content. */
export function IntroReveal() {
  useEffect(() => {
    if (!window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const elements = document.querySelectorAll<HTMLElement>(".royale-intro [data-intro-reveal]");
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        (entry.target as HTMLElement).dataset.introPending = "false";
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08 });
    for (const element of elements) {
      if (element.getBoundingClientRect().top > window.innerHeight * 0.95) {
        element.dataset.introPending = "true";
        observer.observe(element);
      }
    }
    return () => { observer.disconnect(); elements.forEach(element => { delete element.dataset.introPending; }); };
  }, []);
  return null;
}
