import { createClient } from '@supabase/supabase-js'

// 设置环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 检查是否提供了必要的环境变量
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
}

// 创建Supabase客户端
const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  auth: {
    persistSession: false, // 服务器端不需要持久化会话
  },
})

export default supabase 