import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  poweredByHeader: false,
  devIndicators: false,
  images: {
    loader: "custom",
    loaderFile: "./src/lib/product-image-loader.ts",
    deviceSizes: [320, 640, 960],
    imageSizes: [128],
  },
};

export default nextConfig;
