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
  // Every page lives under a locale; the bare root goes to the default (Serbian).
  // Temporary (307), so a future language-negotiation step can change it freely.
  async redirects() {
    return [{ source: "/", destination: "/sr", permanent: false }];
  },
  turbopack: {
    rules: {
      "*.css": {
        // Tailwind for global stylesheets only. CSS Modules (*.module.css) keep
        // Next's native handling, which scopes their class names; routing them
        // through this rule (as: "*.css") would turn them into unscoped globals.
        condition: { not: { path: /\.module\.css$/ } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
