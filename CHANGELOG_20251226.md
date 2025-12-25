# CHANGELOG - 2025-12-26

## 性能优化
- **构建优化**：在 `vite.config.ts` 中引入 `vite-plugin-compression`，启用 Gzip 压缩，减少传输体积。
- **分包策略**：实施 Rollup `manualChunks` 策略，将重型库拆分为独立 Vendor 包，优化并行下载。
- **资源清理**：移除 `index.html` 中冗余的 `importmap`。
- **静态资源优化**：将 KaTeX CSS 移至 CDN 加载。

## 新功能
- **本地同步助手控制台 (Local Sync Console)**：
    - 升级 `sync_to_source.js` 为本地微服务模式。
    - 引入 `sync_config.json` 固化同步路径。
    - 管理员后台新增交互式面板，支持一键拉取云端数据、固化源码位置，彻底摆脱终端操作。

## 故障修复
- **代码规范**：修复 `authService.ts` 中重复定义 `verifyPassword` 方法导致的构建报错。