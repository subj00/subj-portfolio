import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Libraries that must never leak into the initial (server or first-paint) bundle.
// They are reachable only through the lazy Stage in src/runtime.
const WEBGL_IMPORTS = {
  group: ["three", "three/*", "@react-three/*", "@/webgl", "@/webgl/*", "@/experiences/*"],
  message:
    "WebGL code is loaded lazily by the runtime Stage. Declare scenes with <SceneAnchor> instead of importing 3D code here.",
};

// GSAP plugins and Lenis are registered/owned in src/animation; import them from there.
const ANIMATION_IMPORTS = {
  group: ["gsap/*", "@gsap/react", "lenis", "lenis/*"],
  message:
    'Import gsap, ScrollTrigger and useGSAP from "@/animation/gsap" (plugins are registered there). Lenis is owned by src/animation/smooth-scroll.',
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Type-aware rules that catch real bugs in async/animation code.
  {
    files: ["**/*.{ts,tsx,mts}"],
    languageOptions: {
      parserOptions: { projectService: true },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },

  // Later blocks replace (not merge) no-restricted-imports, so each lists every pattern it needs.
  {
    files: ["src/**"],
    ignores: ["src/animation/**"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [ANIMATION_IMPORTS] }],
    },
  },

  // Routes and DOM components stay free of WebGL dependencies.
  {
    files: ["src/app/**", "src/components/**"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [WEBGL_IMPORTS, ANIMATION_IMPORTS] }],
    },
  },

  // Content and types are pure data: no React, no runtime libraries, no app code.
  {
    files: ["src/content/**", "src/types/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react",
                "react-dom",
                "next",
                "next/*",
                "gsap",
                "gsap/*",
                "lenis",
                "zustand",
                "three",
                "three/*",
                "@react-three/*",
                "@/*",
                "!@/types",
                "!@/types/*",
                "!@/content",
                "!@/content/*",
              ],
              message: "src/content and src/types may only import from @/types and @/content.",
            },
          ],
        },
      ],
    },
  },

  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"]),
]);

export default eslintConfig;
