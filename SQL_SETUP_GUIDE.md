-- 运行以下 SQL 语句来初始化章节权限控制
-- 位置：Supabase -> SQL Editor -> New Query

-- 1. 创建章节权限表
CREATE TABLE IF NOT EXISTS exam_permissions (
  exam_id TEXT PRIMARY KEY, -- 对应代码中的 chapter_id (如 chapter_8)
  is_public BOOLEAN DEFAULT FALSE, -- 是否对普通用户公开
  min_role TEXT DEFAULT 'ADMIN', -- 最低访问权限 (ADMIN 或 MEMBER)
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 启用行级安全（可选，根据您的 Supabase 设置）
ALTER TABLE exam_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "所有人可读权限配置" ON exam_permissions FOR SELECT USING (true);

-- 3. 为已有的 0-7 章初始化权限（设为公开）
INSERT INTO exam_permissions (exam_id, is_public, min_role)
VALUES 
  ('chapter_0', TRUE, 'MEMBER'),
  ('chapter_1', TRUE, 'MEMBER'),
  ('chapter_2', TRUE, 'MEMBER'),
  ('chapter_3', TRUE, 'MEMBER'),
  ('chapter_4', TRUE, 'MEMBER'),
  ('chapter_5', TRUE, 'MEMBER'),
  ('chapter_6', TRUE, 'MEMBER'),
  ('chapter_7', TRUE, 'MEMBER')
ON CONFLICT (exam_id) DO UPDATE 
SET is_public = EXCLUDED.is_public, min_role = EXCLUDED.min_role;

-- 4. 为新增的 8-11 章初始化权限（默认仅限管理员）
INSERT INTO exam_permissions (exam_id, is_public, min_role)
VALUES 
  ('chapter_8', FALSE, 'ADMIN'),
  ('chapter_9', FALSE, 'ADMIN'),
  ('chapter_10', FALSE, 'ADMIN'),
  ('chapter_11', FALSE, 'ADMIN')
ON CONFLICT (exam_id) DO UPDATE 
SET is_public = EXCLUDED.is_public, min_role = EXCLUDED.min_role;