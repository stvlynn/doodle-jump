'use client';

import React, { useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TwitterUser } from '@/lib/auth';
import { LeaderboardEntry, fetchLeaderboard, generateLeaderboardView } from '@/lib/leaderboard';
import Image from 'next/image';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface LeaderboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  score: number;
  isNewRecord: boolean;
  user: TwitterUser | null;
  rank: number;
}

export function LeaderboardDialog({
  open,
  onOpenChange,
  score,
  isNewRecord,
  user,
  rank
}: LeaderboardDialogProps) {
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

  // 获取排行榜数据
  useEffect(() => {
    if (open && user) {
      setLoading(true);
      fetchLeaderboard(user.id)
        .then(data => {
          const viewEntries = generateLeaderboardView(data.entries, rank);
          setLeaderboardEntries(viewEntries);
        })
        .catch(error => {
          console.error('加载排行榜失败:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, user, rank]);

  // 显示礼花特效
  useEffect(() => {
    if (open && isNewRecord) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [open, isNewRecord]);

  // 处理点击用户记录跳转到Twitter主页
  const handleUserClick = (userId: string, username: string) => {
    if (userId && username) {
      window.open(`https://x.com/${username}`, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#f0f0f0] border-[#8bac0f] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-dotmatrix text-[#0f380f]">
            排行榜
          </DialogTitle>
        </DialogHeader>

        {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} />}

        <div className="flex flex-col items-center mb-6">
          <div className="text-3xl font-dotmatrix text-[#0f380f] mb-2">
            {score}
          </div>
          {isNewRecord && (
            <div className="bg-[#ff6b6b] text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
              新纪录!
            </div>
          )}
        </div>

        <div className="space-y-4 max-h-[50vh] overflow-y-auto p-2">
          {loading ? (
            <div className="text-center py-4">加载中...</div>
          ) : (
            leaderboardEntries.map((entry, index) => (
              entry.rank === -1 ? (
                <div key={`divider-${index}`} className="text-center text-gray-500">...</div>
              ) : (
                <div 
                  key={entry.id} 
                  className={`flex items-center p-3 rounded-lg ${entry.TwitterID === user?.id ? 'bg-[#8bac0f]/20' : 'bg-white'} cursor-pointer hover:bg-[#8bac0f]/10 transition-colors`}
                  onClick={() => handleUserClick(entry.TwitterID, entry.TwitterName)}
                >
                  <div className="w-8 text-center font-bold text-[#0f380f]">
                    {entry.rank}
                  </div>
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#0f380f] ml-2">
                    <Image 
                      src={entry.TwitterAvatar} 
                      alt={entry.TwitterName} 
                      width={40} 
                      height={40} 
                      className="object-cover"
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="font-semibold">{entry.TwitterName}</div>
                    <div className="text-xs text-gray-500">@{entry.TwitterID}</div>
                  </div>
                  <div className="font-dotmatrix text-xl text-[#0f380f]">
                    {entry.doodleScore}
                  </div>
                </div>
              )
            ))
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button 
            onClick={() => onOpenChange(false)}
            className="bg-[#0f380f] hover:bg-[#306230] w-full"
          >
            返回游戏
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 