import { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/lib/supabase';

// Pages Router API路由处理程序，作为App Router的备用方案
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.query;
    
    if (!userId || Array.isArray(userId)) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    
    // 使用Supabase查询用户最高分
    const { data, error } = await supabase
      .from('leaderboard')
      .select('doodleScore')
      .eq('TwitterID', userId)
      .order('doodleScore', { ascending: false })
      .limit(1);
    
    if (error) {
      throw new Error(`查询用户最高分失败: ${error.message}`);
    }
    
    // 用户可能没有记录
    if (!data || data.length === 0) {
      return res.json({
        success: true,
        highScore: 0
      });
    }
    
    return res.json({
      success: true,
      highScore: data[0].doodleScore
    });
  } catch (error) {
    console.error('获取用户最高分失败:', error);
    return res.status(500).json({ 
      success: false, 
      error: '获取用户最高分失败' 
    });
  }
} 