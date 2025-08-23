import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname, 'src/playground'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react-creative-text': 'react-creative-text',
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react-creative-text'],
  },
  build: {
    outDir: path.resolve(__dirname, '../../dist'),
    emptyOutDir: true,
    sourcemap: true,
    commonjsOptions: {
      include: [/react-creative-text/, /node_modules/],
    },
  },
});