import { defineConfig } from '@farmfe/core';
export default defineConfig({
  compilation: {
    input: {
      index: "./packages/core/index.ts"
    },
    output: {
      format: "esm",
      targetEnv: "library-browser",
    },
    external: [
      "@preact/signals-core",
      "zod",
      "react"
    ],
    presetEnv: false,
    sourcemap: true,
  }
});
