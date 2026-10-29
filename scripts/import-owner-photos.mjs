// Copies the owner's second photo batch unchanged. The repeated cuff image
// shares one asset; product data lives in src/lib/collection-additions.ts.
import { copyFile, mkdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const sourceDirectory = process.argv[2];
if (!sourceDirectory) throw new Error("Pass the directory containing the supplied WhatsApp JPEGs.");
export const photoImports = [
  ["6.26.48", "watch-rose-black"],
  ["6.26.49", "wood-look-gift-set"],
  ["6.26.50 PM (1)", "watch-gold-detail-black-strap"],
  ["6.26.50 PM (2)", "bathroom-rack-style-one"],
  ["6.26.50", "grey-quilted-bedding"],
  ["6.26.51 PM (1)", "watch-tan-minimal"],
  ["6.26.51", "watch-gold-octagonal-brown"],
  ["6.26.52 PM (1)", "black-rectangular-watch-bracelet-set"],
  ["6.26.52 PM (2)", "forever-message-necklace"],
  ["6.26.52", "sculptural-cuff-bangle"],
  ["6.26.53 PM (1)", "portrait-photo-necklace"],
  ["6.26.53 PM (2)", "crown-name-bracelet"],
  ["6.26.53", "rectangular-floor-mirror"],
  ["6.26.54 PM (1)", "white-pattern-modular-wardrobe"],
  ["6.26.54 PM (2)", "blue-compact-modular-wardrobe"],
  ["6.26.54", "personalized-gold-watch-bracelet-set"],
  ["6.26.55 PM (1)", "watch-rose-mesh-brown-dial"],
  ["6.26.55 PM (2)", "joyceline-necklace-bracelet-set"],
  ["6.26.55 PM (3)", "sculptural-cuff-bangle"],
  ["6.26.55", "built-in-cable-power-bank"],
  ["6.26.56 PM (1)", "purple-two-tone-three-piece-set"],
  ["6.26.56 PM (2)", "white-charger-cable-kit"],
  ["6.26.56 PM (3)", "watch-silver-blue-roman-dial"],
  ["6.26.56", "white-dial-gold-watch-bracelet-set"],
  ["6.26.57 PM (1)", "grey-bathroom-mat"],
  ["6.26.57", "carry-loop-power-bank"],
  ["6.26.58 PM (1)", "watch-blue-link-grey-dial"],
  ["6.26.58", "brown-pattern-modular-wardrobe"],
  ["6.26.59 PM (1)", "open-link-cuff-bangle"],
  ["6.26.59", "silver-nk-name-bracelet"],
  ["6.27.00 PM (1)", "engraved-plate-bracelet"],
  ["6.27.00", "watch-black-detail-black-strap"],
  ["6.27.01 PM (1)", "arched-floor-mirror"],
  ["6.27.01 PM (2)", "round-heart-name-necklace"],
  ["6.27.01", "double-rail-clothes-rack"],
  ["6.27.02 PM (1)", "watch-rose-red-dial"],
  ["6.27.02", "watch-black-blue-sports"],
  ["6.27.03 PM (1)", "golden-yellow-curtains"],
  ["6.27.03", "engraved-chain-bracelet"],
  ["6.27.04 PM (1)", "black-dial-gold-three-piece-set"],
  ["6.27.04 PM (2)", "earbuds-colour-styles"],
  ["6.27.04", "flowing-cuff-bangle"],
  ["6.27.05 PM (1)", "watch-black-octagonal-black-strap"],
  ["6.27.05 PM (2)", "watch-black-floral-dial"],
  ["6.27.05 PM (3)", "suction-style-power-bank"],
  ["6.27.05", "watch-two-tone-black-dial"],
  ["6.27.06 PM (1)", "braided-initial-bracelet"],
  ["6.27.06", "heart-charm-name-necklace"],
  ["6.27.07 PM (1)", "ivan-naya-bracelets"],
  ["6.27.07 PM (2)", "red-dial-black-watch-bracelet-set"],
  ["6.27.07", "brown-textured-curtains"],
  ["6.27.08 PM (1)", "blue-silver-three-piece-set"],
  ["6.27.08", "engraved-bar-necklace"],
  ["6.27.09 PM (1)", "black-textured-curtains"],
  ["6.27.09 PM (2)", "watch-brown-strap-grey-dial"],
  ["6.27.09", "leo-gracia-name-rings"],
  ["6.27.10 PM (1)", "shelf-base-clothes-rack"],
  ["6.27.10", "watch-blue-strap-white-dial"],
  ["6.27.11 PM (1)", "yellow-floral-quilted-bedding"],
  ["6.27.11 PM (2)", "black-three-piece-gift-set"],
  ["6.27.11", "watch-silver-square-blue-dial"],
  ["6.27.12 PM (1)", "green-textured-curtains"],
  ["6.27.12 PM (2)", "watch-brown-dot-dial"],
  ["6.27.12", "watch-silver-black-cushion-dial"],
  ["6.27.13 PM (1)", "watch-silver-white-cushion-dial"],
  ["6.27.13 PM (2)", "classic-chain-bracelet"],
  ["6.27.13", "watch-black-dot-dial"],
  ["6.27.14", "blue-wide-modular-wardrobe"],
  ["6.27.15 PM (1)", "space-print-quilted-bedding"],
  ["6.27.15 PM (2)", "blue-floral-quilted-bedding"],
  ["6.27.15", "watch-gold-analogue-digital"],
  ["6.27.16 PM (1)", "purple-two-tone-watch-bracelet-set"],
  ["6.27.16", "photo-necklace-bracelet-set"],
  ["6.27.17 PM (1)", "my-man-three-piece-gift-set"],
  ["6.27.17 PM (2)", "watch-silver-detail-brown-strap"],
  ["6.27.17", "side-shelf-clothes-rack"],
  ["6.27.18", "bathroom-rack-style-two"],
];

const destination = path.resolve("public/products/collection");
await mkdir(destination, { recursive: true });
const imported = new Map();
for (const [stamp, name] of photoImports) {
  const filename = `WhatsApp Image 2026-10-29 at ${stamp.includes(" PM") ? stamp : `${stamp} PM`}.jpeg`;
  const source = path.join(sourceDirectory, filename);
  const hash = createHash("sha256").update(await readFile(source)).digest("hex");
  if (imported.has(name)) {
    if (imported.get(name) !== hash) throw new Error(`Different photos share an asset name: ${name}`);
    continue;
  }
  await copyFile(source, path.join(destination, `${name}.jpg`));
  imported.set(name, hash);
}
console.log(`Imported ${imported.size} unique photos from ${photoImports.length} supplied files.`);
