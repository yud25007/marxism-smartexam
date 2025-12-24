# 马原在线答题系统：数据库初始化与升级指南

本指南包含系统所需的 SQL 脚本，请在 Supabase 的 **SQL Editor** 中运行以下语句。

---

## 1. 章节权限控制 (Permissions)
用于控制各章节题库的公开状态及最低访问角色。

```sql
-- 创建章节权限表
CREATE TABLE IF NOT EXISTS exam_permissions (
  exam_id TEXT PRIMARY KEY, -- 对应代码中的 chapter_id (如 chapter_8)
  is_public BOOLEAN DEFAULT FALSE, -- 是否对普通用户公开
  min_role TEXT DEFAULT 'ADMIN', -- 最低访问权限 (ADMIN 或 MEMBER)
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用行级安全（所有人可读）
ALTER TABLE exam_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "所有人可读权限配置" ON exam_permissions;
CREATE POLICY "所有人可读权限配置" ON exam_permissions FOR SELECT USING (true);

-- 初始化现有章节权限
-- 0-7 章设为公开，8-11 章默认仅限管理员
INSERT INTO exam_permissions (exam_id, is_public, min_role)
VALUES 
  ('chapter_0', TRUE, 'MEMBER'),
  ('chapter_1', TRUE, 'MEMBER'),
  ('chapter_2', TRUE, 'MEMBER'),
  ('chapter_3', TRUE, 'MEMBER'),
  ('chapter_4', TRUE, 'MEMBER'),
  ('chapter_5', TRUE, 'MEMBER'),
  ('chapter_6', TRUE, 'MEMBER'),
  ('chapter_7', TRUE, 'MEMBER'),
  ('chapter_8', FALSE, 'ADMIN'),
  ('chapter_9', FALSE, 'ADMIN'),
  ('chapter_10', FALSE, 'ADMIN'),
  ('chapter_11', FALSE, 'ADMIN')
ON CONFLICT (exam_id) DO UPDATE 
SET is_public = EXCLUDED.is_public, min_role = EXCLUDED.min_role;
```

---

## 2. 用户与 AI 配置升级 (Users & AI)
扩展用户角色并配置 AI 模型。

```sql
-- A. 扩展用户角色约束（支持 VIP 分组）
-- 如果更新角色提示失败，请运行此段代码
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('ADMIN', 'VIP', 'MEMBER'));

-- B. 为用户表增加 ai_model 字段
-- 默认模型设为 gemini-2.5-pro
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'gemini-2.5-pro';

-- C. 添加模型范围约束
ALTER TABLE users ADD CONSTRAINT valid_ai_model 
CHECK (ai_model IN ('gemini-3-pro-preview', 'gemini-2.5-pro', 'qwen3-coder-plus'));

-- D. 将现有管理员用户的模型升级为最高级
UPDATE users SET ai_model = 'gemini-3-pro-preview' WHERE role = 'ADMIN';
```

-- 3. 题目收藏功能 (Favorites)
-- ... (existing code)

---

## 4. 答题笔记功能 (Notes)
支持在答题记录中保存自定义笔记。

```sql
-- 为答题记录表增加笔记字段
ALTER TABLE exam_history ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
```

## 5. 说明事项
1. **VIP 权限**：`VIP` 角色拥有全章节解锁权限，AI 解析默认使用 Qwen 模型。
2. **字段映射**：代码中的 `aiModel` 对应数据库的 `ai_model`。
3. **模型标识**：确保数据库中的字符串与预设列表完全一致。

---
**文档版本**：2025-12-24 
**状态**：已整合 VIP 角色约束修复
