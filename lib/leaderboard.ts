import { TwitterUser } from './auth';

// Leaderboard user record type
export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName: string;
  profileImage: string;
  doodleScore: number;
  rank?: number; // Rank, calculated by server
  timestamp: number; // Record creation time
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

// Submit new score
export async function submitScore(user: TwitterUser, score: number): Promise<{ success: boolean; newRecord: boolean; rank: number }> {
  try {
    const entry: Omit<LeaderboardEntry, 'rank'> = {
      userId: user.id,
      username: user.username || user.name,
      displayName: user.name,
      profileImage: user.profile_image_url,
      doodleScore: score,
      timestamp: Date.now()
    };
    
    const response = await fetch(`${LEADERBOARD_API_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(entry)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to submit score: ${response.status}`);
    }
    
    const result = await response.json();
    return {
      success: true,
      newRecord: result.newRecord || false,
      rank: result.rank || 0
    };
  } catch (error) {
    console.error('Error submitting score:', error);
    return {
      success: false,
      newRecord: false,
      rank: 0
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