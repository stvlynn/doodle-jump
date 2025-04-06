import { createClient } from '@supabase/supabase-js'

// Supabase配置信息
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

// 检查是否提供了必要的环境变量
if (!supabaseUrl || !supabaseKey) {
  console.error('缺少Supabase配置环境变量')
}

// 创建Supabase客户端
const supabase = createClient(supabaseUrl || '', supabaseKey || '')

export default supabase 