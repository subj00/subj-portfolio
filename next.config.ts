import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Both flags become the default in the next major. Every route here is static,
  // so they cost nothing. Note: cacheComponents keeps up to 3 visited routes
  // mounted-but-hidden via <Activity>, so effects (timelines, scene anchors)
  // clean up on hide and re-run on show, not only on unmount.
  cacheComponents: true,
  partialPrefetching: true,
  typedRoutes: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
