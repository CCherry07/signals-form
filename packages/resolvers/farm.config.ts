import { defineConfig } from '@farmfe/core';
export default defineConfig({
  compilation: {
    input: {
      index: "./index.ts"
    },
    output: {
      format: "esm",
      targetEnv: "library-browser",
    },
    external: [
      "^zod",
    ],
    presetEnv: false,
    sourcemap: true,
  }
});
