import { defineConfig } from '@farmfe/core';

export default defineConfig({
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
