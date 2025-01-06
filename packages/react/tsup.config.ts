import type { Options } from 'tsup'

export const tsup: Options = {
  entry: ['index.ts'],
  format: 'esm',
  dts: true,
  clean: true,
  external: [
    '!^(\\./|\\.\\./|[A-Za-z]:\\\\|/|^@/).*',
    'react',
    "alien-signals",
    "alien-deepsignals",
  ],
}
