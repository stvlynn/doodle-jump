'use client';

import React, { useEffect, useState, useRef } from 'react';
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
import { useGame } from '@/components/GameProvider';

// 排行榜中的用户类型
interface LeaderboardUser {
  id: string;
  name: string;
  username?: string;
  profile_image: string;
  doodle_score: string;
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
  // 使用username作为跳转链接，如果不存在则使用name
  const twitterHandle = user.username || user.name;
  
  return (
    <div className={`flex items-center p-2 rounded-lg mb-2 ${highlight ? 'bg-green-100' : ''}`}>
      <span className="text-lg font-bold w-8 text-right mr-3">{user.rank}.</span>
      <Link href={`https://x.com/${twitterHandle}`} target="_blank" className="flex items-center flex-1 group">
        <div className="relative w-8 h-8 rounded-full overflow-hidden mr-2">
          <Image 
            src={user.profile_image || '/assets/player.svg'} 
            alt={user.name}
            fill
            className="object-cover rounded-full"
          />
        </div>
        <div className="flex-1 text-sm overflow-hidden">
          <div className="font-semibold truncate flex items-center">
            {user.name}
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full opacity-80 group-hover:opacity-100">
              Follow+
            </span>
          </div>
          <div className="text-xs text-gray-500 truncate">@{twitterHandle}</div>
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
  const { restartGame, gameState } = useGame();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [topThree, setTopThree] = useState<LeaderboardUser[]>([]);
  const [userRankInfo, setUserRankInfo] = useState<{ 
    userRank?: LeaderboardUser, 
    prevUser?: LeaderboardUser, 
    nextUser?: LeaderboardUser 
  }>({});
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const isLoadingRef = useRef(false);
  const hasLoadedOnceRef = useRef(false);
  // 内部状态来控制对话框显示，避免与外部状态冲突
  const [isOpen, setIsOpen] = useState(false);
  // 添加一个关闭锁，防止关闭后短时间内再次打开
  const closingLockRef = useRef(false);
  // 检测是否为移动设备
  const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // 使用工具函数创建可控制的延迟
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // 创建Twitter分享链接
  const createShareLink = () => {
    // 基本游戏信息
    const gameUrl = "https://doodle.twi.am";
    let tweetText = "";
    
    // 根据排名信息构造推文内容
    if (userRankInfo.userRank) {
      const rank = userRankInfo.userRank.rank;
      tweetText = `I scored ${score} points in Doodle Jump and ranked #${rank} on the leaderboard! Can you beat my score? Play now:`;
    } else {
      tweetText = `I scored ${score} points in Doodle Jump! Can you beat my score? Play now:`;
    }
    
    // 如果创造了新纪录，添加额外信息
    if (isNewRecord) {
      tweetText = `NEW RECORD! ${tweetText}`;
    }
    
    // 构造并返回编码后的URL
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(gameUrl)}`;
  };

  // 处理分享到Twitter
  const handleShareToTwitter = () => {
    const shareUrl = createShareLink();
    window.open(shareUrl, '_blank');
  };
  
  // 组件挂载时添加调试日志
  useEffect(() => {
    console.log('Leaderboard mounted', {
      isMobile: isMobileDevice,
      width: typeof window !== 'undefined' ? window.innerWidth : 'unknown',
      initialOpen: open,
      gameOver: gameState?.gameOver,
      score
    });
    
    // 为移动设备添加一个特殊的监听，确保gameOver状态变化时能显示排行榜
    if (isMobileDevice) {
      const checkGameOver = () => {
        console.log('Mobile device check game over:', {
          gameOver: gameState?.gameOver,
          isOpen,
          closingLocked: closingLockRef.current
        });
        
        if (gameState?.gameOver && !isOpen && !closingLockRef.current) {
          console.log('Mobile device: detected game over, forcing leaderboard open');
          setIsOpen(true);
          onOpenChange(true);
        }
      };
      
      // 定期检查游戏状态
      const interval = setInterval(checkGameOver, 1000);
      return () => clearInterval(interval);
    }
  }, []);

  // 同步外部和内部的open状态，但尊重关闭锁的状态
  useEffect(() => {
    // 如果正在关闭锁定期，不要响应外部的打开请求
    if (closingLockRef.current && open) {
      console.log('排行榜处于关闭锁定期，忽略打开请求');
      // 通知外部状态我们没有打开
      onOpenChange(false);
      return;
    }
    
    setIsOpen(open);
  }, [open, onOpenChange]);

  // 自动延迟打开排行榜
  useEffect(() => {
    if (isNewRecord && !isOpen && !closingLockRef.current) {
      // 立即显示排行榜，不再延迟
      setIsOpen(true);
      onOpenChange(true);
    }
  }, [isNewRecord, isOpen, onOpenChange]);

  // 处理对话框关闭
  const handleOpenChange = (newOpenState: boolean) => {
    // 如果是关闭操作
    if (!newOpenState) {
      // 设置关闭锁，防止短时间内再次打开
      closingLockRef.current = true;
      
      // 先更新内部状态
      setIsOpen(false);
      
      // 然后调用外部onOpenChange回调
      onOpenChange(false);
      
      // 如果游戏已结束，重启游戏
      if (gameState.gameOver) {
        // 立即重启游戏，不要等待，避免状态同步问题
        restartGame();
      }
      
      // 设置一个较长的锁定期，确保用户有时间看到游戏重启
      setTimeout(() => {
        closingLockRef.current = false;
      }, 500);
    } else {
      // 如果是打开操作，且不在关闭锁定期
      if (!closingLockRef.current) {
        setIsOpen(true);
        onOpenChange(true);
      } else {
        console.log('排行榜处于关闭锁定期，忽略打开请求');
      }
    }
  };

  // 处理继续游戏按钮
  const handleContinueGame = () => {
    // 设置关闭锁，防止短时间内再次打开
    closingLockRef.current = true;
    
    // 强制关闭对话框
    setIsOpen(false);
    onOpenChange(false);
    
    // 立即重启游戏，不要等待
    restartGame();
    
    // 锁定一段时间后释放
    setTimeout(() => {
      closingLockRef.current = false;
    }, 500);
  };

  // 加载排行榜数据
  useEffect(() => {
    // 如果dialog未显示或者已经在加载中，则跳过
    if (!isOpen || isLoadingRef.current) return;
    
    const fetchLeaderboard = async () => {
      // 设置加载锁，避免重复请求
      isLoadingRef.current = true;
      setLoading(true);
      
      // 设置最大重试次数
      const maxRetries = 3;
      let retryCount = 0;
      let success = false;
      
      try {
        while (retryCount < maxRetries && !success) {
          try {
            console.log(`尝试获取排行榜数据 (${retryCount + 1}/${maxRetries})`);
            
            // 获取排行榜数据 - 所有用户都可以查看
            const data = await getLeaderboard();
            
            if (data && Array.isArray(data) && data.length > 0) {
              console.log('成功获取排行榜数据', data);
              
              // 添加排名信息 - 需要先按照分数排序
              // 将字符串分数转换为数字进行排序
              const sortedData = [...data].sort((a, b) => 
                parseInt(b.doodle_score || '0', 10) - parseInt(a.doodle_score || '0', 10)
              );
              
              const rankedData = sortedData.map((item: any, index: number) => ({
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
              hasLoadedOnceRef.current = true;
            } else {
              throw new Error('排行榜数据为空或格式不正确');
            }
          } catch (error) {
            console.error(`加载排行榜失败 (尝试 ${retryCount + 1}/${maxRetries}):`, error);
            retryCount++;
            
            if (retryCount < maxRetries) {
              // 指数退避策略 - 每次重试等待时间增加
              const delayTime = 1000 * Math.pow(2, retryCount - 1);
              console.log(`等待 ${delayTime}ms 后重试...`);
              await delay(delayTime);
            }
          }
        }
      } finally {
        // 无论成功与否都释放加载锁
        isLoadingRef.current = false;
        setLoading(false);
      }
      
      // 如果创造新纪录，显示礼花特效
      if (isNewRecord) {
        try {
          setShowConfetti(true);
          // 稍延迟一点显示礼花，确保组件已经完全加载
          await delay(300);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        } catch (e) {
          console.error('显示礼花效果失败:', e);
        }
      }
    };
    
    fetchLeaderboard();
  }, [isOpen, user, isAuthenticated, isNewRecord]);

  return (
    <>
      {showConfetti && <Confetti />}
      
      <Dialog 
        open={isOpen} 
        onOpenChange={handleOpenChange}
        modal={true}
      >
        <DialogContent 
          className="max-w-md bg-white"
          onInteractOutside={(e) => {
            // 防止点击外部关闭
            e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            // 允许Esc关闭并重启游戏
            e.preventDefault();
            handleOpenChange(false);
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex flex-col items-center text-xl">
              <span className={`text-2xl font-bold mb-1 ${isNewRecord ? 'text-green-600' : ''}`}>
                {score} points
              </span>
              {isNewRecord && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                  New Record!
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
                    <h3 className="text-sm font-semibold mb-2 text-gray-500">Top Scores</h3>
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
                    <h3 className="text-sm font-semibold mb-2 text-gray-500">Your Ranking</h3>
                    
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
                    Login to see the full leaderboard
                  </div>
                )}
              </>
            )}
          </div>
          
          <DialogFooter className="flex flex-col gap-2">
            <button
              className="w-full py-2 px-4 bg-black text-white rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              onClick={handleShareToTwitter}
            >
              <span className="text-xl">𝕏</span>
              <span>Share to 𝕏</span>
            </button>
            <button
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              onClick={handleContinueGame}
            >
              Continue Game
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 