import { NextRequest, NextResponse } from 'next/server';
import { LeaderboardEntry } from '@/lib/leaderboard';

// Environment variables
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY;
const R2_SECRET_KEY = process.env.R2_SECRET_KEY;
const R2_BUCKET_URL = process.env.R2_BUCKET_URL;
const AUTH_KEY_SECRET = process.env.AUTH_KEY_SECRET;

// Leaderboard file name in R2
const LEADERBOARD_FILE = 'leaderboard.json';

// Authorize request
function authorizeRequest(request: NextRequest): boolean {
  // For write operations, check for valid auth header
  if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
    return request.headers.get('X-Custom-Auth-Key') === AUTH_KEY_SECRET;
  }
  
  // Read operations are publicly accessible
  return true;
}

// Get leaderboard data
export async function GET(request: NextRequest) {
  try {
    // Get leaderboard data from R2
    const leaderboardData = await fetchFromR2();
    
    // Sort by score (high to low)
    const sortedLeaderboard = leaderboardData.sort((a, b) => b.doodleScore - a.doodleScore);
    
    // Update ranks
    sortedLeaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    return NextResponse.json({ 
      success: true,
      entries: sortedLeaderboard
    });
  } catch (error) {
    console.error('Failed to get leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get leaderboard' },
      { status: 500 }
    );
  }
}

// Submit new score
export async function POST(request: NextRequest) {
  try {
    // Authorize request
    if (!authorizeRequest(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const entry = await request.json();
    
    // Validate request data
    if (!entry.userId || !entry.username || typeof entry.doodleScore !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Invalid data' },
        { status: 400 }
      );
    }
    
    // Write to R2
    const result = await writeToR2(entry);
    
    // Return result
    return NextResponse.json({
      success: true,
      newRecord: result.newRecord,
      rank: result.rank
    });
  } catch (error) {
    console.error('Failed to submit score:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit score' },
      { status: 500 }
    );
  }
}

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

// Write entry to R2
async function writeToR2(entry: Omit<LeaderboardEntry, 'rank'>): Promise<{ newRecord: boolean; rank: number }> {
  try {
    if (!R2_BUCKET_URL || !R2_ACCESS_KEY || !R2_SECRET_KEY) {
      throw new Error('R2 configuration incomplete');
    }
    
    // 1. Read existing leaderboard
    const leaderboard = await fetchFromR2();
    
    // 2. Check if this is a new record for the user
    const existingEntry = leaderboard.find(item => item.userId === entry.userId);
    let newRecord = false;
    
    if (!existingEntry || entry.doodleScore > existingEntry.doodleScore) {
      newRecord = true;
      
      // 3. Update or add the entry
      if (existingEntry) {
        // Update existing entry
        Object.assign(existingEntry, {
          ...entry,
          timestamp: Date.now()
        });
      } else {
        // Add new entry
        leaderboard.push({
          ...entry,
          timestamp: Date.now()
        });
      }
      
      // 4. Sort and update ranks
      leaderboard.sort((a, b) => b.doodleScore - a.doodleScore);
      leaderboard.forEach((item, index) => {
        item.rank = index + 1;
      });
      
      // 5. Write back to R2
      const putResponse = await fetch(`${R2_BUCKET_URL}/${LEADERBOARD_FILE}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Auth-Key': AUTH_KEY_SECRET || ''
        },
        body: JSON.stringify(leaderboard)
      });
      
      if (!putResponse.ok) {
        throw new Error(`R2 write failed: ${putResponse.status}`);
      }
    }
    
    // 6. Calculate rank
    const sortedLeaderboard = [...leaderboard].sort((a, b) => b.doodleScore - a.doodleScore);
    const rank = sortedLeaderboard.findIndex(item => item.userId === entry.userId) + 1;
    
    return { newRecord, rank };
  } catch (error) {
    console.error('Failed to write to R2:', error);
    return { newRecord: false, rank: 0 };
  }
} 