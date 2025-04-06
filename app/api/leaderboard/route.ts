import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

// 接口定义
interface LeaderboardEntry {
  id: string;
  TwitterID: string;
  TwitterName: string;
  TwitterAvatar: string;
  doodleScore: number;
  created_at: string;
}

interface ScoreSubmission {
  userId: string;
  username: string;
  profileImage: string;
  score: number;
}

// GET 获取排行榜
export async function GET(request: NextRequest) {
  try {
    // 从URL获取用户ID
    const userId = request.nextUrl.searchParams.get('userId') || '';
    
    // 查询排行榜数据
    const { data: entries, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('doodleScore', { ascending: false })
      .limit(100);
    
    if (error) {
      throw new Error(`获取排行榜数据失败: ${error.message}`);
    }
    
    // 计算用户排名
    let userRank = 0;
    let isNewRecord = false;
    
    if (userId && entries) {
      // 查找用户记录
      const userEntryIndex = entries.findIndex((entry: LeaderboardEntry) => entry.TwitterID === userId);
      if (userEntryIndex !== -1) {
        userRank = userEntryIndex + 1;
        
        // 检查是否是新纪录（通常基于前端提供的信息）
        isNewRecord = request.nextUrl.searchParams.get('isNewRecord') === 'true';
      }
    }
    
    return NextResponse.json({
      entries: entries || [],
      userRank,
      isNewRecord
    });
    
  } catch (error) {
    console.error('排行榜API错误:', error);
    return NextResponse.json({ error: '获取排行榜失败' }, { status: 500 });
  }
}

// POST 提交新分数
export async function POST(request: NextRequest) {
  try {
    const body: ScoreSubmission = await request.json();
    
    // 验证必要字段
    if (!body.userId || !body.username || !body.score) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }
    
    // 查询当前用户最高分
    const { data: userScores, error: fetchError } = await supabase
      .from('leaderboard')
      .select('doodleScore')
      .eq('TwitterID', body.userId)
      .order('doodleScore', { ascending: false })
      .limit(1);
    
    if (fetchError) {
      throw new Error(`查询用户当前分数失败: ${fetchError.message}`);
    }
    
    const currentScore = userScores && userScores.length > 0 ? userScores[0].doodleScore : 0;
    
    // 只有新分数更高才更新记录
    const isNewRecord = body.score > currentScore;
    
    if (isNewRecord) {
      // 插入新记录
      const { error: insertError } = await supabase
        .from('leaderboard')
        .insert({
          TwitterID: body.userId,
          TwitterName: body.username,
          TwitterAvatar: body.profileImage,
          doodleScore: body.score
        });
      
      if (insertError) {
        throw new Error(`保存新分数失败: ${insertError.message}`);
      }
    }
    
    // 获取用户排名
    const { count: betterScoresCount, error: rankError } = await supabase
      .from('leaderboard')
      .select('*', { count: 'exact', head: true })
      .gt('doodleScore', isNewRecord ? body.score : currentScore);
    
    if (rankError) {
      throw new Error(`获取用户排名失败: ${rankError.message}`);
    }
    
    const userRank = (betterScoresCount || 0) + 1;
    
    return NextResponse.json({
      success: true,
      isNewRecord,
      userRank
    });
    
  } catch (error) {
    console.error('提交分数API错误:', error);
    return NextResponse.json({ error: '提交分数失败' }, { status: 500 });
  }
} 