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
    },
    db: {
      schema: 'public'
    }
  })
}

// 获取排行榜数据
export const getLeaderboard = async () => {
  const supabase = createSupabaseClient()
  
  try {
    // 获取分数降序排序的前50条记录
    // 注意：我们仍使用数据库排序，但需意识到这是字符串排序而非数字排序
    const { data, error } = await supabase
      .from('users')
      .select('id, name, username, profile_image, doodle_score')
      .order('doodle_score', { ascending: false })
      .limit(50)
      
    if (error) {
      console.error('获取排行榜失败:', error)
      return []
    }
    
    // 由于数据库中按字符串排序可能不准确，我们在前端进行数字排序
    // 在Leaderboard组件中完成此步骤
    
    return data || []
  } catch (e) {
    console.error('获取排行榜过程中发生错误:', e);
    return []
  }
}

// 添加详细的类型定义和数据库表结构
export interface UserRecord {
  id: string;
  name: string;
  username: string;
  profile_image: string;
  doodle_score: string;
}

export interface ScoreSubmitResult {
  success: boolean;
  isNewRecord: boolean;
  previousScore?: number;
  error?: string;
}

// Submit user score
export const submitScore = async (userData: { 
  id: string, 
  name: string, 
  username?: string,
  profile_image: string, 
  score: number 
}): Promise<ScoreSubmitResult> => {
  try {
    console.log('Submitting score:', userData);
    const supabase = createSupabaseClient()
    
    // First check if the user already exists and get their current score - using standard query format
    const { data: existingUser, error: queryError } = await supabase
      .from('users')
      .select('doodle_score')
      .eq('id', userData.id)
      .maybeSingle()
    
    if (queryError) {
      console.error('Failed to query user score:', queryError);
      return {
        success: false,
        isNewRecord: false,
        error: queryError.message
      }
    }
    
    console.log(existingUser ? 
      `Found existing user record, current score: ${existingUser.doodle_score}` : 
      'User is new, proceeding to create record'
    );
    
    // Prepare user record - without any timestamp fields
    const userRecord: UserRecord = {
      id: userData.id,
      name: userData.name,
      username: userData.username || userData.name, // Ensure username field has a value
      profile_image: userData.profile_image,
      doodle_score: userData.score.toString(), // Convert to string
    };
    
    // If user doesn't exist or new score is higher, update the record
    const existingScore = existingUser ? parseInt(existingUser.doodle_score || '0', 10) : 0;
    if (!existingUser || userData.score > existingScore) {
      console.log('Submitting new record to database:', userRecord);
      
      try {
        let data;
        let error;
        
        if (!existingUser) {
          // User doesn't exist, perform insert operation
          console.log('User does not exist, performing insert operation');
          const response = await supabase
            .from('users')
            .insert([userRecord])
            .select();
          
          data = response.data;
          error = response.error;
        } else {
          // User exists, perform update operation
          console.log('User exists, performing update operation');
          const response = await supabase
            .from('users')
            .update(userRecord)
            .eq('id', userData.id)
            .select();
          
          data = response.data;
          error = response.error;
        }
        
        if (error) throw error;
        
        console.log('New record submitted successfully!', data);
        return {
          success: true,
          isNewRecord: true,
          previousScore: existingScore
        }
      } catch (error) {
        console.error('Failed to submit score:', error);
        return {
          success: false,
          isNewRecord: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
    
    console.log('Score did not exceed existing record, not updating database');
    return {
      success: true,
      isNewRecord: false,
      previousScore: existingScore
    }
  } catch (e) {
    console.error('Error during score submission process:', e);
    return {
      success: false,
      isNewRecord: false,
      error: e instanceof Error ? e.message : 'Unknown error'
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
    
    // 由于数据库中的doodle_score是字符串，我们需要在JavaScript中进行数字排序
    const sortedScores = [...scores].sort((a, b) => 
      parseInt(b.doodle_score || '0', 10) - parseInt(a.doodle_score || '0', 10)
    );
    
    // 找到用户的排名
    const userIndex = sortedScores.findIndex(user => user.id === userId)
    
    if (userIndex === -1) return null
    
    // 返回用户排名和相邻的用户
    return {
      rank: userIndex + 1,
      total: sortedScores.length,
      // 获取前一名
      previous: userIndex > 0 ? userIndex - 1 : null,
      // 获取后一名
      next: userIndex < sortedScores.length - 1 ? userIndex + 1 : null
    }
  } catch (e) {
    console.error('获取用户排名时发生错误:', e);
    return null;
  }
} 