import type { Options } from 'tsup'

export const tsup: Options = {
  entry: [
    'index.tsx',
  ],
  format: 'esm',
  dts: true,
  splitting: true,
  clean: true,
  shims: false,
  external: [
    '!^(\\./|\\.\\./|[A-Za-z]:\\\\|/|^@/).*',
    'react',
    "react-dom",
    "alien-signals",
    "alien-deepsignals",
  ],
}
