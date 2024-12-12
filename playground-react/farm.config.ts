import { defineConfig } from '@farmfe/core';
import react from "@farmfe/plugin-react"
export default defineConfig({
  plugins: [react()],
  compilation: {
    presetEnv: false,
    minify: false,
    sourcemap: true,
    script:{
      decorators: {
        legacyDecorator: true,
        decoratorMetadata: true,
        decoratorVersion: '2021-12',
        includes: [],
        excludes: []
      },
    }
  }
});
