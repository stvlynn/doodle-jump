'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Game state types
export interface Platform {
  id: number
  x: number
  y: number
  width: number
  type: 'normal' | 'moving' | 'breakable' | 'spring'
  direction?: 'left' | 'right' // For moving platforms
  broken?: boolean // For breakable platforms
}

export interface PowerUp {
  id: number
  x: number
  y: number
  width: number
  height: number
  type: 'spring' | 'rocket'
  active: boolean
}

export interface GameState {
  player: {
    x: number
    y: number
    velocityY: number
    width: number
    height: number
    isJumping: boolean
    activePowerup: null | 'spring' | 'rocket'
    powerupTimer: number
  }
  platforms: Platform[]
  powerups: PowerUp[]
  score: number
  gameOver: boolean
  gameStarted: boolean
  difficulty: number // 1-10, increases as score increases
}

interface GameContextType {
  gameState: GameState
  startGame: () => void
  restartGame: () => void
  movePlayerLeft: () => void
  movePlayerRight: () => void
  stopMoving: () => void
  movingDirection: 'left' | 'right' | null
}

const GameContext = createContext<GameContextType | null>(null)

export const useGame = () => {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const GAME_WIDTH = 320
  const GAME_HEIGHT = 480
  const GRAVITY = 0.25
  const JUMP_FORCE = -10
  const PLAYER_SPEED = 5
  const PLATFORM_WIDTH = 60
  const PLATFORM_HEIGHT = 10
  const PLATFORM_COUNT = 7
  const SPRING_JUMP_FORCE = -15
  const ROCKET_JUMP_FORCE = -20
  const ROCKET_DURATION = 150 // frames (about 2.5 seconds)
  
  // Score thresholds for difficulty levels
  const DIFFICULTY_THRESHOLDS = [
    0,     // Level 1
    1000,  // Level 2
    2500,  // Level 3
    4000,  // Level 4
    6000,  // Level 5
    8500,  // Level 6
    12000, // Level 7
    16000, // Level 8
    20000, // Level 9
    25000  // Level 10
  ]

  const initialGameState: GameState = {
    player: {
      x: GAME_WIDTH / 2 - 20,
      y: GAME_HEIGHT / 2,
      velocityY: 0,
      width: 40,
      height: 40,
      isJumping: false,
      activePowerup: null,
      powerupTimer: 0
    },
    platforms: [],
    powerups: [],
    score: 0,
    gameOver: false,
    gameStarted: false,
    difficulty: 1
  }

  const [gameState, setGameState] = useState<GameState>(initialGameState)
  const [movingDirection, setMovingDirection] = useState<'left' | 'right' | null>(null)

  // Get current difficulty based on score
  const getCurrentDifficulty = (score: number): number => {
    for (let i = DIFFICULTY_THRESHOLDS.length - 1; i >= 0; i--) {
      if (score >= DIFFICULTY_THRESHOLDS[i]) {
        return i + 1
      }
    }
    return 1
  }

  // Create platform based on difficulty
  const createPlatform = (id: number, x: number, y: number, difficulty: number): Platform => {
    // Higher difficulty increases chance of special platforms
    const rand = Math.random() * 100
    
    // Basic platform type chances based on difficulty
    const movingChance = Math.min(5 + (difficulty * 2), 30) // 7% at level 1, up to 30% at level 10
    const breakableChance = Math.min(3 + (difficulty * 1.5), 25) // 4.5% at level 1, up to 25% at level 10
    const springChance = Math.min(2 + difficulty, 15) // 3% at level 1, up to 15% at level 10
    
    // Special platform logic
    if (rand < movingChance) {
      return {
        id,
        x,
        y,
        width: PLATFORM_WIDTH,
        type: 'moving',
        direction: Math.random() > 0.5 ? 'left' : 'right'
      }
    } else if (rand < movingChance + breakableChance) {
      return {
        id,
        x,
        y,
        width: PLATFORM_WIDTH,
        type: 'breakable',
        broken: false
      }
    } else if (rand < movingChance + breakableChance + springChance) {
      return {
        id,
        x,
        y,
        width: PLATFORM_WIDTH,
        type: 'spring'
      }
    } else {
      return {
        id,
        x,
        y,
        width: PLATFORM_WIDTH,
        type: 'normal'
      }
    }
  }

  // Create initial platforms
  const createInitialPlatforms = (): Platform[] => {
    const platforms: Platform[] = []
    
    // Always add a starting platform below the player
    platforms.push({
      id: 0,
      x: GAME_WIDTH / 2 - PLATFORM_WIDTH / 2,
      y: GAME_HEIGHT / 2 + 50,
      width: PLATFORM_WIDTH,
      type: 'normal'
    })
    
    for (let i = 1; i < PLATFORM_COUNT; i++) {
      platforms.push(
        createPlatform(
          i,
          Math.random() * (GAME_WIDTH - PLATFORM_WIDTH),
          (GAME_HEIGHT / PLATFORM_COUNT) * i,
          1 // starting difficulty
        )
      )
    }
    
    return platforms
  }

  // Create powerup with a certain probability
  const tryCreatePowerup = (difficulty: number): PowerUp | null => {
    // 大幅降低火箭生成概率
    const rocketChance = Math.min(0.5 + (difficulty * 0.1), 2) // 0.6% at level 1, up to 2% at level 10
    
    const rand = Math.random() * 100
    
    if (rand < rocketChance) {
      return {
        id: Date.now() + Math.random(),
        x: Math.random() * (GAME_WIDTH - 20),
        y: -30, // Start above the screen
        width: 20,
        height: 30,
        type: 'rocket',
        active: true
      }
    }
    
    return null
  }

  const startGame = () => {
    setGameState({
      ...initialGameState,
      platforms: createInitialPlatforms(),
      gameStarted: true
    })
  }

  const restartGame = () => {
    setGameState({
      ...initialGameState,
      platforms: createInitialPlatforms(),
      gameStarted: true
    })
  }

  const movePlayerLeft = () => {
    setMovingDirection('left')
  }

  const movePlayerRight = () => {
    setMovingDirection('right')
  }

  const stopMoving = () => {
    setMovingDirection(null)
  }

  // Game loop
  useEffect(() => {
    if (!gameState.gameStarted || gameState.gameOver) return

    const gameLoop = setInterval(() => {
      setGameState(prevState => {
        if (prevState.gameOver) return prevState

        // Update current difficulty based on score
        const difficulty = getCurrentDifficulty(prevState.score)

        // Update player position
        let newX = prevState.player.x
        if (movingDirection === 'left') {
          newX -= PLAYER_SPEED
        } else if (movingDirection === 'right') {
          newX += PLAYER_SPEED
        }

        // Screen wrapping
        if (newX < -prevState.player.width) {
          newX = GAME_WIDTH
        } else if (newX > GAME_WIDTH) {
          newX = -prevState.player.width
        }

        // Update player velocity and position
        let newY = prevState.player.y
        let newVelocityY = prevState.player.velocityY

        // Handle rocket powerup
        if (prevState.player.activePowerup === 'rocket') {
          newVelocityY = ROCKET_JUMP_FORCE
          
          // Decrease rocket timer
          let newPowerupTimer = prevState.player.powerupTimer - 1
          let activePowerup = prevState.player.activePowerup
          
          if (newPowerupTimer <= 0) {
            activePowerup = null as any // Type assertion to fix type error
          }
          
          // Update player with rocket effect
          newY += newVelocityY
          
          // Move camera and generate new platforms during rocket power-up
          let newPlatforms: Platform[] = [...prevState.platforms]
          let newPowerups = [...prevState.powerups]
          let newScore = prevState.score
          
          // Calculate how much we need to move everything down
          const delta = Math.min(20, GAME_HEIGHT / 2 - newY) // Limit max delta per frame
          
          if (delta > 0) {
            newY += delta // Adjust player position to maintain rocket flight
            
            // Move platforms down
            newPlatforms = newPlatforms.map(platform => ({
              ...platform,
              y: platform.y + delta
            }))
            
            // Move powerups down
            newPowerups = newPowerups.map(powerup => ({
              ...powerup,
              y: powerup.y + delta
            }))
            
            // Remove platforms and powerups that went below the screen
            newPlatforms = newPlatforms.filter(platform => platform.y < GAME_HEIGHT)
            newPowerups = newPowerups.filter(powerup => powerup.y < GAME_HEIGHT)
            
            // Generate new platforms at the top
            while (newPlatforms.length < PLATFORM_COUNT) {
              const highestPlatformY = Math.min(...newPlatforms.map(p => p.y))
              const newX = Math.random() * (GAME_WIDTH - PLATFORM_WIDTH)
              const newY = highestPlatformY - Math.random() * 60 - 40 // Random height difference
              
              newPlatforms.push(
                createPlatform(
                  Date.now() + Math.random(),
                  newX,
                  newY,
                  difficulty
                )
              )
            }
            
            // Update score based on how high the rocket has taken the player
            newScore += Math.floor(delta)
          }
          
          return {
            ...prevState,
            player: {
              ...prevState.player,
              x: newX,
              y: newY,
              velocityY: newVelocityY,
              activePowerup,
              powerupTimer: newPowerupTimer
            },
            platforms: newPlatforms,
            powerups: newPowerups,
            score: newScore,
            difficulty
          }
        }

        // Apply gravity
        newVelocityY += GRAVITY
        newY += newVelocityY

        // Check collision with platforms and initialize platform array
        let newPlatforms = [...prevState.platforms];
        let collisionPlatformIndex = -1;
        let isJumping = prevState.player.isJumping;
        
        if (newVelocityY > 0) { // Only check when falling
          for (let i = 0; i < prevState.platforms.length; i++) {
            const platform = prevState.platforms[i]
            const playerBottom = newY + prevState.player.height
            const platformTop = platform.y
            
            if (
              playerBottom >= platformTop && 
              playerBottom <= platformTop + PLATFORM_HEIGHT &&
              newX + prevState.player.width > platform.x && 
              newX < platform.x + platform.width &&
              prevState.player.y + prevState.player.height <= platform.y
            ) {
              // 检测到碰撞，记录平台索引
              collisionPlatformIndex = i;
              
              // 进行弹跳处理
              switch (platform.type) {
                case 'breakable':
                  // 只有当平台未破碎时才弹跳
                  if (!platform.broken) {
                    newY = platform.y - prevState.player.height
                    newVelocityY = JUMP_FORCE
                    isJumping = true
                    
                    // 标记为已破碎 - 创建新对象而不是修改原对象
                    newPlatforms[i] = { ...platform, broken: true };
                  }
                  break;
                case 'spring':
                  // 弹簧平台 - 更高的弹跳
                  newY = platform.y - prevState.player.height
                  newVelocityY = SPRING_JUMP_FORCE
                  isJumping = true
                  break;
                default:
                  // 普通平台 - 正常弹跳
                  newY = platform.y - prevState.player.height
                  newVelocityY = JUMP_FORCE
                  isJumping = true
              }
              
              // 找到一个平台后就跳出循环
              break;
            }
          }
        }

        // Check collision with powerups
        let newPowerups = [...prevState.powerups]
        let activePowerup = prevState.player.activePowerup
        let powerupTimer = prevState.player.powerupTimer
        
        newPowerups = newPowerups.filter(powerup => {
          if (
            powerup.active &&
            newX + prevState.player.width > powerup.x &&
            newX < powerup.x + powerup.width &&
            newY + prevState.player.height > powerup.y &&
            newY < powerup.y + powerup.height
          ) {
            // Collect powerup
            if (powerup.type === 'rocket') {
              activePowerup = 'rocket' as any
              powerupTimer = ROCKET_DURATION
              newVelocityY = ROCKET_JUMP_FORCE
            } else if (powerup.type === 'spring') {
              newVelocityY = SPRING_JUMP_FORCE
            }
            return false
          }
          return true
        })

        // 更新移动平台和处理破碎平台下落
        newPlatforms = newPlatforms.map((platform, index) => {
          // 跳过刚刚处理过的碰撞平台，避免重复处理
          if (index === collisionPlatformIndex && platform.type === 'breakable') {
            return platform; // 已经在碰撞检测时更新过了
          }
          
          if (platform.type === 'moving' && platform.direction) {
            let newX = platform.x
            const speed = 1 + (difficulty * 0.2) // Speed increases with difficulty
            
            if (platform.direction === 'left') {
              newX -= speed
              if (newX < 0) {
                return { ...platform, x: newX, direction: 'right' as 'right' }
              }
            } else {
              newX += speed
              if (newX + platform.width > GAME_WIDTH) {
                return { ...platform, x: newX, direction: 'left' as 'left' }
              }
            }
            return { ...platform, x: newX }
          } else if (platform.type === 'breakable' && platform.broken) {
            // 使破碎的平台下落
            return { ...platform, y: platform.y + 5 }
          }
          return platform
        });
        
        // 移除已经掉出屏幕的破碎平台
        newPlatforms = newPlatforms.filter(platform => {
          return !(platform.type === 'breakable' && platform.broken && platform.y > GAME_HEIGHT)
        });

        // Generate new platforms and move camera if player reaches half height
        let newScore = prevState.score
        
        if (newY < GAME_HEIGHT / 2 && newVelocityY < 0) {
          // Calculate how much we need to move everything down
          const delta = GAME_HEIGHT / 2 - newY
          newY = GAME_HEIGHT / 2
          
          // Move platforms down
          newPlatforms = newPlatforms.map(platform => ({
            ...platform,
            y: platform.y + delta
          }))
          
          // Move powerups down
          newPowerups = newPowerups.map(powerup => ({
            ...powerup,
            y: powerup.y + delta
          }))
          
          // Remove platforms and powerups that went below the screen
          newPlatforms = newPlatforms.filter(platform => platform.y < GAME_HEIGHT)
          newPowerups = newPowerups.filter(powerup => powerup.y < GAME_HEIGHT)
          
          // Generate new platforms at the top
          while (newPlatforms.length < PLATFORM_COUNT) {
            const highestPlatformY = Math.min(...newPlatforms.map(p => p.y))
            const newX = Math.random() * (GAME_WIDTH - PLATFORM_WIDTH)
            const newY = highestPlatformY - Math.random() * 60 - 40 // Random height difference
            
            newPlatforms.push(
              createPlatform(
                Date.now() + Math.random(),
                newX,
                newY,
                difficulty
              )
            )
          }
          
          // Try to create new powerups
          const powerup = tryCreatePowerup(difficulty)
          if (powerup) {
            powerup.y = -30 - Math.random() * 50 // Random height above screen
            newPowerups.push(powerup)
          }
          
          // Update score based on how high the player jumped
          newScore += Math.floor(delta)
        }

        // Check game over
        const gameOver = newY > GAME_HEIGHT

        return {
          ...prevState,
          player: {
            ...prevState.player,
            x: newX,
            y: newY,
            velocityY: newVelocityY,
            isJumping,
            activePowerup,
            powerupTimer
          },
          platforms: newPlatforms,
          powerups: newPowerups,
          score: newScore,
          gameOver,
          difficulty
        }
      })
    }, 16) // ~60 FPS

    return () => clearInterval(gameLoop)
  }, [gameState.gameStarted, gameState.gameOver, movingDirection])

  // Handle keyboard controls
  useEffect(() => {
    if (!gameState.gameStarted) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        movePlayerLeft()
      } else if (e.key === 'ArrowRight') {
        movePlayerRight()
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        stopMoving()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameState.gameStarted])

  return (
    <GameContext.Provider 
      value={{ 
        gameState, 
        startGame, 
        restartGame, 
        movePlayerLeft, 
        movePlayerRight, 
        stopMoving,
        movingDirection
      }}
    >
      {children}
    </GameContext.Provider>
  )
} 