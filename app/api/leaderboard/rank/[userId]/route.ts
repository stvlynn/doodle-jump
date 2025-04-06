import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

// 用于类型安全的路由参数接口
interface RouteParams {
  params: {
    userId: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId } = params;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // 使用Supabase查询排行榜数据
    const { data: leaderboard, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('doodleScore', { ascending: false });
    
    if (error) {
      throw new Error(`获取排行榜数据失败: ${error.message}`);
    }
    
    // 排序为空时处理
    const sortedLeaderboard = leaderboard || [];
    
    // 更新排名
    sortedLeaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    // 查找用户排名
    const userIndex = sortedLeaderboard.findIndex(entry => entry.TwitterID === userId);
    
    if (userIndex === -1) {
      return NextResponse.json({
        success: true,
        rank: 0,
        surroundingEntries: sortedLeaderboard.slice(0, 3) // 返回前3名
      });
    }
    
    const userRank = userIndex + 1;
    
    // 获取周围的条目
    let startIndex = Math.max(0, userIndex - 1); // 前一个排名
    let endIndex = Math.min(sortedLeaderboard.length - 1, userIndex + 1); // 后一个排名
    
    // 如果用户排名较低，确保包含前3名
    if (userRank > 3) {
      const surroundingEntries = [
        ...sortedLeaderboard.slice(0, 3), // 前3名
        ...sortedLeaderboard.slice(startIndex, endIndex + 1) // 用户和相邻排名
      ];
      
      // 移除重复项
      const uniqueEntries = Array.from(
        new Map(surroundingEntries.map(entry => [entry.TwitterID, entry])).values()
      );
      
      return NextResponse.json({
        success: true,
        rank: userRank,
        surroundingEntries: uniqueEntries
      });
    } else {
      // 如果用户已经在前3名，返回前5名
      return NextResponse.json({
        success: true,
        rank: userRank,
        surroundingEntries: sortedLeaderboard.slice(0, 5)
      });
    }
  } catch (error) {
    console.error('获取用户排名失败:', error);
    return NextResponse.json(
      { success: false, error: '获取用户排名失败' },
      { status: 500 }
    );
  }
} 