import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/postgres';

// 定义排行榜条目类型
interface LeaderboardEntry {
  id: string;
  TwitterID: string;
  TwitterName: string;
  TwitterAvatar: string;
  doodleScore: number;
  created_at: string;
  rank?: number;
}

// GET 获取排行榜数据
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    // 查询排行榜数据（按分数降序排列）
    const leaderboard = await sql<LeaderboardEntry[]>`
      SELECT 
        id, 
        "TwitterID", 
        "TwitterName", 
        "TwitterAvatar", 
        "doodleScore", 
        created_at
      FROM leaderboard
      ORDER BY "doodleScore" DESC
      LIMIT 100
    `;
    
    // 给每个条目添加排名
    const rankedEntries = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
    
    // 如果提供了用户ID，查找用户排名和是否新纪录
    let userRank = 0;
    let isNewRecord = false;
    
    if (userId) {
      // 找到用户在排行榜中的位置
      const userEntryIndex = rankedEntries.findIndex(
        entry => entry.TwitterID === userId
      );
      
      if (userEntryIndex !== -1) {
        userRank = userEntryIndex + 1;
      }
      
      // 查询用户是否创造了新纪录（最近一条记录是最高分）
      const userScores = await sql`
        SELECT "doodleScore", created_at
        FROM leaderboard
        WHERE "TwitterID" = ${userId}
        ORDER BY created_at DESC
        LIMIT 2
      `;
      
      // 如果用户只有一条记录，或最新记录分数高于前一条，则是新纪录
      if (
        userScores.length === 1 || 
        (userScores.length > 1 && userScores[0].doodleScore > userScores[1].doodleScore)
      ) {
        isNewRecord = true;
      }
    }
    
    return NextResponse.json({
      entries: rankedEntries,
      userRank,
      isNewRecord
    });
  } catch (error) {
    console.error('获取排行榜失败:', error);
    return NextResponse.json(
      { error: '获取排行榜数据失败' },
      { status: 500 }
    );
  }
}

// POST 提交新分数
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证必要字段
    if (!body.userId || !body.username || !body.score) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    // 获取用户当前最高分
    const userTopScore = await sql`
      SELECT "doodleScore"
      FROM leaderboard
      WHERE "TwitterID" = ${body.userId}
      ORDER BY "doodleScore" DESC
      LIMIT 1
    `;
    
    const currentScore = userTopScore.length > 0 ? userTopScore[0].doodleScore : 0;
    const isNewRecord = body.score > currentScore;
    
    // 插入新记录
    await sql`
      INSERT INTO leaderboard (
        "TwitterID", 
        "TwitterName", 
        "TwitterAvatar", 
        "doodleScore"
      ) VALUES (
        ${body.userId},
        ${body.username},
        ${body.profileImage},
        ${body.score}
      )
    `;
    
    // 获取用户排名
    const betterScores = await sql`
      SELECT COUNT(*) as count
      FROM leaderboard
      WHERE "doodleScore" > ${body.score}
    `;
    
    const userRank = betterScores[0].count + 1;
    
    return NextResponse.json({
      success: true,
      isNewRecord,
      userRank
    });
  } catch (error) {
    console.error('提交分数失败:', error);
    return NextResponse.json(
      { error: '提交分数失败' },
      { status: 500 }
    );
  }
} 