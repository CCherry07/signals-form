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
    presetEnv: false,
    minify: false,
    sourcemap: true,
  }
});
