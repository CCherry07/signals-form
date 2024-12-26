import { defineConfig } from '@farmfe/core';
import farmDtsPlugin from '@farmfe/js-plugin-dts';

const format = (process.env.FARM_FORMAT as 'esm' | 'cjs') || 'esm';
const ext = format === 'esm' ? 'mjs' : 'cjs';

export default defineConfig({
  compilation: {
    input: {
      index: './index.ts',
    },
    output: {
      path: `dist/${format}`,
      entryFilename: `[entryName].${ext}`,
      targetEnv: 'library',
      format,
      clean: false,
    },
    external: ['!^(\\./|\\.\\./|[A-Za-z]:\\\\|/|^@/).*'],
    partialBundling: {
      enforceResources: [
        {
          name: 'index',
          test: ['.+'],
        },
      ],
    },
    minify: false,
    sourcemap: false,
    presetEnv: false,
    lazyCompilation: false,
    persistentCache: true,
    externalNodeBuiltins: false,
  },
  plugins: [farmDtsPlugin()],
});
