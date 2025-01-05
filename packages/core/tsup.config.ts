import type { Options } from 'tsup'

export const tsup: Options = {
  entry: [
    'index.ts',
  ],
  format: 'esm',
  dts: true,
  splitting: false,
  clean: true,
  shims: false,
  "target":"es2015",
  external: [
    '!^(\\./|\\.\\./|[A-Za-z]:\\\\|/|^@/).*',
    "alien-signals",
    "alien-deepsignals",
    "mitt",
  ],
}
