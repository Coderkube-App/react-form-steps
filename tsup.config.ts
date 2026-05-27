import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    minify: true,
    external: [
      'react',
      'react-dom',
      'react-hook-form',
      '@hookform/resolvers',
      '@hookform/resolvers/zod',
      'zod',
    ],
  },
  {
    entry: {
      'index.native': 'src/index.native.ts',
    },
    format: ['esm'],
    outExtension() {
      return {
        js: '.js',
      };
    },
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: false,
    minify: true,
    external: [
      'react',
      'react-native',
      'react-hook-form',
      '@hookform/resolvers',
      '@hookform/resolvers/zod',
      'zod',
    ],
  },
  {
    entry: ['src/cli.ts'],
    format: ['cjs'],
    dts: false,
    splitting: false,
    sourcemap: false,
    clean: false,
    minify: false,
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);
