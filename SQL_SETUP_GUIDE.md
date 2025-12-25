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

## 6. 动态题库系统 (Dynamic Question Bank)
支持题目迁移至云端、管理员在线修改答案及动态管理。

```sql
-- A. 创建试卷表 (Exams)
CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration_minutes INTEGER DEFAULT 60,
  difficulty TEXT,
  cover_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- B. 创建题目表 (Questions)
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  exam_id TEXT REFERENCES exams(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- SINGLE_CHOICE, MULTIPLE_CHOICE, etc.
  text TEXT NOT NULL,
  options JSONB, -- 存储选项数组 ["A", "B", "C"]
  correct_answers JSONB, -- 存储正确答案索引 [0] 或 [0, 1]
  points INTEGER DEFAULT 2,
  answer_text TEXT, -- 简答题答案
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- C. 权限配置 (RLS) - 已优化以支持自定义登录系统
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取题目
DROP POLICY IF EXISTS "Exams Public Read" ON exams;
CREATE POLICY "Exams Public Read" ON exams FOR SELECT USING (true);
DROP POLICY IF EXISTS "Questions Public Read" ON questions;
CREATE POLICY "Questions Public Read" ON questions FOR SELECT USING (true);

-- 允许所有人写入 (由于使用自定义 Auth，需放开此权限以支持同步)
DROP POLICY IF EXISTS "Enable All Access" ON exams;
CREATE POLICY "Enable All Access" ON exams FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Enable All Access" ON questions;
CREATE POLICY "Enable All Access" ON questions FOR ALL USING (true) WITH CHECK (true);

-- D. 系统开关表 (System Settings)
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value BOOLEAN DEFAULT FALSE,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 初始化开关
INSERT INTO system_settings (key, value, description)
VALUES 
  ('maintenance_mode', FALSE, '系统维护模式'),
  ('allow_sync', TRUE, '允许云端同步操作'),
  ('public_registration', TRUE, '允许用户自主注册')
ON CONFLICT (key) DO NOTHING;
```

## 7. 说明事项
1. **VIP 权限**：`VIP` 角色拥有全章节解锁权限，AI 解析默认使用 Qwen 模型。
2. **字段映射**：代码中的 `aiModel` 对应数据库的 `ai_model`。
3. **动态题库**：首次部署后，需在管理员后台点击“同步本地题库”将静态数据存入数据库。
4. **图片上传**：管理员后台的图片上传功能依赖于 `announcements` 存储桶的正确配置。

---
**文档版本**：2025-12-25 (v2)
**状态**：已整合动态题库与云端同步支持
