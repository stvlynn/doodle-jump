import { TwitterUser } from './auth';

// Leaderboard user record type
export interface LeaderboardEntry {
  id: string;        // 数据库记录ID
  TwitterID: string;    // Twitter用户ID
  TwitterName: string;  // 用户名
  TwitterAvatar: string;  // 头像URL
  doodleScore: number;   // 游戏分数
  created_at: string;  // 创建时间
  rank?: number;     // 排名（前端计算）
}

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  userRank: number;
  isNewRecord: boolean;
}

// Leaderboard service configuration
const LEADERBOARD_API_URL = '/api/leaderboard';

// Get leaderboard data
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetch(`${LEADERBOARD_API_URL}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get leaderboard: ${response.status}`);
    }
    
    const data = await response.json();
    return data.entries || [];
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}

// Get leaderboard data for a specific user
export async function fetchLeaderboard(userId: string): Promise<LeaderboardResponse> {
  try {
    const response = await fetch(`/api/leaderboard?userId=${userId}`);
    if (!response.ok) {
      throw new Error('获取排行榜失败');
    }
    
    const data = await response.json();
    return {
      entries: data.entries,
      userRank: data.userRank || 0,
      isNewRecord: data.isNewRecord || false
    };
  } catch (error) {
    console.error('获取排行榜出错:', error);
    return {
      entries: [],
      userRank: 0,
      isNewRecord: false
    };
  }
}

// Submit new score
export async function submitScore(user: TwitterUser, score: number): Promise<{ success: boolean; isNewRecord: boolean; userRank: number }> {
  try {
    const response = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        username: user.name,
        profileImage: user.profile_image_url,
        score: score  // 修改为score字段
      }),
    });
    
    if (!response.ok) {
      throw new Error('提交分数失败');
    }
    
    const result = await response.json();
    return {
      success: true,
      isNewRecord: result.isNewRecord || false,
      userRank: result.userRank || 0
    };
  } catch (error) {
    console.error('提交分数出错:', error);
    return {
      success: false,
      isNewRecord: false,
      userRank: 0
    };
  }
}

// Get user's highest score
export async function getUserHighScore(userId: string): Promise<number> {
  try {
    const response = await fetch(`${LEADERBOARD_API_URL}/user/${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get user's highest score: ${response.status}`);
    }
    
    const data = await response.json();
    return data.highScore || 0;
  } catch (error) {
    console.error('Error getting user\'s highest score:', error);
    return 0;
  }
}

// Get user's current rank
export async function getUserRank(userId: string): Promise<{ rank: number; surroundingEntries: LeaderboardEntry[] }> {
  try {
    const response = await fetch(`${LEADERBOARD_API_URL}/rank/${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get user's rank: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      rank: data.rank || 0,
      surroundingEntries: data.surroundingEntries || []
    };
  } catch (error) {
    console.error('Error getting user\'s rank:', error);
    return {
      rank: 0,
      surroundingEntries: []
    };
  }
}

// Generate leaderboard view
export function generateLeaderboardView(entries: LeaderboardEntry[], userRank: number): LeaderboardEntry[] {
  // Rank each entry
  const rankedEntries = entries.map((entry, index) => ({
    ...entry,
    rank: index + 1
  }));
  
  // Get top three entries
  const topThree = rankedEntries.slice(0, 3);
  
  // If user is not in top three, add user and surrounding entries
  if (userRank > 3) {
    // Find user's position
    const userIndex = rankedEntries.findIndex(entry => entry.rank === userRank);
    
    if (userIndex !== -1) {
      // Get previous and next entries
      const prevEntry = userIndex > 0 ? rankedEntries[userIndex - 1] : null;
      const userEntry = rankedEntries[userIndex];
      const nextEntry = userIndex < rankedEntries.length - 1 ? rankedEntries[userIndex + 1] : null;
      
      // Build final leaderboard view
      return [
        ...topThree,
        { id: 'divider1', TwitterID: '', TwitterName: '...', TwitterAvatar: '', doodleScore: 0, created_at: '', rank: -1 },
        ...(prevEntry ? [prevEntry] : []),
        userEntry,
        ...(nextEntry ? [nextEntry] : []),
      ];
    }
  }
  
  return topThree;
} 