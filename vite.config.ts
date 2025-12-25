import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/ai-api': {
        target: 'https://yudmini.zeabur.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ai-api/, '')
      }
    }
  },
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240, // Only compress files larger than 10KB
      deleteOriginFile: false
    })
  ],
  // 允许所有环境变量（不限制 VITE_ 前缀）
  envPrefix: ['VITE_', 'SUPABASE_', 'GEMINI_'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  build: {
    reportCompressedSize: false, // Speed up build
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'katex-vendor': ['katex', 'rehype-katex', 'remark-math'],
          'ui-vendor': ['lucide-react', 'recharts'],
          'markdown-vendor': ['react-markdown', 'rehype-raw', 'remark-gfm'],
          'genai-vendor': ['@google/genai']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
