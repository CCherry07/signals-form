import { defineConfig } from '@farmfe/core';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  vitePlugins: [vue()],
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
