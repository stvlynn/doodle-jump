'use client'

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { useGame, Platform, PowerUp } from './GameProvider'

// Modern color scheme
const COLORS = {
  background: '#f8f9fa',
  cardBg: '#ffffff',
  platformNormal: '#CCFFCC', // Light green
  platformMoving: '#99CCCC', // Light blue
  platformBreakable: '#FFFFCC', // Light yellow
  platformSpring: '#CCFFCC', // Light green
  springTop: '#FF5252', // Red
  player: '#FF6B6B', // Modern red
  flame1: '#FFC107', // Yellow flame
  flame2: '#FF9800', // Orange flame
  rocketBody: '#99CCCC', // Light blue
  text: '#343a40', // Dark gray text
  eyes: '#FFFFFF', // White eyes
  pupils: '#343a40', // Dark gray pupils
}

export interface DoodleJumpProps {
  onButtonDown?: (direction: string) => void;
  onButtonUp?: () => void;
}

export const DoodleJump = forwardRef<{ handleButtonDown: (direction: string) => void; handleButtonUp: () => void }, DoodleJumpProps>(({ onButtonDown, onButtonUp }, ref) => {
  const { gameState, startGame, restartGame, movePlayerLeft, movePlayerRight, stopMoving, movingDirection } = useGame()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [fontLoaded, setFontLoaded] = useState(false)
  const imagesRef = useRef<Record<string, HTMLImageElement>>({})
  
  // Loading font
  useEffect(() => {
    // Using FontFace API to load DOTMATRIX font
    const fontFace = new FontFace('DOTMATRIX', 'url(/assets/fonts/DOTMATRI.TTF)', {
      style: 'normal',
      weight: 'normal'
    });
    
    // Load and add font to document
    fontFace.load().then(font => {
      document.fonts.add(font);
      setFontLoaded(true);
      console.log('DOTMATRIX font loaded!');
    }).catch(err => {
      console.error('Font loading failed:', err);
      // Even if loading fails, set to true to allow display to continue
      setFontLoaded(true);
    });
  }, []);
  
  // Preload all game images
  useEffect(() => {
    const imagesToLoad = [
      '/assets/player.svg',
      '/assets/player-jump.svg',
      '/assets/player-fall.svg',
      '/assets/player-rocket.svg',
      '/assets/platform-normal.svg',
      '/assets/platform-moving.svg',
      '/assets/platform-breakable.svg',
      '/assets/platform-broken.svg',
      '/assets/platform-spring.svg',
      '/assets/powerup-spring.svg',
      '/assets/powerup-rocket.svg',
      '/assets/clouds.svg'
    ]
    
    let loadedCount = 0
    const totalImages = imagesToLoad.length
    const images: Record<string, HTMLImageElement> = {}
    
    imagesToLoad.forEach(src => {
      const img = document.createElement('img')
      img.onload = () => {
        loadedCount++
        if (loadedCount === totalImages) {
          setImagesLoaded(true)
        }
      }
      img.src = src
      // Extract filename as key
      const key = src.split('/').pop()?.replace('.svg', '') || src
      images[key] = img
    })
    
    imagesRef.current = images
  }, [])
  
  // Handle button press event - exported as component property
  const handleButtonDown = (direction: string) => {
    if (onButtonDown) {
      onButtonDown(direction)
    }
    
    if (direction === 'left') {
      movePlayerLeft()
    } else if (direction === 'right') {
      movePlayerRight()
    } else if (direction === 'start') {
      if (gameState.gameOver) {
        restartGame()
      } else if (!gameState.gameStarted) {
        startGame()
      }
    }
  }
  
  // Handle button release event
  const handleButtonUp = () => {
    if (onButtonUp) {
      onButtonUp()
    }
    stopMoving()
  }
  
  // Expose methods to component instance
  useImperativeHandle(
    ref,
    () => ({
      handleButtonDown,
      handleButtonUp
    }),
    [handleButtonDown, handleButtonUp]
  );
  
  // Keyboard key handler
  useEffect(() => {
    if (!gameState.gameStarted && gameState.gameOver) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handleButtonDown('left')
      } else if (e.key === 'ArrowRight') {
        handleButtonDown('right')
      } else if (e.key === 'ArrowUp') {
        handleButtonDown('up')
      } else if (e.key === 'ArrowDown') {
        handleButtonDown('down')
      } else if (e.key === 'Enter') {
        handleButtonDown('start')
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
        handleButtonUp()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameState.gameStarted, gameState.gameOver, movePlayerLeft, movePlayerRight, stopMoving, restartGame, startGame])

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
    if (!canvas || !imagesLoaded || !fontLoaded) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Fix pixel blur issue
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Set display size and actual size
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Scale context to match DPR
    ctx.scale(dpr, dpr);
    
    // Reset CSS dimensions
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    // Screen dimensions
    const gameWidth = rect.width;
    const gameHeight = rect.height;

    // Draw game background - using standard GameBoy green
    ctx.fillStyle = '#8bac0f'
    ctx.fillRect(0, 0, gameWidth, gameHeight)

    // Draw decorative cloud background
    const cloudImage = imagesRef.current['clouds']
    if (cloudImage) {
      ctx.drawImage(cloudImage, gameWidth * 0.15, gameHeight * 0.2, gameWidth * 0.25, gameHeight * 0.12)
      ctx.drawImage(cloudImage, gameWidth * 0.6, gameHeight * 0.35, gameWidth * 0.25, gameHeight * 0.12)
      ctx.drawImage(cloudImage, gameWidth * 0.3, gameHeight * 0.6, gameWidth * 0.25, gameHeight * 0.12)
    }

    if (!gameState.gameStarted) {
      // Draw start screen
      ctx.fillStyle = '#0f380f' // Deeper Game Boy green
      ctx.font = `bold ${gameWidth * 0.08}px 'DOTMATRIX', Arial` // Using DOTMATRIX font
      ctx.textAlign = 'center'
      ctx.fillText('Doodle Jump', gameWidth / 2, gameHeight / 2 - gameHeight * 0.1)
      
      ctx.fillStyle = '#306230' // Darker Game Boy green
      ctx.font = `${gameWidth * 0.045}px 'DOTMATRIX', Arial` // Using DOTMATRIX font
      ctx.fillText('Press Start or A', gameWidth / 2, gameHeight / 2 + gameHeight * 0.03)
      
      return
    }

    // Calculate game area scaling factors - fix character proportions
    const scaleX = gameWidth / 320 * 0.75;
    const scaleY = gameHeight / 480;
    
    // Draw difficulty level indicator
    const indicatorWidth = gameWidth * 0.25;
    const indicatorHeight = gameHeight * 0.02;
    const indicatorX = gameWidth * 0.03;
    const indicatorY = gameHeight * 0.06;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
    ctx.fillRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight)
    ctx.fillStyle = `rgba(${100 + gameState.difficulty * 15}, ${200 - gameState.difficulty * 10}, 100, 0.7)`
    ctx.fillRect(indicatorX, indicatorY, (indicatorWidth / 10) * gameState.difficulty, indicatorHeight)

    // Draw platforms
    gameState.platforms.forEach((platform: Platform) => {
      // Add shadow to platforms
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
      ctx.shadowBlur = 4 * scaleX
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 2 * scaleY
      
      // Use preloaded images
      let platformImageKey: string
      
      // Draw different platform types
      switch (platform.type) {
        case 'moving':
          platformImageKey = 'platform-moving'
          break
        case 'breakable':
          platformImageKey = platform.broken ? 'platform-broken' : 'platform-breakable'
          break
        case 'spring':
          platformImageKey = 'platform-spring'
          break
        default:
          platformImageKey = 'platform-normal'
      }
      
      const platformImage = imagesRef.current[platformImageKey]
      if (platformImage) {
        const height = platform.type === 'spring' ? 25 * scaleY : 15 * scaleY
        // Apply scaling to draw platforms
        ctx.drawImage(
          platformImage, 
          platform.x * scaleX, 
          platform.y * scaleY, 
          platform.width * scaleX, 
          height
        )
      }
      
      // Reset shadows
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    })

    // Draw player - more detailed character
    const playerX = gameState.player.x * scaleX
    const playerY = gameState.player.y * scaleY
    // Fix character width/height ratio, ensure it's square
    const playerWidth = gameState.player.width * scaleX
    // Adjust height to match width ratio, ensure character isn't distorted
    const playerHeight = gameState.player.width * scaleX
    
    // Add shadow to character
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
    ctx.shadowBlur = 5 * scaleX
    ctx.shadowOffsetX = 2 * scaleX
    ctx.shadowOffsetY = 2 * scaleY
    
    // Select appropriate SVG image based on player state
    let playerImageKey: string
    
    if (gameState.player.activePowerup === 'rocket') {
      playerImageKey = 'player-rocket'
    } else if (gameState.player.velocityY < 0) {
      playerImageKey = 'player-jump'
    } else if (gameState.player.velocityY > 5) {
      playerImageKey = 'player-fall'
    } else {
      playerImageKey = 'player'
    }
    
    const playerImage = imagesRef.current[playerImageKey]
    if (playerImage) {
      if (playerImageKey === 'player-rocket') {
        // Rocket state needs special handling, SVG height is 70, normal character is 40
        // Keep width unchanged, adjust height and position to keep player part in consistent position
        ctx.drawImage(playerImage, playerX, playerY, playerWidth, playerHeight * 1.75);
      } else {
        ctx.drawImage(playerImage, playerX, playerY, playerWidth, playerHeight);
      }
    }
    
    // Reset shadows
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    // Draw score
    ctx.fillStyle = '#0f380f' // Game Boy dark green
    ctx.font = `bold ${gameWidth * 0.045}px 'DOTMATRIX', Arial` // Using DOTMATRIX font
    ctx.textAlign = 'left'
    ctx.fillText(`Score: ${gameState.score}`, gameWidth * 0.03, gameHeight * 0.04)

    // Draw power-up items
    gameState.powerups.forEach(powerup => {
      // Add shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = 5 * scaleX
      ctx.shadowOffsetX = 1 * scaleX
      ctx.shadowOffsetY = 2 * scaleY
      
      // Use preloaded images
      let powerupImageKey: string = ''
      let width: number = 0
      let height: number = 0
      
      // PowerUp type is only 'rocket' according to the interface
      if (powerup.type === 'rocket') {
        powerupImageKey = 'powerup-rocket'
        width = 20 * scaleX
        height = 40 * scaleY
      }
      
      const powerupImage = imagesRef.current[powerupImageKey]
      if (powerupImage) {
        ctx.drawImage(powerupImage, powerup.x * scaleX, powerup.y * scaleY, width, height)
      }
      
      // Reset shadows
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    });

    // Draw game over screen
    if (gameState.gameOver) {
      // Semi-transparent black background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(0, 0, gameWidth, gameHeight)
      
      // Game over text
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 10 * scaleX
      ctx.shadowOffsetX = 2 * scaleX
      ctx.shadowOffsetY = 2 * scaleY
      
      ctx.fillStyle = '#FF6B6B'
      ctx.font = `bold ${gameWidth * 0.1}px 'DOTMATRIX', Arial` // Using DOTMATRIX font
      ctx.textAlign = 'center'
      ctx.fillText('Game Over', gameWidth / 2, gameHeight / 2 - gameHeight * 0.08)
      
      ctx.fillStyle = '#FFFFFF'
      ctx.font = `bold ${gameWidth * 0.08}px 'DOTMATRIX', Arial` // Using DOTMATRIX font
      ctx.fillText(`Score: ${gameState.score}`, gameWidth / 2, gameHeight / 2 + gameHeight * 0.02)
      
      // Reset shadows
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    }
  }, [gameState, movingDirection, imagesLoaded, fontLoaded])

  // Render loading state or game canvas
  if (!imagesLoaded || !fontLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#8bac0f]">
        <div className="text-center">
          <div className="animate-pulse text-[#0f380f] text-lg">Loading game resources...</div>
        </div>
      </div>
    );
  }

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full"
      onClick={() => {
        if (!gameState.gameStarted) {
          startGame();
        }
      }}
    />
  )
}) 