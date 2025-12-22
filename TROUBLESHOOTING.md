# Vite + Supabase 环境变量配置问题排查记录

## 问题现象

部署到 Zeabur 后，系统始终显示"离线模式"，无法连接 Supabase 云端数据库。

---

## 根本原因

### 1. 环境变量注入方式错误

**错误做法：使用 `define` 手动注入**

```typescript
// ❌ vite.config.ts - 错误写法
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY)
      },
    };
});
```

**问题：**
- `process.env` 是 Node.js 服务端的对象，浏览器中不存在
- `define` 方式需要手动处理，容易遗漏或出错
- 部署平台的环境变量可能无法正确注入

**正确做法：使用 `envPrefix` 自动注入**

```typescript
// ✅ vite.config.ts - 正确写法
export default defineConfig({
  envPrefix: ['SUPABASE_', 'GEMINI_'],
});
```

---

### 2. 环境变量读取方式错误

**错误做法：使用 `process.env`**

```typescript
// ❌ supabaseClient.ts - 错误写法
const supabaseUrl = process.env.SUPABASE_URL;
```

**正确做法：使用 `import.meta.env`**

```typescript
// ✅ supabaseClient.ts - 正确写法
const supabaseUrl = import.meta.env.SUPABASE_URL;
```

---

### 3. 环境变量命名混乱

曾尝试使用 `VITE_` 前缀：

```bash
# 尝试过的命名
VITE_SUPABASE_URL=xxx
VITE_SUPABASE_ANON_KEY=xxx
```

但代码中读取的是不带前缀的变量名，导致不匹配。

**最终方案：**
- 使用 `envPrefix: ['SUPABASE_', 'GEMINI_']` 允许这些前缀
- 环境变量直接命名为 `SUPABASE_URL`、`SUPABASE_ANON_KEY`
- 代码中使用 `import.meta.env.SUPABASE_URL` 读取

---

### 4. UI 层缺少模式判断逻辑

即使后端配置正确，UI 层也硬编码了"离线模式"文字：

```tsx
// ❌ 硬编码离线提示
<p>系统处于<b>离线模式</b>。账号数据保存在当前设备浏览器中。</p>
```

**正确做法：根据配置状态动态显示**

```tsx
// ✅ 动态判断显示
import { isSupabaseConfigured } from '../services/supabaseClient';

{isSupabaseConfigured ? (
  <p>系统处于<b>云端模式</b>。数据安全存储在云端服务器。</p>
) : (
  <p>系统处于<b>离线模式</b>。账号数据保存在当前设备浏览器中。</p>
)}
```

---

## 修复步骤总结

### Step 1: 修改 vite.config.ts

```typescript
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  // 关键：使用 envPrefix 自动注入环境变量
  envPrefix: ['SUPABASE_', 'GEMINI_'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
```

### Step 2: 修改 supabaseClient.ts

```typescript
import { createClient } from '@supabase/supabase-js';

// 使用 import.meta.env 读取环境变量
const supabaseUrl = import.meta.env.SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY || '';

// 导出配置状态供 UI 层判断
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Step 3: 修改 UI 组件

在 `AuthViews.tsx`、`AdminDashboard.tsx` 等组件中：

```tsx
import { isSupabaseConfigured } from '../services/supabaseClient';

// 根据 isSupabaseConfigured 动态显示云端/离线模式提示
```

### Step 4: 配置部署平台环境变量

在 Zeabur 中设置（不需要 VITE_ 前缀）：

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
GEMINI_API_KEY=AIzaSyxxx...
```

---

## 工作流程图

```
┌─────────────────────────────────────────────────────────┐
│                    构建时 (Zeabur)                       │
├─────────────────────────────────────────────────────────┤
│  1. Zeabur 设置系统环境变量：                             │
│     SUPABASE_URL=https://xxx.supabase.co                │
│     SUPABASE_ANON_KEY=eyJ...                            │
│                                                         │
│  2. Vite 读取环境变量（因为 envPrefix 包含 'SUPABASE_'）  │
│                                                         │
│  3. Vite 将变量注入到 import.meta.env                    │
│                                                         │
│  4. 构建产物中，代码被替换为：                            │
│     import.meta.env.SUPABASE_URL                        │
│     → "https://xxx.supabase.co"                         │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    运行时 (浏览器)                        │
├─────────────────────────────────────────────────────────┤
│  import.meta.env.SUPABASE_URL                           │
│  → "https://xxx.supabase.co" ✅                         │
│                                                         │
│  isSupabaseConfigured = true                            │
│  → 显示"云端模式" ✅                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 关键要点

| 项目 | 错误做法 | 正确做法 |
|------|---------|---------|
| Vite 配置 | 使用 `define` 手动注入 | 使用 `envPrefix` 自动注入 |
| 读取变量 | `process.env.XXX` | `import.meta.env.XXX` |
| 变量命名 | 混用 `VITE_` 前缀 | 统一使用 `SUPABASE_` 前缀 |
| UI 显示 | 硬编码"离线模式" | 根据 `isSupabaseConfigured` 动态判断 |

---

## 参考链接

- [Vite 环境变量和模式](https://cn.vitejs.dev/guide/env-and-mode.html)
- [Supabase JavaScript 客户端](https://supabase.com/docs/reference/javascript/introduction)
