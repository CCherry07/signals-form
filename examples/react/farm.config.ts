import { defineConfig } from '@farmfe/core';
import react from "@farmfe/plugin-react"
export default defineConfig({
  plugins: [react()],
  compilation: {
    presetEnv: false,
    minify: false,
    sourcemap: true,
  }
});
