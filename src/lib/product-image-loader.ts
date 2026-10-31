import type { ImageLoaderProps } from "next/image";

const optimizedProductPath = "/products/optimized/";

export default function productImageLoader({ src, width }: ImageLoaderProps) {
  if (!src.startsWith(optimizedProductPath) || width === 960) return src;
  return src.replace(/\.webp$/i, `-${width}.webp`);
}
