import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import postcss from "rollup-plugin-postcss";
import peerDepsExternal from "rollup-plugin-peer-deps-external";

// Plugin to preserve "use client" directives
function preserveUseClient() {
  return {
    name: "preserve-use-client",
    transform(code, id) {
      if (code.includes('"use client"') || code.includes("'use client'")) {
        return {
          code: `"use client";\n${code}`,
          map: null,
        };
      }
      return null;
    },
  };
}

// Common plugins for both builds
const commonPlugins = [
  peerDepsExternal(),
  resolve({
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  }),
  commonjs(),
  postcss({
    config: {
      path: "./postcss.config.js",
    },
    extensions: [".css"],
    minimize: true,
    inject: {
      insertAt: "top",
    },
  }),
];

export default [
  // Server-safe build (no React components, no "use client")
  {
    input: "src/server.ts",
    output: [
      {
        file: "dist/server.js",
        format: "esm",
        sourcemap: true,
      },
      {
        file: "dist/server.cjs",
        format: "cjs",
        sourcemap: true,
      },
    ],
    plugins: [
      ...commonPlugins,
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
        declarationDir: "dist",
        declarationMap: true,
        exclude: [
          "**/*.test.ts",
          "**/*.test.tsx",
          "src/index.ts",
          "src/flow-execution/**",
        ],
        outDir: "dist",
      }),
    ],
    external: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "zod",
      "@databite/types",
    ],
  },
  // Client build (with React components and "use client")
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.js",
        format: "esm",
        sourcemap: true,
        banner: '"use client";',
      },
      {
        file: "dist/index.cjs",
        format: "cjs",
        sourcemap: true,
        banner: '"use client";',
      },
    ],
    plugins: [
      ...commonPlugins,
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
        declarationDir: "dist",
        declarationMap: true,
        exclude: ["**/*.test.ts", "**/*.test.tsx", "src/server.ts"],
        outDir: "dist",
      }),
      preserveUseClient(),
    ],
    external: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "zod",
      "@databite/types",
    ],
  },
];
