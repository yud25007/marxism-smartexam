import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
  plugins: [react()],
  // 允许所有环境变量（不限制 VITE_ 前缀）
  envPrefix: ['VITE_', 'SUPABASE_', 'GEMINI_'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
