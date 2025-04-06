-- 创建排行榜表
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "TwitterID" TEXT NOT NULL,
  "TwitterName" TEXT NOT NULL,
  "TwitterAvatar" TEXT,
  "doodleScore" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_leaderboard_twitterid ON public.leaderboard ("TwitterID");
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON public.leaderboard ("doodleScore" DESC);

-- 设置行级安全策略
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- 允许匿名用户读取排行榜数据
CREATE POLICY "允许匿名用户查看排行榜" 
  ON public.leaderboard 
  FOR SELECT 
  TO anon 
  USING (true);

-- 只允许服务角色插入和更新数据
CREATE POLICY "只允许服务角色插入数据" 
  ON public.leaderboard 
  FOR INSERT 
  TO service_role 
  USING (true);

-- 创建示例仪器表（文档示例）
CREATE TABLE IF NOT EXISTS public.instruments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL
);

-- 插入一些示例数据
INSERT INTO public.instruments (name)
VALUES 
  ('violin'),
  ('viola'),
  ('cello'),
  ('bass'),
  ('piano')
ON CONFLICT DO NOTHING;

-- 设置行级安全策略
ALTER TABLE public.instruments ENABLE ROW LEVEL SECURITY;

-- 允许匿名用户读取仪器数据
CREATE POLICY "公开可读取仪器数据" 
  ON public.instruments 
  FOR SELECT 
  TO anon 
  USING (true); 