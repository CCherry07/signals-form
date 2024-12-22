import { defineConfig } from '@farmfe/core';
export default defineConfig({
  compilation: {
    input: {
      index: "./index.tsx"
    },
    output: {
      format: "esm",
      targetEnv: "library-browser",
    },
    external: [
      "@preact/signals-core",
      "zod",
    ],
    presetEnv: false,
    sourcemap: true,
  }
});
