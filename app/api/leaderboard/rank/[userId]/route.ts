import { NextRequest, NextResponse } from 'next/server';
import { LeaderboardEntry } from '@/lib/leaderboard';

// Environment variables
const R2_BUCKET_URL = process.env.R2_BUCKET_URL;

// Leaderboard file name in R2
const LEADERBOARD_FILE = 'leaderboard.json';

// Fetch leaderboard data from R2
async function fetchFromR2(): Promise<LeaderboardEntry[]> {
  try {
    if (!R2_BUCKET_URL) {
      throw new Error('R2 bucket URL not configured');
    }
    
    const response = await fetch(`${R2_BUCKET_URL}/${LEADERBOARD_FILE}`);
    
    if (response.status === 404) {
      // If file doesn't exist yet, return empty array
      return [];
    }
    
    if (!response.ok) {
      throw new Error(`R2 read failed: ${response.status}`);
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to fetch from R2:', error);
    // Return empty array as fallback
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Get leaderboard from R2
    const leaderboard = await fetchFromR2();
    
    // Sort by score (high to low)
    const sortedLeaderboard = leaderboard.sort((a, b) => b.doodleScore - a.doodleScore);
    
    // Update ranks
    sortedLeaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    // Find user's rank
    const userIndex = sortedLeaderboard.findIndex(entry => entry.userId === userId);
    
    if (userIndex === -1) {
      return NextResponse.json({
        success: true,
        rank: 0,
        surroundingEntries: sortedLeaderboard.slice(0, 3) // Return top 3
      });
    }
    
    const userRank = userIndex + 1;
    
    // Get surrounding entries
    let startIndex = Math.max(0, userIndex - 1); // Previous rank
    let endIndex = Math.min(sortedLeaderboard.length - 1, userIndex + 1); // Next rank
    
    // If user's rank is low, ensure top 3 are included
    if (userRank > 3) {
      const surroundingEntries = [
        ...sortedLeaderboard.slice(0, 3), // Top 3
        ...sortedLeaderboard.slice(startIndex, endIndex + 1) // User and adjacent ranks
      ];
      
      // Remove duplicates
      const uniqueEntries = Array.from(new Map(surroundingEntries.map(entry => [entry.userId, entry])).values());
      
      return NextResponse.json({
        success: true,
        rank: userRank,
        surroundingEntries: uniqueEntries
      });
    } else {
      // If user is already in top 3, return top 5
      return NextResponse.json({
        success: true,
        rank: userRank,
        surroundingEntries: sortedLeaderboard.slice(0, 5)
      });
    }
  } catch (error) {
    console.error('Failed to get user rank:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user rank' },
      { status: 500 }
    );
  }
} 