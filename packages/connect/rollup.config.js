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

export default {
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
    peerDepsExternal(),
    resolve({
      extensions: [".js", ".jsx", ".ts", ".tsx"],
    }),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: true,
      declarationDir: "dist",
      exclude: ["**/*.test.ts", "**/*.test.tsx"],
    }),
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
    preserveUseClient(),
  ],
  external: ["react", "react-dom", "react/jsx-runtime"],
};
