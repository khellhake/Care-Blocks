import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// BASE_PATH lets GitHub Pages serve the app from /<repo-name>/
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH || '/',
  build: {
    rollupOptions: { output: { manualChunks: { firebase: ['firebase/app', 'firebase/firestore'] } } },
  },
});
