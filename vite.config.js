import { defineConfig } from 'vite';

// The database buffer (python3 -m buffer) listens on 127.0.0.1 only; proxy /api so the dashboard stays same-origin.
const buffer = { '/api': { target: `http://127.0.0.1:${process.env.BUFFER_PORT || 8765}`, changeOrigin: false } };

export default defineConfig({
  server: { proxy: buffer },
  preview: { proxy: buffer },
});
