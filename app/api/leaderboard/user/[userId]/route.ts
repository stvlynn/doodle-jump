import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

// 第一个参数使用标准的Request类型
// 第二个参数我们不添加类型，让TypeScript自动推断
export async function GET(
  req: Request,
  { params }
) {
  try {
    const userId = params.userId;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
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
      return NextResponse.json({
        success: true,
        highScore: 0
      });
    }
    
    return NextResponse.json({
      success: true,
      highScore: data[0].doodleScore
    });
  } catch (error) {
    console.error('获取用户最高分失败:', error);
    return NextResponse.json(
      { success: false, error: '获取用户最高分失败' },
      { status: 500 }
    );
  }
} 