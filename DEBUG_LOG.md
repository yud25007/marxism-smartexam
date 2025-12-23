# 马克思主义智能刷题系统 - 后端调试日志

## 项目信息
- **项目路径**: `E:\marxism-question-bank---smartexam (4)`
- **GitHub 仓库**: https://github.com/yud25007/marxism-smartexam
- **部署平台**: Zeabur
- **数据库**: Supabase

---

## 调试时间线

### 1. 初始化项目并推送到 GitHub

**操作**:
```bash
cd "E:/marxism-question-bank---smartexam (4)"
git init
git add .
git commit -m "Initial commit: 马克思主义智能刷题系统"
git remote add origin https://github.com/yud25007/marxism-smartexam.git
git push -u origin master --force
```

**结果**: 成功推送到 GitHub

---

### 2. 修复构建错误 - 缺少 react-is 依赖

**问题**:
```
error during build:
[vite]: Rollup failed to resolve import "react-is" from "/src/node_modules/recharts/es6/util/ReactUtils.js"
```

**解决方案**: 在 `package.json` 中添加 `react-is` 依赖

```json
"dependencies": {
  "react-is": "^19.2.3",
  // ...
}
```

**提交**:
```bash
git commit -m "fix: 添加 react-is 依赖修复构建错误"
git push
```

---

### 3. 修复图片显示问题 - 中文文件名编码

**问题**: 图片文件使用中文名（二维码.jpg、公众号.jpg），部署后无法显示

**解决方案**:
1. 将图片复制到 `public` 目录
2. 重命名为英文：`qrcode.jpg`、`wechat.jpg`
3. 更新代码中的图片路径

```bash
mv "public/二维码.jpg" "public/qrcode.jpg"
mv "public/公众号.jpg" "public/wechat.jpg"
sed -i 's|/公众号.jpg|/wechat.jpg|g' components/AuthViews.tsx components/ContactView.tsx
sed -i 's|/二维码.jpg|/qrcode.jpg|g' components/AuthViews.tsx components/ContactView.tsx
```

**提交**:
```bash
git commit -m "fix: 重命名图片为英文避免编码问题"
git push
```

---

### 4. 迁移到 Supabase 云端数据库

#### 4.1 添加 Supabase 依赖

**修改 `package.json`**:
```json
"dependencies": {
  "@supabase/supabase-js": "^2.47.0",
  // ...
}
```

#### 4.2 创建 Supabase 客户端配置

**创建 `services/supabaseClient.ts`**:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### 4.3 重写 authService.ts

将 localStorage 存储改为 Supabase 数据库操作，所有方法改为异步。

#### 4.4 重写 historyService.ts

将 localStorage 存储改为 Supabase 数据库操作，所有方法改为异步。

#### 4.5 更新组件使用异步方法

修改 `App.tsx`、`AdminDashboard.tsx`、`AuthViews.tsx`、`ChangePasswordView.tsx` 中的服务调用为异步。

**提交**:
```bash
git commit -m "feat: 迁移到 Supabase 云端数据库"
git push
```

---

### 5. 修复环境变量配置问题（核心问题）

#### 5.1 问题现象

部署后系统始终显示"离线模式"，无法连接 Supabase。

#### 5.2 问题分析

**错误 1: 使用 `define` 手动注入环境变量**

```typescript
// ❌ 错误的 vite.config.ts
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

**错误 2: 使用 `process.env` 读取环境变量**

```typescript
// ❌ 错误的 supabaseClient.ts
const supabaseUrl = process.env.SUPABASE_URL;
```

**错误 3: 环境变量命名混乱**

曾尝试使用 `VITE_SUPABASE_URL`，但代码中读取的是 `SUPABASE_URL`。

#### 5.3 解决方案

**修复 `vite.config.ts`** - 使用 `envPrefix` 自动注入:

```typescript
// ✅ 正确写法
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envPrefix: ['SUPABASE_', 'GEMINI_'],
});
```

**修复 `supabaseClient.ts`** - 使用 `import.meta.env`:

```typescript
// ✅ 正确写法
const supabaseUrl = import.meta.env.SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
```

**提交**:
```bash
git commit -m "fix: 使用 envPrefix 替代 define 注入环境变量"
git push
```

---

### 6. 复制完整的云端/离线模式切换逻辑

**问题**: UI 层硬编码了"离线模式"文字，没有根据 `isSupabaseConfigured` 动态判断。

**解决方案**: 从参考项目复制完整的服务和组件文件：

```bash
cp "E:/marxism-question-bank---smartexam (3)/services/supabaseClient.ts" "E:/marxism-question-bank---smartexam (4)/services/"
cp "E:/marxism-question-bank---smartexam (3)/services/authService.ts" "E:/marxism-question-bank---smartexam (4)/services/"
cp "E:/marxism-question-bank---smartexam (3)/services/historyService.ts" "E:/marxism-question-bank---smartexam (4)/services/"
cp "E:/marxism-question-bank---smartexam (3)/components/AdminDashboard.tsx" "E:/marxism-question-bank---smartexam (4)/components/"
cp "E:/marxism-question-bank---smartexam (3)/components/AuthViews.tsx" "E:/marxism-question-bank---smartexam (4)/components/"
cp "E:/marxism-question-bank---smartexam (3)/vite.config.ts" "E:/marxism-question-bank---smartexam (4)/"
```

**提交**:
```bash
git commit -m "fix: 从参考项目复制完整的云端/离线模式切换逻辑"
git push
```

**结果**: 系统成功显示"云端模式"

---

### 7. 添加注册成功后的付款信息显示

**需求**: 注册成功后显示二维码图片和付款提示文字

**修改 `AuthViews.tsx`**:

```tsx
// 注册成功后的显示
{!isAdminMode && success && (
  <div className="space-y-6">
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
      <p className="text-lg font-bold text-red-700 mb-2">感谢支持！目前价格 6元/账号！</p>
      <p className="text-gray-700 text-sm">请扫描下方二维码付款，并将<span className="font-bold">付款截图</span>发送至微信公众号后台。</p>
      <p className="text-gray-500 text-xs mt-1">如有问题，请微信公众号后台私信！</p>
    </div>
    <div className="space-y-4">
      <div className="flex flex-col items-center space-y-2">
        <img src="/wechat.jpg" alt="微信公众号" className="w-48 h-auto object-contain rounded" />
        <span>① 关注公众号发送截图</span>
      </div>
      <div className="flex flex-col items-center space-y-2">
        <img src="/qrcode.jpg" alt="付款码" className="w-48 h-auto object-contain rounded" />
        <span>② 扫码支付 6元</span>
      </div>
    </div>
    <Button onClick={onCancel}>返回首页</Button>
  </div>
)}
```

**提交**:
```bash
git commit -m "feat: 注册成功后显示付款二维码和公众号图片"
git push
```

---

### 8. 修复图片布局 - 上下排列完整显示

**问题**: 图片左右排列显示不全

**解决方案**:
```bash
# 改为上下排列
sed -i 's/grid grid-cols-2 gap-4/space-y-4/g' components/AuthViews.tsx

# 图片完整显示
sed -i 's/w-32 h-32 object-cover/w-48 h-auto object-contain/g' components/AuthViews.tsx
```

**提交**:
```bash
git commit -m "fix: 图片上下排列并显示完整"
git push
```

---

## 环境变量配置总结

### Zeabur 环境变量设置

```
SUPABASE_URL=https://gdxokmehgoijpyhqpyel.supabase.co
SUPABASE_ANON_KEY=sb_publishable_QOJbH7EtrUZuGgPGum532A_TpKYeor2
GEMINI_API_KEY=****
```

### Supabase 数据库表结构

```sql
-- 用户表
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'MEMBER',
  status TEXT DEFAULT 'PENDING',
  ai_enabled BOOLEAN DEFAULT false
);

-- 考试历史表
CREATE TABLE exam_history (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  exam_id TEXT NOT NULL,
  exam_title TEXT NOT NULL,
  score NUMERIC NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  time_spent INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  answers JSONB
);

-- 启用 RLS 并创建公开访问策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_users" ON users FOR ALL USING (true);
CREATE POLICY "public_history" ON exam_history FOR ALL USING (true);
```

---

## 关键问题总结

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 构建失败 | 缺少 react-is 依赖 | 添加 react-is 到 dependencies |
| 图片不显示 | 中文文件名编码问题 | 重命名为英文文件名 |
| 离线模式 | 环境变量注入方式错误 | 使用 `envPrefix` + `import.meta.env` |
| 离线模式 | UI 硬编码离线文字 | 根据 `isSupabaseConfigured` 动态判断 |
| 图片显示不全 | 左右排列空间不足 | 改为上下排列，使用 `object-contain` |

---

## Git 提交历史

```
b4c967b fix: 图片上下排列并显示完整
4d0ed24 feat: 注册成功后显示付款二维码和公众号图片
d78b226 fix: 从参考项目复制完整的云端/离线模式切换逻辑
c62103d fix: 使用 envPrefix 替代 define 注入环境变量
310e1a3 fix: 修复 Supabase 环境变量名添加 VITE_ 前缀
f8b6bb2 feat: 迁移到 Supabase 云端数据库
7fc8697 fix: 重命名图片为英文避免编码问题
a144129 fix: 替换外部图片为本地图片
8b1d478 fix: 添加 react-is 依赖修复构建错误
46539e3 Initial commit: 马克思主义智能刷题系统
```

---

## 文件变更清单

### 新增文件
- `services/supabaseClient.ts` - Supabase 客户端配置
- `public/wechat.jpg` - 公众号二维码
- `public/qrcode.jpg` - 付款二维码
- `.env.example` - 环境变量模板
- `TROUBLESHOOTING.md` - 问题排查文档

### 修改文件
- `package.json` - 添加 @supabase/supabase-js、react-is 依赖
- `vite.config.ts` - 使用 envPrefix 配置
- `services/authService.ts` - 改为 Supabase 异步操作
- `services/historyService.ts` - 改为 Supabase 异步操作
- `components/AuthViews.tsx` - 添加云端/离线模式判断、注册成功付款信息
- `components/AdminDashboard.tsx` - 添加云端/离线模式判断
- `components/ContactView.tsx` - 更新图片路径
- `App.tsx` - 更新异步方法调用
