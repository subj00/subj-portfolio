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

  // Routes and DOM components stay free of WebGL dependencies.
  {
    files: ["src/app/**", "src/components/**"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [WEBGL_IMPORTS] }],
    },
  },

  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"]),
]);

export default eslintConfig;
