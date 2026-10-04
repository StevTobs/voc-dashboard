import { defineConfig } from 'vite';

// The database buffer (python3 -m buffer) listens on 127.0.0.1 only; proxy /api so the dashboard stays same-origin.
const buffer = { '/api': { target: `http://127.0.0.1:${process.env.BUFFER_PORT || 8765}`, changeOrigin: false } };
// `vite build --mode publish`: served by Caddy at /test/voc-dashboard/, data from the buffer behind the same prefix.
const PUBLISH_BASE = '/test/voc-dashboard/';

export default defineConfig(({ mode }) => {
  if (mode === 'publish') process.env.VITE_DATA_URL ||= `${PUBLISH_BASE}api/complaints.csv`;
  // `vite --mode buffer` (npm run dev:buffer): local dev server reading the buffer through the /api proxy.
  if (mode === 'buffer') process.env.VITE_DATA_URL ||= '/api/complaints.csv';
  return {
    base: mode === 'publish' ? PUBLISH_BASE : '/',
    server: { proxy: buffer },
    preview: { proxy: buffer },
  };
});
