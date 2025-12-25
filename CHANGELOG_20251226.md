# CHANGELOG - 2025-12-26

## 性能优化
- **构建优化**：在 `vite.config.ts` 中引入 `vite-plugin-compression`，启用 Gzip 压缩，减少传输体积。
- **分包策略**：实施 Rollup `manualChunks` 策略，将重型库（KaTeX, Recharts, Gemini SDK）拆分为独立 Vendor 包，优化浏览器并行下载。
- **资源清理**：移除 `index.html` 中冗余的 `importmap`，统一由 Vite 管理依赖。
- **静态资源优化**：将 KaTeX CSS 移至 CDN 加载，减少 JS Bundle 体积并利用浏览器缓存。
- **首屏渲染优化**：移除 `App.tsx` 中的同步 CSS 导入，防止阻塞关键渲染路径。
