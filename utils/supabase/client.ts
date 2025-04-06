import { createClient } from '@supabase/supabase-js'

// 客户端环境变量必须以NEXT_PUBLIC_开头
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 检查是否提供了必要的环境变量
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase client environment variables')
}

// 创建客户端Supabase实例
export const supabaseClient = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true, // 客户端需要持久化会话
    autoRefreshToken: true,
  },
})

export default supabaseClient 