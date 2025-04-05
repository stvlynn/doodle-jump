'use client'

import React, { useRef, useEffect } from 'react'
import { useGame, Platform, PowerUp } from './GameProvider'
import { Button } from './ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card'

// 现代化配色方案
const COLORS = {
  background: '#f8f9fa',
  cardBg: '#ffffff',
  platformNormal: '#CCFFCC', // 淡绿色
  platformMoving: '#99CCCC', // 淡蓝色
  platformBreakable: '#FFFFCC', // 淡黄色
  platformSpring: '#CCFFCC', // 淡绿色
  springTop: '#FF5252', // 红色
  player: '#FF6B6B', // 现代红色
  flame1: '#FFC107', // 黄色火焰
  flame2: '#FF9800', // 橙色火焰
  rocketBody: '#99CCCC', // 淡蓝色
  text: '#343a40', // 深灰色文字
  eyes: '#FFFFFF', // 白色眼睛
  pupils: '#343a40', // 深灰色瞳孔
}

export const DoodleJump: React.FC = () => {
  const { gameState, startGame, restartGame, movePlayerLeft, movePlayerRight, stopMoving, movingDirection } = useGame()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Set up touch controls
  useEffect(() => {
    if (!canvasRef.current || !gameState.gameStarted) return

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      const canvas = canvasRef.current!
      const canvasRect = canvas.getBoundingClientRect()
      
      // Calculate touch position relative to canvas
      const touchX = touch.clientX - canvasRect.left
      const canvasMiddle = canvas.width / 2
      
      if (touchX < canvasMiddle) {
        movePlayerLeft()
      } else {
        movePlayerRight()
      }
    }

    const handleTouchEnd = () => {
      stopMoving()
    }

    const canvas = canvasRef.current
    canvas.addEventListener('touchstart', handleTouchStart)
    canvas.addEventListener('touchend', handleTouchEnd)
    
    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchend', handleTouchEnd)
    }
  }, [gameState.gameStarted, movePlayerLeft, movePlayerRight, stopMoving])

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 绘制渐变背景
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    bgGradient.addColorStop(0, '#e9f7ff')
    bgGradient.addColorStop(1, '#f0f8ff')
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制装饰性云朵背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    // 云朵 1
    drawCloud(ctx, 50, 100, 30)
    // 云朵 2
    drawCloud(ctx, 220, 180, 25)
    // 云朵 3
    drawCloud(ctx, 150, 320, 20)

    if (!gameState.gameStarted) {
      // Draw start screen
      const titleGradient = ctx.createLinearGradient(
        canvas.width / 2 - 100, 
        canvas.height / 2 - 60,
        canvas.width / 2 + 100,
        canvas.height / 2 - 20
      )
      titleGradient.addColorStop(0, '#99CCCC')
      titleGradient.addColorStop(0.5, '#CCFFCC')
      titleGradient.addColorStop(1, '#FFFFCC')
      
      ctx.fillStyle = titleGradient
      ctx.font = 'bold 36px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Doodle Jump', canvas.width / 2, canvas.height / 2 - 50)
      
      // 添加阴影效果
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      ctx.fillStyle = COLORS.text
      ctx.font = '18px Arial'
      ctx.fillText('Press Start to Play', canvas.width / 2, canvas.height / 2 + 10)
      
      // 重置阴影
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      return
    }

    // 绘制难度等级指示器
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
    ctx.fillRect(10, 30, 80, 10)
    ctx.fillStyle = `rgba(${100 + gameState.difficulty * 15}, ${200 - gameState.difficulty * 10}, 100, 0.7)`
    ctx.fillRect(10, 30, gameState.difficulty * 8, 10)

    // Draw platforms
    gameState.platforms.forEach((platform: Platform) => {
      // 为平台添加阴影
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 2
      
      // Draw different platform types
      switch (platform.type) {
        case 'moving':
          drawPlatform(ctx, platform.x, platform.y, platform.width, COLORS.platformMoving)
          // 添加移动平台的指示箭头
          ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
          if (platform.direction === 'left') {
            drawArrow(ctx, platform.x + 10, platform.y + 5, 'left')
          } else {
            drawArrow(ctx, platform.x + platform.width - 10, platform.y + 5, 'right')
          }
          break;
        case 'breakable':
          if (platform.broken) {
            // 绘制破碎效果
            drawBrokenPlatform(ctx, platform.x, platform.y, platform.width, COLORS.platformBreakable)
          } else {
            drawPlatform(ctx, platform.x, platform.y, platform.width, COLORS.platformBreakable)
            // 添加裂缝图案表示可破碎
            drawCracks(ctx, platform.x, platform.y, platform.width)
          }
          break;
        case 'spring':
          drawPlatform(ctx, platform.x, platform.y, platform.width, COLORS.platformSpring)
          // 绘制弹簧
          ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
          ctx.fillStyle = COLORS.springTop
          const springX = platform.x + platform.width/2 - 7
          
          // 弹簧底座
          ctx.fillRect(springX, platform.y - 4, 14, 4)
          // 弹簧弹性部分（锯齿形）
          ctx.beginPath()
          ctx.moveTo(springX, platform.y - 4)
          for (let i = 0; i < 3; i++) {
            ctx.lineTo(springX + 4, platform.y - 8 - i * 4)
            ctx.lineTo(springX + 10, platform.y - 4 - i * 4)
            ctx.lineTo(springX + 14, platform.y - 8 - i * 4)
          }
          ctx.lineTo(springX + 14, platform.y - 16)
          ctx.lineTo(springX, platform.y - 16)
          ctx.fill()
          
          // 弹簧顶部
          ctx.fillRect(springX - 2, platform.y - 20, 18, 4)
          break;
        default:
          drawPlatform(ctx, platform.x, platform.y, platform.width, COLORS.platformNormal)
      }
      
      // 重置阴影
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    })

    // Draw player - more detailed character
    const playerX = gameState.player.x;
    const playerY = gameState.player.y;
    const playerWidth = gameState.player.width;
    const playerHeight = gameState.player.height;
    
    // 为角色添加阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
    ctx.shadowBlur = 5
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    
    // 绘制角色身体（圆角矩形）
    ctx.fillStyle = COLORS.player
    ctx.beginPath();
    ctx.moveTo(playerX + 10, playerY);
    ctx.lineTo(playerX + playerWidth - 10, playerY);
    ctx.quadraticCurveTo(playerX + playerWidth, playerY, playerX + playerWidth, playerY + 10);
    ctx.lineTo(playerX + playerWidth, playerY + playerHeight - 10);
    ctx.quadraticCurveTo(playerX + playerWidth, playerY + playerHeight, playerX + playerWidth - 10, playerY + playerHeight);
    ctx.lineTo(playerX + 10, playerY + playerHeight);
    ctx.quadraticCurveTo(playerX, playerY + playerHeight, playerX, playerY + playerHeight - 10);
    ctx.lineTo(playerX, playerY + 10);
    ctx.quadraticCurveTo(playerX, playerY, playerX + 10, playerY);
    ctx.fill();
    
    // 重置阴影
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    
    // Draw antennas
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.lineWidth = 2
    // Left antenna
    ctx.beginPath();
    ctx.moveTo(playerX + 10, playerY + 5);
    ctx.quadraticCurveTo(playerX, playerY - 10, playerX - 5, playerY - 15);
    ctx.stroke();
    
    // Right antenna
    ctx.beginPath();
    ctx.moveTo(playerX + playerWidth - 10, playerY + 5);
    ctx.quadraticCurveTo(playerX + playerWidth, playerY - 10, playerX + playerWidth + 5, playerY - 15);
    ctx.stroke();
    
    // 绘制天线顶端小圆点
    ctx.fillStyle = '#99CCCC'
    ctx.beginPath()
    ctx.arc(playerX - 5, playerY - 15, 3, 0, Math.PI * 2)
    ctx.arc(playerX + playerWidth + 5, playerY - 15, 3, 0, Math.PI * 2)
    ctx.fill()
    
    // Eyes (white background)
    ctx.fillStyle = COLORS.eyes
    ctx.beginPath();
    ctx.arc(playerX + 12, playerY + 15, 6, 0, Math.PI * 2);
    ctx.arc(playerX + playerWidth - 12, playerY + 15, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw pupils
    ctx.fillStyle = COLORS.pupils
    const pupilOffset = gameState.player.velocityY < 0 ? 0 : 1; // Look slightly down when falling
    
    // Add direction to pupil position based on movement
    let pupilXOffset = 0;
    if (gameState.player.velocityY > 2) {
      pupilXOffset = 0; // Looking straight when falling fast
    } else if (movingDirection === 'left') {
      pupilXOffset = -1.5; // Looking left
    } else if (movingDirection === 'right') {
      pupilXOffset = 1.5; // Looking right
    }
    
    ctx.beginPath();
    ctx.arc(playerX + 12 + pupilXOffset, playerY + 15 + pupilOffset, 2.5, 0, Math.PI * 2);
    ctx.arc(playerX + playerWidth - 12 + pupilXOffset, playerY + 15 + pupilOffset, 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Mouth
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.lineWidth = 2
    if (gameState.player.velocityY < 0) {
      // Smiling when jumping up
      ctx.beginPath();
      ctx.arc(playerX + playerWidth / 2, playerY + 25, 8, 0.1 * Math.PI, 0.9 * Math.PI, false);
      ctx.stroke();
    } else if (gameState.player.velocityY > 5) {
      // Surprised mouth when falling fast
      ctx.beginPath();
      ctx.arc(playerX + playerWidth / 2, playerY + 28, 5, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Straight line when falling normally
      ctx.beginPath();
      ctx.moveTo(playerX + playerWidth / 2 - 8, playerY + 26);
      ctx.lineTo(playerX + playerWidth / 2 + 8, playerY + 26);
      ctx.stroke();
    }
    
    // Draw any active power-ups on the player
    if (gameState.player.activePowerup) {
      switch (gameState.player.activePowerup) {
        case 'rocket':
          // 添加阴影
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
          ctx.shadowBlur = 10
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 5
          
          // Draw rocket
          ctx.fillStyle = COLORS.rocketBody
          // 火箭身体
          ctx.beginPath()
          ctx.moveTo(playerX + playerWidth / 2 - 10, playerY + playerHeight)
          ctx.lineTo(playerX + playerWidth / 2 - 12, playerY + playerHeight + 20)
          ctx.lineTo(playerX + playerWidth / 2 + 12, playerY + playerHeight + 20)
          ctx.lineTo(playerX + playerWidth / 2 + 10, playerY + playerHeight)
          ctx.fill()
          
          // 火箭尾翼
          ctx.beginPath()
          ctx.moveTo(playerX + playerWidth / 2 - 12, playerY + playerHeight + 15)
          ctx.lineTo(playerX + playerWidth / 2 - 18, playerY + playerHeight + 20)
          ctx.lineTo(playerX + playerWidth / 2 - 12, playerY + playerHeight + 20)
          ctx.fill()
          
          ctx.beginPath()
          ctx.moveTo(playerX + playerWidth / 2 + 12, playerY + playerHeight + 15)
          ctx.lineTo(playerX + playerWidth / 2 + 18, playerY + playerHeight + 20)
          ctx.lineTo(playerX + playerWidth / 2 + 12, playerY + playerHeight + 20)
          ctx.fill()
          
          // Draw flames with animation
          const flameHeight = 15 + Math.random() * 10; // Randomize flame height for animation
          ctx.fillStyle = COLORS.flame1
          ctx.beginPath();
          ctx.moveTo(playerX + playerWidth / 2, playerY + playerHeight + flameHeight + 15);
          ctx.lineTo(playerX + playerWidth / 2 - 8, playerY + playerHeight + 20);
          ctx.lineTo(playerX + playerWidth / 2 + 8, playerY + playerHeight + 20);
          ctx.fill();
          
          // Add second flame color for more realistic effect
          ctx.fillStyle = COLORS.flame2
          ctx.beginPath();
          ctx.moveTo(playerX + playerWidth / 2, playerY + playerHeight + flameHeight + 5);
          ctx.lineTo(playerX + playerWidth / 2 - 5, playerY + playerHeight + 22);
          ctx.lineTo(playerX + playerWidth / 2 + 5, playerY + playerHeight + 22);
          ctx.fill();
          
          // 重置阴影
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 0
          break;
      }
    }

    // Draw score
    ctx.fillStyle = COLORS.text
    ctx.font = 'bold 18px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(`Score: ${gameState.score}`, 10, 20)

    // Draw power-up items
    gameState.powerups.forEach(powerup => {
      // 添加阴影
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = 5
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 2
      
      switch (powerup.type) {
        case 'spring':
          // Draw spring
          ctx.fillStyle = '#FF5252';
          // 弹簧底座
          ctx.fillRect(powerup.x, powerup.y + 10, 15, 5);
          // 弹簧弹性部分（锯齿形）
          ctx.beginPath()
          ctx.moveTo(powerup.x, powerup.y + 10)
          for (let i = 0; i < 2; i++) {
            ctx.lineTo(powerup.x + 5, powerup.y + 7 - i * 4)
            ctx.lineTo(powerup.x + 10, powerup.y + 10 - i * 4)
            ctx.lineTo(powerup.x + 15, powerup.y + 7 - i * 4)
          }
          ctx.lineTo(powerup.x + 15, powerup.y)
          ctx.lineTo(powerup.x, powerup.y)
          ctx.fill()
          
          // 弹簧顶部
          ctx.fillRect(powerup.x - 2, powerup.y - 5, 19, 5);
          break;
        case 'rocket':
          // Draw rocket
          ctx.fillStyle = COLORS.rocketBody
          // 火箭主体
          ctx.beginPath()
          ctx.moveTo(powerup.x + 10, powerup.y)
          ctx.lineTo(powerup.x, powerup.y + 10)
          ctx.lineTo(powerup.x, powerup.y + 30)
          ctx.lineTo(powerup.x + 20, powerup.y + 30)
          ctx.lineTo(powerup.x + 20, powerup.y + 10)
          ctx.fill()
          
          // 火箭头部
          ctx.beginPath()
          ctx.moveTo(powerup.x + 10, powerup.y - 10)
          ctx.lineTo(powerup.x, powerup.y + 10)
          ctx.lineTo(powerup.x + 20, powerup.y + 10)
          ctx.fill()
          
          // 火箭尾翼
          ctx.fillStyle = '#FF6B6B'
          ctx.beginPath()
          ctx.moveTo(powerup.x, powerup.y + 30)
          ctx.lineTo(powerup.x - 5, powerup.y + 35)
          ctx.lineTo(powerup.x, powerup.y + 25)
          ctx.fill()
          
          ctx.beginPath()
          ctx.moveTo(powerup.x + 20, powerup.y + 30)
          ctx.lineTo(powerup.x + 25, powerup.y + 35)
          ctx.lineTo(powerup.x + 20, powerup.y + 25)
          ctx.fill()
          
          // 火箭窗口
          ctx.fillStyle = '#CCFFCC'
          ctx.beginPath()
          ctx.arc(powerup.x + 10, powerup.y + 15, 5, 0, Math.PI * 2)
          ctx.fill()
          break;
      }
      
      // 重置阴影
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    });

    // Draw game over screen
    if (gameState.gameOver) {
      // 半透明黑色背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // 游戏结束文字
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 10
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      
      const gameOverGradient = ctx.createLinearGradient(
        canvas.width / 2 - 100, 
        canvas.height / 2 - 60,
        canvas.width / 2 + 100,
        canvas.height / 2 - 20
      )
      gameOverGradient.addColorStop(0, '#FF6B6B')
      gameOverGradient.addColorStop(1, '#FF9E9E')
      
      ctx.fillStyle = gameOverGradient
      ctx.font = 'bold 32px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 40)
      
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 24px Arial'
      ctx.fillText(`Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 10)
      
      // 重置阴影
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    }
  }, [gameState, movingDirection])

  // 辅助函数：绘制平台
  const drawPlatform = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, color: string) => {
    // 平台主体
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(x + 5, y)
    ctx.lineTo(x + width - 5, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + 5)
    ctx.lineTo(x + width, y + 10)
    ctx.quadraticCurveTo(x + width, y + 15, x + width - 5, y + 15)
    ctx.lineTo(x + 5, y + 15)
    ctx.quadraticCurveTo(x, y + 15, x, y + 10)
    ctx.lineTo(x, y + 5)
    ctx.quadraticCurveTo(x, y, x + 5, y)
    ctx.fill()
    
    // 平台顶部高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.beginPath()
    ctx.moveTo(x + 5, y)
    ctx.lineTo(x + width - 5, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + 3)
    ctx.lineTo(x + width, y + 3)
    ctx.quadraticCurveTo(x + width - 2, y + 5, x + 5, y + 5)
    ctx.quadraticCurveTo(x, y + 5, x, y + 3)
    ctx.lineTo(x, y + 3)
    ctx.quadraticCurveTo(x, y, x + 5, y)
    ctx.fill()
  }

  // 辅助函数：绘制破碎平台
  const drawBrokenPlatform = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, color: string) => {
    ctx.fillStyle = color
    
    // 绘制碎片
    for (let i = 0; i < 4; i++) {
      const pieceX = x + (width / 4) * i
      const pieceWidth = width / 4 - 2
      const pieceY = y + Math.random() * 3 // 碎片位置有些许偏移
      
      ctx.beginPath()
      ctx.moveTo(pieceX, pieceY)
      ctx.lineTo(pieceX + pieceWidth, pieceY)
      ctx.lineTo(pieceX + pieceWidth, pieceY + 8)
      ctx.lineTo(pieceX, pieceY + 8)
      ctx.fill()
    }
  }

  // 辅助函数：绘制平台上的裂缝
  const drawCracks = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number) => {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.lineWidth = 1
    
    // 绘制几条随机的裂缝线
    ctx.beginPath()
    ctx.moveTo(x + width / 2, y)
    ctx.lineTo(x + width / 3, y + 5)
    ctx.moveTo(x + width / 2, y)
    ctx.lineTo(x + width * 2 / 3, y + 7)
    ctx.moveTo(x + width / 2, y)
    ctx.lineTo(x + width / 2, y + 10)
    ctx.stroke()
  }

  // 辅助函数：绘制方向箭头
  const drawArrow = (ctx: CanvasRenderingContext2D, x: number, y: number, direction: 'left' | 'right') => {
    ctx.beginPath()
    if (direction === 'left') {
      ctx.moveTo(x + 5, y)
      ctx.lineTo(x, y)
      ctx.lineTo(x + 5, y - 5)
    } else {
      ctx.moveTo(x - 5, y)
      ctx.lineTo(x, y)
      ctx.lineTo(x - 5, y - 5)
    }
    ctx.fill()
  }

  // 辅助函数：绘制云朵
  const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.arc(x + size, y - size / 2, size * 0.8, 0, Math.PI * 2)
    ctx.arc(x + size * 1.5, y, size * 0.7, 0, Math.PI * 2)
    ctx.arc(x + size * 0.5, y + size / 2, size * 0.6, 0, Math.PI * 2)
    ctx.fill()
  }

  return (
    <Card className="w-full overflow-hidden bg-white/90 backdrop-blur-sm border-none shadow-lg">
      <CardHeader className="bg-gradient-to-r from-[#CCFFCC] via-[#99CCCC] to-[#FFFFCC] pb-2">
        <CardTitle className="text-center text-gray-800 font-bold text-xl">
          {gameState.gameStarted 
            ? `Score: ${gameState.score}` 
            : 'Doodle Jump'}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center p-0">
        <canvas 
          ref={canvasRef} 
          width={320} 
          height={480}
          className="border-0 rounded-md shadow-inner bg-gray-50"
        />
      </CardContent>
      <CardFooter className="flex justify-center space-x-2 p-4 bg-gradient-to-r from-[#FFFFCC] via-[#99CCCC] to-[#CCFFCC]">
        {!gameState.gameStarted ? (
          <Button 
            onClick={startGame}
            className="bg-[#99CCCC] hover:bg-[#7BAAAA] text-gray-800 border-none shadow-md"
          >
            Start Game
          </Button>
        ) : gameState.gameOver ? (
          <Button 
            onClick={restartGame}
            className="bg-[#CCFFCC] hover:bg-[#AADDAA] text-gray-800 border-none shadow-md"
          >
            Play Again
          </Button>
        ) : (
          <>
            <Button 
              onMouseDown={movePlayerLeft}
              onMouseUp={stopMoving}
              onMouseLeave={stopMoving}
              className="sm:hidden bg-[#FFFFCC] hover:bg-[#EEEEAA] text-gray-800 border-none shadow-md"
            >
              Left
            </Button>
            <Button 
              onMouseDown={movePlayerRight}
              onMouseUp={stopMoving}
              onMouseLeave={stopMoving}
              className="sm:hidden bg-[#FFFFCC] hover:bg-[#EEEEAA] text-gray-800 border-none shadow-md"
            >
              Right
            </Button>
            <div className="hidden sm:block text-center text-sm text-gray-600 font-medium">
              Use arrow keys to move
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  )
} 