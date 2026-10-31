import assert from "node:assert/strict";
import { readdir, stat } from "node:fs/promises";
import { test } from "node:test";
import { productImageSrc } from "../src/lib/product-image.ts";

test("collection JPEGs have optimized WebP counterparts", async () => {
  const collectionDirectory = new URL("../public/products/collection/", import.meta.url);
  const optimizedDirectory = new URL("../public/products/optimized/", import.meta.url);
  const photos = (await readdir(collectionDirectory)).filter(file => /\.jpe?g$/i.test(file));

  assert.ok(photos.length > 0);
  for (const photo of photos) {
    const optimizedPhoto = photo.replace(/\.jpe?g$/i, ".webp");
    assert.equal((await stat(new URL(optimizedPhoto, optimizedDirectory))).isFile(), true, `${photo} needs an optimized counterpart`);
    for (const width of [128, 320, 640]) {
      const responsivePhoto = photo.replace(/\.jpe?g$/i, `-${width}.webp`);
      assert.equal((await stat(new URL(responsivePhoto, optimizedDirectory))).isFile(), true, `${photo} needs a ${width}px variant`);
    }
  }
});

test("only local collection JPEG paths are redirected to optimized assets", () => {
  assert.equal(productImageSrc("/products/collection/Bracelet.JPG"), "/products/optimized/Bracelet.webp");
  assert.equal(productImageSrc("https://cdn.example.com/photo.jpg"), "https://cdn.example.com/photo.jpg");
  assert.equal(productImageSrc("/products/collection/photo.png"), "/products/collection/photo.png");
});
