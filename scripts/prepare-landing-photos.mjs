import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

// Explicit source paths only. Photographs are resized without cropping or retouching.
const sources = process.argv.slice(2);
if (sources.length !== 3) throw new Error("Pass the welcome, collection and style photograph paths, in that order.");
const names = ["photo1", "photo2", "photo3"];
await mkdir("public/landing", { recursive: true });
for (const [index, source] of sources.entries()) {
  const input = resolve(source);
  const metadata = await sharp(input).metadata();
  const width = metadata.autoOrient?.width ?? metadata.width;
  const height = metadata.autoOrient?.height ?? metadata.height;
  if (!width || !height || width >= height) throw new Error(`Photo ${index + 1} must be the supplied portrait. Check the source file.`);
  for (const size of new Set([480, 768, 960].map(size => Math.min(size, width)))) {
    await sharp(input).rotate().resize({ width: size, withoutEnlargement: true }).webp({ quality: 83, effort: 5 }).toFile(`public/landing/${names[index]}-${size}.webp`);
  }
  console.log(`Prepared ${names[index]}: ${width} x ${height}, preserving its full proportions.`);
}
