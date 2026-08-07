import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:5000';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@/app': path.join(sourceDir, 'app'),
        '@/shared': path.join(sourceDir, 'shared'),
        '@/features': path.join(sourceDir, 'features'),
      },
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      proxy: Object.fromEntries([
        '/google_login', '/logout', '/money_transfers', '/money_transfer_from_date',
        '/last_money_transfers', '/money_transfers_by_category', '/add_money',
        '/edit_money', '/remove_money', '/update_last_visited_wallet', '/chart_data',
      ].map((path) => [path, { target: backendUrl, changeOrigin: true }])),
    },
    preview: { host: '127.0.0.1', port: 4173, strictPort: true },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: { output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      } },
    },
  };
});
