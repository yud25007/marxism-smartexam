# 马原在线答题系统：数据库初始化与升级指南 (2025-12-25)

本指南包含系统核心功能（云端题库、公告系统、系统设置）所需的 SQL 脚本。请在 Supabase 的 **SQL Editor** 中运行。

---

## 1. 核心系统设置 (System Settings)
用于控制全局开关，如同步权限、注册开放等。

```sql
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value BOOLEAN DEFAULT FALSE,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 初始化系统开关
INSERT INTO system_settings (key, value, description)
VALUES 
  ('maintenance_mode', FALSE, '系统维护模式'),
  ('allow_sync', TRUE, '允许云端同步操作'),
  ('public_registration', TRUE, '允许用户自主注册')
ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description;
```

---

## 2. 云端题库系统 (Dynamic Question Bank)
支持题库动态迁移、管理员实时在线修改答案。

```sql
-- A. 试卷表
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

-- B. 题目表 (JSONB 存储选项与答案)
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  exam_id TEXT REFERENCES exams(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  text TEXT NOT NULL,
  options JSONB,
  correct_answers JSONB,
  points INTEGER DEFAULT 2,
  answer_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- C. 权限配置 (针对自定义登录系统优化的 RLS)
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 允许所有人全权操作 (支持后台同步与答案动态修改)
DROP POLICY IF EXISTS "Enable All Access" ON exams;
CREATE POLICY "Enable All Access" ON exams FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Enable All Access" ON questions;
CREATE POLICY "Enable All Access" ON questions FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Enable All Access" ON system_settings;
CREATE POLICY "Enable All Access" ON system_settings FOR ALL USING (true) WITH CHECK (true);
```

---

## 3. 增强通知系统 (Announcements)
支持 Markdown 渲染、图片上传及身份定向通知。

```sql
-- 更新公告表字段
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS target_group TEXT, -- 存储身份如 'VIP', 'ADMIN'
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_announcements_target_group ON announcements(target_group);

-- 存储桶 (Storage) 说明
-- 请在 Storage 页面手动创建 'announcements' Bucket，设为 Public。
```

---

## 4. 用户与 AI 权限
```sql
-- 支持 VIP 分组
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'VIP', 'MEMBER'));

-- AI 模型配置
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'gemini-2.5-pro';
```

---

## 5. 部署后关键操作
1. **运行 SQL**：依次执行上述所有脚本。
2. **开启同步**：在网页后台“系统控制中心”开启“允许云端同步”。
3. **同步数据**：在网页后台“题库管理”点击“同步本地题库到云端”。
4. **验证**：在“解析界面”或“题库管理”尝试修改答案，确认同步成功。

**文档版本**：v2.5 (2025-12-25)

**状态**：全面支持云端动态维护



---



## 补丁：2025-12-25 18:55 (修复题目数量显示)

用于解决首页章节显示为“0题”的问题。



```sql

-- 增加题目数量统计字段

ALTER TABLE exams ADD COLUMN IF NOT EXISTS question_count INTEGER DEFAULT 0;

```
