import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'node18',
    outDir: 'electron/dist',
    lib: {
      entry: 'electron/preload.js',
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
