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

## 2. 用户 AI 模型配置 (AI Models)
为指定用户分配指定的 AI 解析模型。

```sql
-- 为用户表增加 ai_model 字段
-- 默认模型设为 gemini-2.5-pro
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'gemini-2.5-pro';

-- 添加模型范围约束（可选，确保数据安全）
-- 如果约束已存在，请先删除旧约束再运行
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS valid_ai_model;
ALTER TABLE users ADD CONSTRAINT valid_ai_model 
CHECK (ai_model IN ('gemini-3-pro-preview', 'gemini-2.5-pro', 'qwen3-coder-plus'));

-- 将现有管理员用户的模型升级为最高级 (可选)
UPDATE users SET ai_model = 'gemini-3-pro-preview' WHERE role = 'ADMIN';
```

---

## 3. 说明事项
1. **字段映射**：代码中的 `aiModel` 会自动对应数据库中的 `ai_model` 字段。
2. **默认逻辑**：若数据库中 `ai_model` 为空，系统将自动回退到环境变量中配置的默认模型。
3. **模型列表**：支持的模型标识符必须严格遵守以下字符串：
   - `gemini-3-pro-preview`
   - `gemini-2.5-pro`
   - `qwen3-coder-plus`

---
**文档版本**：2025-12-24 
**状态**：已整合章节权限与 AI 模型控制逻辑
