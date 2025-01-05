import type { Options } from 'tsup'

export const tsup: Options = {
  entry: [
    'index.ts',
  ],
  format: 'esm',
  dts: true,
  splitting: true,
  clean: true,
  shims: false,
  external: ['!^(\\./|\\.\\./|[A-Za-z]:\\\\|/|^@/).*',
    'lodash.clonedeep',
    'lodash.set',
    'lodash.get',
    'alien-deepsignals'],
}
