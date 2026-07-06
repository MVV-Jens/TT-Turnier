import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' makes the built app work when opened directly from the file system
// (double-click index.html in dist/) as well as from a local static server.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: true,
  },
});
