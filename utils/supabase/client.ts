'use client'

import { createClient } from '@supabase/supabase-js'

// 创建Supabase客户端
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  
  return createClient(supabaseUrl, supabaseKey)
}

// 获取排行榜数据
export const getLeaderboard = async () => {
  const supabase = createSupabaseClient()
  
  // 获取分数降序排序的前50条记录
  const { data, error } = await supabase
    .from('users')
    .select('id, name, profile_image, doodle_score')
    .order('doodle_score', { ascending: false })
    .limit(50)
    
  if (error) {
    console.error('获取排行榜失败:', error)
    return []
  }
  
  return data || []
}

// 提交用户分数
export const submitScore = async (userData: { 
  id: string, 
  name: string, 
  profile_image: string, 
  score: number 
}) => {
  const supabase = createSupabaseClient()
  
  // 首先检查用户是否已存在并获取其当前分数
  const { data: existingUser } = await supabase
    .from('users')
    .select('doodle_score')
    .eq('id', userData.id)
    .single()
  
  // 如果用户不存在或新分数更高，则更新记录
  if (!existingUser || userData.score > (existingUser.doodle_score || 0)) {
    const { error } = await supabase
      .from('users')
      .upsert({
        id: userData.id,
        name: userData.name,
        profile_image: userData.profile_image,
        doodle_score: userData.score,
        updated_at: new Date().toISOString()
      })
      
    if (error) {
      console.error('提交分数失败:', error)
      return {
        success: false,
        isNewRecord: false,
        error: error.message
      }
    }
    
    return {
      success: true,
      isNewRecord: true,
      previousScore: existingUser?.doodle_score || 0
    }
  }
  
  return {
    success: true,
    isNewRecord: false,
    previousScore: existingUser?.doodle_score || 0
  }
}

// 获取用户在排行榜中的位置
export const getUserRank = async (userId: string) => {
  const supabase = createSupabaseClient()
  
  // 获取所有用户分数
  const { data: scores } = await supabase
    .from('users')
    .select('id, doodle_score')
    .order('doodle_score', { ascending: false })
  
  if (!scores) return null
  
  // 找到用户的排名
  const userIndex = scores.findIndex(user => user.id === userId)
  
  if (userIndex === -1) return null
  
  // 返回用户排名和相邻的用户
  return {
    rank: userIndex + 1,
    total: scores.length,
    // 获取前一名
    previous: userIndex > 0 ? userIndex - 1 : null,
    // 获取后一名
    next: userIndex < scores.length - 1 ? userIndex + 1 : null
  }
} 