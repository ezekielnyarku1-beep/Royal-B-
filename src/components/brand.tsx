import { ArrowUpRight, Crown, PackageCheck, Sparkles } from "lucide-react";

export function Logo({ light = false }: { light?: boolean }) {
  return <div className={`brand-logo ${light ? "brand-logo-light" : ""}`} role="img" aria-label="Big B Royale">
    <span className="logo-mark" aria-hidden="true"><Crown size={19} strokeWidth={1.5} /><span>B</span></span>
    <span className="logo-wordmark">BIG B <span>ROYALE</span></span>
  </div>;
}

export function ShoppingBags() {
  return <svg viewBox="0 0 620 420" className="shopping-art" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="bagWhite" x1="210" y1="145" x2="430" y2="420" gradientUnits="userSpaceOnUse"><stop stopColor="var(--white)"/><stop offset="1" stopColor="var(--border)"/></linearGradient>
      <linearGradient id="bagBlue" x1="100" y1="172" x2="290" y2="375" gradientUnits="userSpaceOnUse"><stop stopColor="var(--blue)"/><stop offset="1" stopColor="var(--blue)"/></linearGradient>
      <linearGradient id="bagSide" x1="410" y1="150" x2="475" y2="375" gradientUnits="userSpaceOnUse"><stop stopColor="var(--border)"/><stop offset="1" stopColor="var(--blue-soft)"/></linearGradient>
      <linearGradient id="goldRibbon" x1="342" y1="200" x2="384" y2="350" gradientUnits="userSpaceOnUse"><stop stopColor="var(--gold)"/><stop offset=".5" stopColor="var(--gold)"/><stop offset="1" stopColor="var(--gold)"/></linearGradient>
      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="13"/></filter>
    </defs>
    <circle cx="321" cy="205" r="159" stroke="var(--white)" strokeOpacity=".1"/>
    <circle cx="321" cy="205" r="189" stroke="var(--white)" strokeOpacity=".07"/>
    <ellipse cx="320" cy="375" rx="213" ry="17" fill="var(--ink)" fillOpacity=".35" filter="url(#shadow)"/>
    <g transform="rotate(-10 200 270)">
      <path d="M106 184 246 167 279 190 275 354 122 366Z" fill="url(#bagBlue)"/>
      <path d="m246 167 33 23-4 164-30-18Z" fill="var(--ink)"/>
      <path d="m106 184 140-17 33 23-143 17Z" fill="var(--gold)"/>
      <path d="M145 205v-52c0-54 70-58 70-6v49" stroke="var(--ink)" strokeWidth="8" strokeLinecap="round"/>
      <path d="M145 205v-52c0-54 70-58 70-6v49" stroke="var(--border)" strokeWidth="3" strokeLinecap="round"/>
      <path d="m169 266 13 10 11-17 11 13 14-15-7 30-36 4Z" stroke="var(--gold)" strokeWidth="2"/>
      <text x="196" y="319" textAnchor="middle" fill="var(--border)" fontFamily="Georgia, serif" fontSize="24">B</text>
    </g>
    <g transform="rotate(7 365 270)">
      <path d="m255 152 160 1 51 34-11 182-205 1Z" fill="url(#bagWhite)"/>
      <path d="m415 153 51 34-11 182-41-27Z" fill="url(#bagSide)"/>
      <path d="m255 152 160 1 51 34-174-5Z" fill="var(--gold)"/>
      <path d="M299 184v-62c0-64 80-64 80 0v62" stroke="var(--gold)" strokeWidth="9" strokeLinecap="round"/>
      <path d="M299 184v-62c0-64 80-64 80 0v62" stroke="var(--white)" strokeWidth="4" strokeLinecap="round"/>
      <path d="M348 184h17l-1 184h-18Z" fill="url(#goldRibbon)" fillOpacity=".8"/>
      <rect x="294" y="239" width="87" height="85" rx="1" fill="var(--white)" transform="rotate(-4 337 280)"/>
      <path d="m320 260 10 8 9-12 8 11 11-9-5 23h-28Z" stroke="var(--ink)" strokeWidth="1.7"/>
      <text x="338" y="307" textAnchor="middle" fill="var(--blue)" fontFamily="Georgia, serif" fontSize="25">B</text>
    </g>
    <path d="m491 113 4 13 13 4-13 4-4 13-4-13-13-4 13-4Z" fill="var(--gold)"/>
    <path d="m116 109 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="var(--gold)"/>
    <circle cx="504" cy="298" r="3" fill="var(--gold)"/><circle cx="182" cy="89" r="2" fill="var(--gold)"/>
  </svg>;
}

export function BrandPanel() {
  return <aside className="brand-panel" aria-label="Welcome to Big B Royale">
    <Logo light />
    <div className="brand-story">

      <h1>Big B Royale</h1>
      <p>Personalised gifts, watches<br />and home essentials.</p>
    </div>
    <div className="art-wrap"><ShoppingBags /><div className="art-note"><span className="note-icon"><Sparkles size={18}/></span><div>Made for you.<small>Shop Big B Royale.</small></div><ArrowUpRight size={18} className="note-arrow"/></div></div>
    <div className="brand-bottom"><div><PackageCheck size={19} strokeWidth={1.5}/><span>Browse products and order on WhatsApp.</span></div><span className="brand-bottom-line" /></div>
  </aside>;
}
