'use client';

import React, { useEffect, useState } from 'react';
import { getLeaderboard, getUserRank } from '@/utils/supabase/client';
import { useAuth } from '@/lib/auth';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import Image from 'next/image';
import Link from 'next/link';
import { sleep } from '@/lib/utils';

// 排行榜中的用户类型
interface LeaderboardUser {
  id: string;
  name: string;
  profile_image: string;
  doodle_score: number;
  rank?: number;
}

// 排行榜属性
interface LeaderboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  score: number;
  isNewRecord: boolean;
}

// 礼花特效组件
const Confetti = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div className="confetti-container">
        {Array.from({ length: 100 }).map((_, i) => (
          <div 
            key={i} 
            className="confetti" 
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

// 用户排名项组件
const LeaderboardItem = ({ user, highlight = false }: { user: LeaderboardUser, highlight?: boolean }) => {
  return (
    <div className={`flex items-center p-2 rounded-lg mb-2 ${highlight ? 'bg-green-100' : ''}`}>
      <span className="text-lg font-bold w-8 text-right mr-3">{user.rank}.</span>
      <Link href={`https://x.com/${user.name.replace('@', '')}`} target="_blank" className="flex items-center flex-1">
        <div className="relative w-8 h-8 rounded-full overflow-hidden mr-2">
          <Image 
            src={user.profile_image || '/assets/player.svg'} 
            alt={user.name}
            fill
            className="object-cover rounded-full"
          />
        </div>
        <div className="flex-1 text-sm overflow-hidden">
          <div className="font-semibold truncate">{user.name}</div>
          <div className="text-xs text-gray-500 truncate">@{user.name}</div>
        </div>
        <div className="font-mono text-right">
          {user.doodle_score}
        </div>
      </Link>
    </div>
  );
};

export default function Leaderboard({ open, onOpenChange, score, isNewRecord }: LeaderboardProps) {
  const { user, isAuthenticated } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [topThree, setTopThree] = useState<LeaderboardUser[]>([]);
  const [userRankInfo, setUserRankInfo] = useState<{ 
    userRank?: LeaderboardUser, 
    prevUser?: LeaderboardUser, 
    nextUser?: LeaderboardUser 
  }>({});
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  // 加载排行榜数据
  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!open) return;
      
      setLoading(true);
      
      // 设置最大重试次数
      const maxRetries = 3;
      let retryCount = 0;
      let success = false;
      
      while (retryCount < maxRetries && !success) {
        try {
          console.log(`尝试获取排行榜数据 (${retryCount + 1}/${maxRetries})`);
          
          // 获取排行榜数据 - 所有用户都可以查看
          const data = await getLeaderboard();
          
          if (data && data.length > 0) {
            console.log('成功获取排行榜数据', data);
            
            // 添加排名信息
            const rankedData = data.map((item: any, index: number) => ({
              ...item,
              rank: index + 1
            })) as LeaderboardUser[];
            
            setLeaderboard(rankedData);
            
            // 设置前三名
            setTopThree(rankedData.slice(0, 3));
            
            // 如果用户已登录，获取用户排名相关信息
            if (isAuthenticated && user?.id) {
              const userIndex = rankedData.findIndex(item => item.id === user.id);
              
              if (userIndex !== -1) {
                const userRank = rankedData[userIndex];
                const prevUser = userIndex > 0 ? rankedData[userIndex - 1] : undefined;
                const nextUser = userIndex < rankedData.length - 1 ? rankedData[userIndex + 1] : undefined;
                
                setUserRankInfo({ userRank, prevUser, nextUser });
                console.log('用户排名信息:', { rank: userIndex + 1, total: rankedData.length });
              } else {
                console.log('用户未上榜');
                // 清空用户排名信息
                setUserRankInfo({});
              }
            }
            
            success = true;
          } else {
            throw new Error('排行榜数据为空');
          }
        } catch (error) {
          console.error(`加载排行榜失败 (尝试 ${retryCount + 1}/${maxRetries}):`, error);
          retryCount++;
          
          if (retryCount < maxRetries) {
            // 指数退避策略 - 每次重试等待时间增加
            const delay = 1000 * Math.pow(2, retryCount - 1);
            console.log(`等待 ${delay}ms 后重试...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // 如果创造新纪录，显示礼花特效
      if (isNewRecord) {
        setShowConfetti(true);
        // 稍延迟一点显示礼花，确保组件已经完全加载
        await sleep(300);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      
      setLoading(false);
    };
    
    fetchLeaderboard();
  }, [open, user, isAuthenticated, isNewRecord]);

  // 自动延迟打开排行榜
  useEffect(() => {
    if (isNewRecord && !open) {
      const timer = setTimeout(() => {
        onOpenChange(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isNewRecord, open, onOpenChange]);

  return (
    <>
      {showConfetti && <Confetti />}
      
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex flex-col items-center text-xl">
              <span className={`text-2xl font-bold mb-1 ${isNewRecord ? 'text-green-600' : ''}`}>
                {score} 分
              </span>
              {isNewRecord && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                  新纪录！
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="my-4">
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
              </div>
            ) : (
              <>
                {topThree.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-2 text-gray-500">最高分</h3>
                    {topThree.map(item => (
                      <LeaderboardItem 
                        key={item.id} 
                        user={item} 
                        highlight={user?.id === item.id}
                      />
                    ))}
                  </div>
                )}
                
                {userRankInfo.userRank && userRankInfo.userRank.rank! > 3 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold mb-2 text-gray-500">你的排名</h3>
                    
                    {userRankInfo.prevUser && (
                      <LeaderboardItem user={userRankInfo.prevUser} />
                    )}
                    
                    <LeaderboardItem user={userRankInfo.userRank} highlight={true} />
                    
                    {userRankInfo.nextUser && (
                      <LeaderboardItem user={userRankInfo.nextUser} />
                    )}
                  </div>
                )}
                
                {!isAuthenticated && (
                  <div className="text-center text-gray-500 py-4">
                    登录后查看完整排行榜
                  </div>
                )}
              </>
            )}
          </div>
          
          <DialogFooter>
            <button
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              onClick={() => onOpenChange(false)}
            >
              继续游戏
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 