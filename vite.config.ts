import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // High-performance dev server optimization with conditional HMR
      hmr: process.env.DISABLE_HMR !== 'true',
      // Conditionally disable file watching when running under specialized optimization flags
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
