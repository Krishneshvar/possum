import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'node18',
    outDir: 'dist/electron',
    lib: {
      entry: 'electron/preload.ts',
      formats: ['cjs'],
    },
    rollupOptions: {
      external: ['electron', 'fs', 'path'],
      output: {
        entryFileNames: 'preload.js',
        format: 'cjs'
      }
    },
    emptyOutDir: false,
    minify: false
  }
});
