const collectionPath = "/products/collection/";

export function productImageSrc(src: string) {
  if (!src.startsWith(collectionPath)) return src;
  return src.replace(/^\/products\/collection\/(.+)\.jpe?g$/i, "/products/optimized/$1.webp");
}
