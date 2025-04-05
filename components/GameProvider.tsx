'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { DifficultyManager } from './DifficultyManager'

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
  type: 'rocket'
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
    activePowerup: null | 'rocket'
    powerupTimer: number
  }
  platforms: Platform[]
  powerups: PowerUp[]
  score: number
  gameOver: boolean
  gameStarted: boolean
  difficulty: number // Game difficulty value
  lastRocketTime: number // Last rocket generation time
}

interface GameContextType {
  gameState: GameState
  startGame: () => void
  restartGame: () => void
  movePlayerLeft: () => void
  movePlayerRight: () => void
  stopMoving: () => void
  movingDirection: 'left' | 'right' | null
  pauseGame: () => void
  resumeGame: () => void
  toggleGravityControl: (enabled: boolean) => void
  useGravityControl: boolean
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
  const PLATFORM_COUNT = 7 // Initial platform count, will adjust based on difficulty
  const SPRING_JUMP_FORCE = -15
  const ROCKET_JUMP_FORCE = -20
  const ROCKET_DURATION = 150 // frames (about 2.5 seconds)
  
  // Calculate the maximum height player can jump
  const MAX_JUMP_HEIGHT = Math.abs(JUMP_FORCE * JUMP_FORCE / (2 * GRAVITY));
  
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
    difficulty: 0, // Initial difficulty is 0
    lastRocketTime: 0 // Initial last rocket generation time
  }

  const [gameState, setGameState] = useState<GameState>(initialGameState)
  const [movingDirection, setMovingDirection] = useState<'left' | 'right' | null>(null)
  const [isPaused, setIsPaused] = useState(false);
  const [useGravityControl, setUseGravityControl] = useState(false);

  // Calculate current difficulty based on score
  const calculateDifficulty = (score: number): number => {
    return DifficultyManager.calculateDifficulty(score);
  }

  // Create platform function - using configuration from difficulty manager
  const createPlatform = (id: number, x: number, y: number, difficulty: number, lastPlatformType?: string): Platform => {
    const config = DifficultyManager.getPlatformConfig(difficulty);
    const { movingChance, breakableChance, springChance, adjacentBreakablePlatformChance } = config;
    
    // If the previous platform was breakable and meets the adjacent probability, there's a higher chance to generate another breakable platform
    if (lastPlatformType === 'breakable' && Math.random() * 100 < adjacentBreakablePlatformChance) {
      return {
        id,
        x,
        y,
        width: PLATFORM_WIDTH,
        type: 'breakable',
        broken: false
      };
    }
    
    // Basic platform type probability
    const rand = Math.random() * 100;
    
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

  // Create initial platforms - using platform count from difficulty manager
  const createInitialPlatforms = (): Platform[] => {
    const platforms: Platform[] = [];
    const difficulty = 0; // Initial difficulty is 0
    const config = DifficultyManager.getPlatformConfig(difficulty);
    const platformCount = config.platformCount;
    
    // Always add a starting platform below the player
    platforms.push({
      id: 0,
      x: GAME_WIDTH / 2 - PLATFORM_WIDTH / 2,
      y: GAME_HEIGHT / 2 + 50,
      width: PLATFORM_WIDTH,
      type: 'normal'
    });
    
    let lastPlatformType = 'normal';
    
    for (let i = 1; i < platformCount; i++) {
      const platform = createPlatform(
        i,
        Math.random() * (GAME_WIDTH - PLATFORM_WIDTH),
        (GAME_HEIGHT / platformCount) * i,
        difficulty,
        lastPlatformType
      );
      
      platforms.push(platform);
      lastPlatformType = platform.type;
    }
    
    return platforms;
  }

  // Try to create power-ups - using power-up probability and cooldown from difficulty manager
  const tryCreatePowerup = (difficulty: number, currentTime: number, lastRocketTime: number): { powerup: PowerUp | null, newLastRocketTime: number } => {
    const config = DifficultyManager.getPowerUpConfig(difficulty);
    const { rocketChance, rocketCooldown } = config;
    
    // Check rocket cooldown time
    const rocketOnCooldown = currentTime - lastRocketTime < rocketCooldown;
    
    const rand = Math.random() * 100;
    
    // Only consider generating a rocket if it's not on cooldown
    if (!rocketOnCooldown && rand < rocketChance) {
      return {
        powerup: {
          id: Date.now() + Math.random(),
          x: Math.random() * (GAME_WIDTH - 20),
          y: -30, // Start above the screen
          width: 20,
          height: 30,
          type: 'rocket',
          active: true
        },
        newLastRocketTime: currentTime
      }
    }
    
    return { powerup: null, newLastRocketTime: lastRocketTime };
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

  const pauseGame = () => {
    setIsPaused(true);
  }
  
  const resumeGame = () => {
    setIsPaused(false);
  }

  // New method to switch gravity control
  const toggleGravityControl = (enabled: boolean) => {
    setUseGravityControl(enabled);
  }

  // Game loop
  useEffect(() => {
    if (!gameState.gameStarted || gameState.gameOver || isPaused) return

    let frameCount = 0; // Frame counter

    const gameLoop = setInterval(() => {
      frameCount++;
      
      setGameState(prevState => {
        if (prevState.gameOver) return prevState

        // Update difficulty value - based on current score
        const difficulty = calculateDifficulty(prevState.score);

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

        // Handle rocket power-up
        if (prevState.player.activePowerup === 'rocket') {
          newVelocityY = ROCKET_JUMP_FORCE
          
          // Reduce rocket timer
          let newPowerupTimer = prevState.player.powerupTimer - 1
          let activePowerup = prevState.player.activePowerup
          
          if (newPowerupTimer <= 0) {
            activePowerup = null as any // Type assertion to fix type error
          }
          
          // Update player position (rocket effect)
          newY += newVelocityY
          
          // Move camera and generate new platforms during rocket power
          let newPlatforms: Platform[] = [...prevState.platforms]
          let newPowerups = [...prevState.powerups]
          let newScore = prevState.score
          let lastRocketTime = prevState.lastRocketTime
          
          // Calculate how much to move down
          const delta = Math.min(20, GAME_HEIGHT / 2 - newY) // Limit max delta per frame
          
          if (delta > 0) {
            newY += delta // Adjust player position to maintain rocket flight
            
            // Move platforms down
            newPlatforms = newPlatforms.map(platform => ({
              ...platform,
              y: platform.y + delta
            }))
            
            // Move power-ups down
            newPowerups = newPowerups.map(powerup => ({
              ...powerup,
              y: powerup.y + delta
            }))
            
            // Remove platforms and power-ups that are below the bottom of the screen
            newPlatforms = newPlatforms.filter(platform => platform.y < GAME_HEIGHT)
            newPowerups = newPowerups.filter(powerup => powerup.y < GAME_HEIGHT)
            
            // Get platform configuration and spacing configuration
            const platformConfig = DifficultyManager.getPlatformConfig(difficulty);
            const spacingConfig = DifficultyManager.getPlatformSpacing(difficulty, MAX_JUMP_HEIGHT);
            
            // Generate new platforms at the top
            let lastPlatformType = newPlatforms.length > 0 ? newPlatforms[0].type : 'normal';
            
            while (newPlatforms.length < platformConfig.platformCount) {
              const highestPlatformY = Math.min(...newPlatforms.map(p => p.y));
              
              // Use spacing configuration to determine new platform Y coordinate
              const spacing = Math.random() * (spacingConfig.maxSpacing - spacingConfig.minSpacing) + spacingConfig.minSpacing;
              const newY = highestPlatformY - spacing;
              
              // Random X coordinate
              const newX = Math.random() * (GAME_WIDTH - PLATFORM_WIDTH);
              
              const platform = createPlatform(
                Date.now() + Math.random(),
                newX,
                newY,
                difficulty,
                lastPlatformType
              );
              
              newPlatforms.push(platform);
              lastPlatformType = platform.type;
            }
            
            // Try to create new power-ups
            const { powerup, newLastRocketTime } = tryCreatePowerup(difficulty, frameCount, lastRocketTime);
            if (powerup) {
              powerup.y = -30 - Math.random() * 50; // Random height (above the screen)
              newPowerups.push(powerup);
              lastRocketTime = newLastRocketTime;
            }
            
            // Update score based on player jump height
            newScore += Math.floor(delta);
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
            difficulty,
            lastRocketTime
          }
        }

        // Apply gravity
        newVelocityY += GRAVITY
        newY += newVelocityY

        // Check for collision with platforms and initialize platform array
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
              // Collision detected, record platform index
              collisionPlatformIndex = i;
              
              // Handle jump processing
              switch (platform.type) {
                case 'breakable':
                  // Only jump if platform is not broken
                  if (!platform.broken) {
                    newY = platform.y - prevState.player.height
                    newVelocityY = JUMP_FORCE
                    isJumping = true
                    
                    // Mark as broken - create new object instead of modifying original object
                    newPlatforms[i] = { ...platform, broken: true };
                  }
                  break;
                case 'spring':
                  // Spring platform - higher jump
                  newY = platform.y - prevState.player.height
                  newVelocityY = SPRING_JUMP_FORCE
                  isJumping = true
                  break;
                default:
                  // Normal platform - normal jump
                  newY = platform.y - prevState.player.height
                  newVelocityY = JUMP_FORCE
                  isJumping = true
              }
              
              // Jump out of loop once a platform is found
              break;
            }
          }
        }

        // Check for collision with power-ups
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
            // Collect power-up
            if (powerup.type === 'rocket') {
              activePowerup = 'rocket' as any
              powerupTimer = ROCKET_DURATION
              newVelocityY = ROCKET_JUMP_FORCE
            }
            return false
          }
          return true
        })

        // Update moving platforms and handle broken platform fall
        newPlatforms = newPlatforms.map((platform, index) => {
          // Skip just processed collision platform to avoid repeated processing
          if (index === collisionPlatformIndex && platform.type === 'breakable') {
            return platform; // Already updated in collision detection
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
            // Make broken platform fall
            return { ...platform, y: platform.y + 5 }
          }
          return platform
        });
        
        // Remove broken platforms that are below the bottom of the screen
        newPlatforms = newPlatforms.filter(platform => {
          return !(platform.type === 'breakable' && platform.broken && platform.y > GAME_HEIGHT)
        });

        // If player reaches half screen height, generate new platforms and move camera
        let newScore = prevState.score;
        let lastRocketTime = prevState.lastRocketTime;
        
        if (newY < GAME_HEIGHT / 2 && newVelocityY < 0) {
          // Calculate how much to move down
          const delta = GAME_HEIGHT / 2 - newY;
          newY = GAME_HEIGHT / 2;
          
          // Move platforms down
          newPlatforms = newPlatforms.map(platform => ({
            ...platform,
            y: platform.y + delta
          }));
          
          // Move power-ups down
          newPowerups = newPowerups.map(powerup => ({
            ...powerup,
            y: powerup.y + delta
          }));
          
          // Remove platforms and power-ups that are below the bottom of the screen
          newPlatforms = newPlatforms.filter(platform => platform.y < GAME_HEIGHT);
          newPowerups = newPowerups.filter(powerup => powerup.y < GAME_HEIGHT);
          
          // Get platform configuration and spacing configuration
          const platformConfig = DifficultyManager.getPlatformConfig(difficulty);
          const spacingConfig = DifficultyManager.getPlatformSpacing(difficulty, MAX_JUMP_HEIGHT);
          
          // Generate new platforms at the top
          let lastPlatformType = newPlatforms.length > 0 ? newPlatforms[0].type : 'normal';
          
          while (newPlatforms.length < platformConfig.platformCount) {
            const highestPlatformY = Math.min(...newPlatforms.map(p => p.y));
            
            // Use spacing configuration to determine new platform Y coordinate
            const spacing = Math.random() * (spacingConfig.maxSpacing - spacingConfig.minSpacing) + spacingConfig.minSpacing;
            const newY = highestPlatformY - spacing;
            
            // Random X coordinate
            const newX = Math.random() * (GAME_WIDTH - PLATFORM_WIDTH);
            
            const platform = createPlatform(
              Date.now() + Math.random(),
              newX,
              newY,
              difficulty,
              lastPlatformType
            );
            
            newPlatforms.push(platform);
            lastPlatformType = platform.type;
          }
          
          // Try to create new power-ups
          const { powerup, newLastRocketTime } = tryCreatePowerup(difficulty, frameCount, lastRocketTime);
          if (powerup) {
            powerup.y = -30 - Math.random() * 50; // Random height (above the screen)
            newPowerups.push(powerup);
            lastRocketTime = newLastRocketTime;
          }
          
          // Update score based on player jump height
          newScore += Math.floor(delta);
        }

        // Check for game over
        const gameOver = newY > GAME_HEIGHT;

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
          difficulty,
          lastRocketTime
        }
      })
    }, 16) // ~60 FPS

    return () => clearInterval(gameLoop)
  }, [gameState.gameStarted, gameState.gameOver, movingDirection, isPaused])

  // Handle keyboard control
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

  // Handle device orientation
  useEffect(() => {
    if (!gameState.gameStarted || !useGravityControl) return;

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      // Check if game is running
      if (gameState.gameOver || isPaused) return;

      // Get gamma value (horizontal tilt)
      const gamma = event.gamma;
      
      if (gamma === null) return;

      // Control movement based on device tilt angle
      if (gamma < -10) {
        // Left tilt
        movePlayerLeft();
      } else if (gamma > 10) {
        // Right tilt
        movePlayerRight();
      } else {
        // Device flat, stop moving
        stopMoving();
      }
    };

    // Request device orientation permission and add event listener
    const requestDeviceOrientationPermission = async () => {
      // @ts-ignore - DeviceOrientationEvent.requestPermission() is non-standard API
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          // @ts-ignore
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleDeviceOrientation);
          }
        } catch (error) {
          console.error('Unable to get device orientation permission:', error);
        }
      } else {
        // Directly add event listener to devices that don't require permission
        window.addEventListener('deviceorientation', handleDeviceOrientation);
      }
    };

    requestDeviceOrientationPermission();

    // Cleanup function
    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, [gameState.gameStarted, gameState.gameOver, isPaused, useGravityControl]);

  return (
    <GameContext.Provider 
      value={{ 
        gameState, 
        startGame, 
        restartGame, 
        movePlayerLeft, 
        movePlayerRight, 
        stopMoving,
        movingDirection,
        pauseGame,
        resumeGame,
        toggleGravityControl,
        useGravityControl
      }}
    >
      {children}
    </GameContext.Provider>
  )
} 