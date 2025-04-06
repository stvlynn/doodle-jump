'use client'

import { createClient } from '@supabase/supabase-js'

// 创建Supabase客户端
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    },
    auth: {
      persistSession: false // 避免浏览器缓存问题
    }
  })
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

// 添加详细的类型定义和数据库表结构
export interface UserRecord {
  id: string;
  name: string;
  profile_image: string;
  doodle_score: number;
  updated_at?: string;
}

export interface ScoreSubmitResult {
  success: boolean;
  isNewRecord: boolean;
  previousScore?: number;
  error?: string;
}

// 提交用户分数
export const submitScore = async (userData: { 
  id: string, 
  name: string, 
  profile_image: string, 
  score: number 
}): Promise<ScoreSubmitResult> => {
  try {
    console.log('正在提交分数:', userData);
    const supabase = createSupabaseClient()
    
    // 首先检查用户是否已存在并获取其当前分数 - 使用更可靠的查询方式
    const { data: existingUser, error: queryError } = await supabase
      .from('users')
      .select('doodle_score')
      .eq('id', userData.id)
      .maybeSingle() // 使用maybeSingle而不是single，防止404错误
    
    if (queryError) {
      // 如果是非"未找到"错误，需要记录并返回
      console.error('查询用户分数失败:', queryError);
      return {
        success: false,
        isNewRecord: false,
        error: queryError.message
      }
    }
    
    console.log(existingUser ? 
      `找到现有用户记录，当前分数: ${existingUser.doodle_score}` : 
      '用户是新用户，继续创建记录'
    );
    
    // 准备用户记录
    const userRecord: UserRecord = {
      id: userData.id,
      name: userData.name,
      profile_image: userData.profile_image,
      doodle_score: userData.score,
      updated_at: new Date().toISOString()
    };
    
    // 如果用户不存在或新分数更高，则更新记录
    if (!existingUser || userData.score > (existingUser.doodle_score || 0)) {
      console.log('提交新纪录到数据库:', userRecord);
      
      // 使用upsert替代POST请求，确保幂等性并避免重复记录
      const { error: upsertError } = await supabase
        .from('users')
        .upsert(userRecord, {
          onConflict: 'id', // 指定冲突解决策略
          ignoreDuplicates: false // 允许更新现有记录
        })
        
      if (upsertError) {
        console.error('提交分数失败:', upsertError);
        return {
          success: false,
          isNewRecord: false,
          error: upsertError.message
        }
      }
      
      console.log('新纪录提交成功!');
      return {
        success: true,
        isNewRecord: true,
        previousScore: existingUser?.doodle_score || 0
      }
    }
    
    console.log('分数未超过现有记录，不更新数据库');
    return {
      success: true,
      isNewRecord: false,
      previousScore: existingUser?.doodle_score || 0
    }
  } catch (e) {
    console.error('提交分数过程中发生错误:', e);
    return {
      success: false,
      isNewRecord: false,
      error: e instanceof Error ? e.message : '未知错误'
    }
  }
}

// 获取用户在排行榜中的位置
export const getUserRank = async (userId: string) => {
  try {
    const supabase = createSupabaseClient()
    
    // 获取所有用户分数
    const { data: scores, error } = await supabase
      .from('users')
      .select('id, doodle_score')
      .order('doodle_score', { ascending: false })
    
    if (error || !scores) {
      console.error('获取排名失败:', error)
      return null
    }
    
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
  } catch (e) {
    console.error('获取用户排名时发生错误:', e);
    return null;
  }
} 