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

## 5. 增强通知系统 (Announcements)
支持 Markdown 渲染、图片上传以及基于身份角色的定向通知。

```sql
-- A. 更新公告表：增加图片地址、目标身份与激活状态
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS target_group TEXT, -- 存储角色名称 (如 'VIP', 'MEMBER')
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 确保现有记录的 is_active 状态正确
ALTER TABLE announcements ALTER COLUMN is_active SET DEFAULT TRUE;

-- 为身份查询增加索引
CREATE INDEX IF NOT EXISTS idx_announcements_target_group ON announcements(target_group);

-- B. 存储桶权限配置 (Supabase Storage)
-- 1. 请在 Supabase 控制台 Storage 页面手动创建一个名为 'announcements' 的 Bucket
-- 2. 将其设置为 "Public" (公共访问)
-- 3. 在 Policies 中为该 Bucket 分别添加 SELECT (所有人) 和 INSERT (管理员) 权限。
```

## 6. 说明事项
1. **VIP 权限**：`VIP` 角色拥有全章节解锁权限，AI 解析默认使用 Qwen 模型。
2. **字段映射**：代码中的 `aiModel` 对应数据库的 `ai_model`。
3. **模型标识**：确保数据库中的字符串与预设列表完全一致。
4. **图片上传**：管理员后台的图片上传功能依赖于 `announcements` 存储桶的正确配置。

---
**文档版本**：2025-12-25 
**状态**：已整合通知系统与分组字段更新
