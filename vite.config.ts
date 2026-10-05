import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { execSync } from 'child_process';

// 💡 Helper to get commit hash (Cloudflare Pages or local git fallback)
const getCommitHash = () => {
  if (process.env.CF_PAGES_COMMIT_SHA) {
    return process.env.CF_PAGES_COMMIT_SHA.slice(0, 7);
  }
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      open: true,
      filename: 'bundle-analysis.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  // 💡 Injects the commit hash into import.meta.env.VITE_COMMIT_HASH
  define: {
    'import.meta.env.VITE_COMMIT_HASH': JSON.stringify(getCommitHash()),
  },
  assetsInclude: ['**/*.md'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // 💡 Maps "@/*" directly to your "src" directory
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
