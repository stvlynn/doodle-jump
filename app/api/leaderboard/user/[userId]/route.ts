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
    
    // Find user entry
    const userEntry = leaderboard.find(entry => entry.userId === userId);
    
    if (!userEntry) {
      return NextResponse.json({
        success: true,
        highScore: 0
      });
    }
    
    return NextResponse.json({
      success: true,
      highScore: userEntry.doodleScore
    });
  } catch (error) {
    console.error('Failed to get user high score:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user high score' },
      { status: 500 }
    );
  }
} 