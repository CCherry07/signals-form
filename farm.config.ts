import { defineConfig } from '@farmfe/core';
export default defineConfig({
  compilation: {
    presetEnv: false,
    minify: false,
    sourcemap: true,
  }
});
