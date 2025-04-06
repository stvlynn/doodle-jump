'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { LeaderboardEntry, getLeaderboard, getUserRank } from '@/lib/leaderboard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Leaderboard item component
const LeaderboardItem = ({ 
  entry, 
  isCurrentUser = false 
}: { 
  entry: LeaderboardEntry; 
  isCurrentUser?: boolean;
}) => {
  const handleUserClick = () => {
    // Navigate to user's X profile
    window.open(`https://x.com/${entry.username}`, '_blank');
  };
  
  return (
    <div 
      className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${
        isCurrentUser ? 'bg-green-100 dark:bg-green-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-800/30'
      }`}
      onClick={handleUserClick}
    >
      <div className="w-8 text-center font-bold">{entry.rank}</div>
      <div className="w-10 h-10 rounded-full overflow-hidden mx-2">
        <img 
          src={entry.profileImage} 
          alt={entry.displayName} 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1">
        <div className="font-medium">{entry.displayName}</div>
        <div className="text-sm text-gray-500">@{entry.username}</div>
      </div>
      <div className="font-bold text-right" style={{ fontFamily: 'DOTMATRIX, monospace' }}>
        {entry.doodleScore.toLocaleString()}
      </div>
    </div>
  );
};

// Confetti effect component
const Confetti = ({ duration = 1000 }) => {
  const [active, setActive] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setActive(false);
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration]);
  
  if (!active) return null;
  
  return (
    <div className="confetti-container">
      {Array.from({ length: 50 }).map((_, i) => (
        <div 
          key={i} 
          className="confetti" 
          style={{
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 10 + 5}px`,
            height: `${Math.random() * 10 + 5}px`,
            backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
            animationDuration: `${Math.random() * 3 + 2}s`,
            animationDelay: `${Math.random() * 0.5}s`
          }}
        />
      ))}
    </div>
  );
};

interface LeaderboardProps {
  score: number;
  open: boolean;
  onClose: () => void;
  isNewRecord?: boolean;
}

export default function Leaderboard({ 
  score, 
  open, 
  onClose, 
  isNewRecord = false 
}: LeaderboardProps) {
  const { user, isAuthenticated } = useAuth();
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Fetch leaderboard data
  useEffect(() => {
    if (!open) return;
    
    const fetchLeaderboard = async () => {
      setLoading(true);
      
      try {
        // Get leaderboard data
        if (isAuthenticated && user) {
          // If user is logged in, get user's rank and surrounding entries
          const rankData = await getUserRank(user.id);
          setLeaderboardEntries(rankData.surroundingEntries);
          setUserRank(rankData.rank);
        } else {
          // If user is not logged in, only get top 5 leaderboard entries
          const leaderboard = await getLeaderboard();
          setLeaderboardEntries(leaderboard.slice(0, 5));
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, [open, isAuthenticated, user]);
  
  return (
    <Dialog open={open} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] font-dotmatrix bg-[#8bac0f]/10">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl mb-2" style={{ fontFamily: 'DOTMATRIX, monospace' }}>
            Leaderboard
          </DialogTitle>
        </DialogHeader>
        
        {/* Score display */}
        <div className="bg-[#8bac0f]/20 rounded-xl p-4 mb-4 text-center">
          <div className="mb-1">Your Score</div>
          <div className="text-4xl font-bold mb-2" style={{ fontFamily: 'DOTMATRIX, monospace' }}>
            {score.toLocaleString()}
          </div>
          
          {isNewRecord && (
            <>
              <div className="text-xl text-green-600 font-bold animate-pulse">
                New Record!
              </div>
              <Confetti duration={1000} />
            </>
          )}
          
          {userRank > 0 && (
            <div className="text-gray-600">
              Current Rank: <span className="font-bold">{userRank}</span>
            </div>
          )}
        </div>
        
        {/* Leaderboard list */}
        <div className="mb-4 overflow-y-auto max-h-[300px]">
          <div className="text-lg font-bold mb-2">
            {leaderboardEntries.length > 0 
              ? 'Game Rankings' 
              : 'Login to view leaderboard'
            }
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent rounded-full"></div>
              <div className="mt-2">Loading...</div>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboardEntries.map((entry) => (
                <LeaderboardItem
                  key={entry.userId}
                  entry={entry}
                  isCurrentUser={isAuthenticated && user?.id === entry.userId}
                />
              ))}
              
              {leaderboardEntries.length === 0 && !loading && (
                <div className="text-center py-4 text-gray-500">
                  No leaderboard data available
                </div>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={onClose} className="w-full" style={{ fontFamily: 'DOTMATRIX, monospace' }}>
            Return to Game
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 