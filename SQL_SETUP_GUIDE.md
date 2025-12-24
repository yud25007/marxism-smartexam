# Supabase 数据库配置指南

为了使“公告系统”和“邀请人功能”正常工作，请按照以下步骤在 Supabase 后台执行 SQL。

## 第一步：执行基础结构 SQL
请在 Supabase 的 **SQL Editor** 中粘贴并运行以下代码：

```sql
-- 创建公告表
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'warning', 'important')) DEFAULT 'info',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 为用户表增加邀请人字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by TEXT;
```

## 第二步：配置安全策略 (RLS)
为了确保前端可以正常读取数据，请执行以下权限设置：

```sql
-- 开启公告表的行级安全
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- 允许所有人查看公告
DROP POLICY IF EXISTS "Allow public read" ON announcements;
CREATE POLICY "Allow public read" ON announcements FOR SELECT USING (true);

-- 允许所有操作（简单模式）
-- 在生产环境中，建议根据 role='ADMIN' 进行更严格的限制
DROP POLICY IF EXISTS "Allow all access" ON announcements;
CREATE POLICY "Allow all access" ON announcements FOR ALL USING (true);
```

## 常见问题排查
1. **报错：column "invited_by" already exists**
   - 说明您之前已经成功执行过该命令，可以忽略，不影响使用。
2. **公告发了但不显示**
   - 请检查 `announcements` 表的 RLS 是否已关闭，或者是否已添加 `Allow public read` 策略。
3. **后台保存公告失败**
   - 请确保您的 Supabase 账号有权限操作该表，或者直接关闭该表的 RLS（不推荐）。
