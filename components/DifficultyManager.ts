/**
 * Difficulty Manager - Responsible for controlling game difficulty and balance
 * 
 * Difficulty System Design:
 * - Initial difficulty is 0
 * - Every 1000 points increases difficulty by 0.1
 * - Maximum difficulty is 20
 * - Difficulty affects platform generation, power-up generation, and game mechanics
 */

// Game difficulty calculation class
export class DifficultyManager {
  // Constants
  private static readonly MAX_DIFFICULTY = 20;
  private static readonly SCORE_PER_LEVEL = 1000;
  private static readonly DIFFICULTY_STEP = 0.1;

  // Power-up constants
  private static readonly BALLOON_FORCE = -6; // Less powerful than rocket but more than regular jump
  private static readonly BALLOON_DURATION = 100; // Shorter duration than rocket (about 1.7 seconds)
  private static readonly ROCKET_FORCE = -20; // Strong upward force
  private static readonly ROCKET_DURATION = 150; // About 2.5 seconds

  /**
   * Calculate current difficulty value based on score
   * @param score Current game score
   * @returns Calculated difficulty value, ranging from 0 to MAX_DIFFICULTY
   */
  public static calculateDifficulty(score: number): number {
    const calculatedDifficulty = Math.floor(score / this.SCORE_PER_LEVEL) * this.DIFFICULTY_STEP;
    return Math.min(calculatedDifficulty, this.MAX_DIFFICULTY);
  }

  /**
   * Get platform generation configuration
   * @param difficulty Current difficulty value
   * @returns Platform generation configuration object
   */
  public static getPlatformConfig(difficulty: number) {
    // Base platform count - decreases as difficulty increases
    const platformCount = difficulty >= 1 
      ? Math.max(7 - Math.floor(difficulty / 2), 4) 
      : 7;
    
    // Moving platform probability - increases with difficulty, capped at 30%
    const movingChance = Math.min(5 + (difficulty * 2), 30);
    
    // Breakable platform probability - increases with difficulty, capped at 25%
    const breakableChance = Math.min(3 + (difficulty * 1.5), 25);
    
    // Spring platform probability - increases with difficulty, capped at 15%
    const springChance = Math.min(2 + difficulty, 15);
    
    // Probability of consecutive breakable platforms - begins at difficulty ≥1, increases by 0.5% per difficulty point
    const adjacentBreakablePlatformChance = difficulty >= 1 
      ? 15 + (difficulty * 0.5) 
      : 0;

    return {
      platformCount,
      movingChance,
      breakableChance, 
      springChance,
      adjacentBreakablePlatformChance
    };
  }

  /**
   * Get power-up generation configuration
   * @param difficulty Current difficulty value
   * @returns Power-up generation configuration object
   */
  public static getPowerUpConfig(difficulty: number) {
    // Rocket probability - increases base chance with difficulty, capped at 8%
    const rocketChance = Math.min(2.0 + (difficulty * 0.3), 8.0);
    
    // Balloon probability - higher than rocket, increases with difficulty, capped at 12%
    const balloonChance = Math.min(4.0 + (difficulty * 0.4), 12.0);
    
    // Rocket cooldown time (in frames) - reduces cooldown time
    // Longer cooldown at lower difficulty, shorter at higher difficulty
    const rocketCooldown = Math.max(450 - (difficulty * 20), 200); // About 7.5-3.3 seconds (60 frames/second)
    
    // Balloon cooldown time - shorter than rocket
    const balloonCooldown = Math.max(300 - (difficulty * 15), 150); // About 5-2.5 seconds
    
    return {
      rocketChance,
      rocketCooldown,
      balloonChance,
      balloonCooldown,
      balloonForce: this.BALLOON_FORCE,
      balloonDuration: this.BALLOON_DURATION,
      rocketForce: this.ROCKET_FORCE,
      rocketDuration: this.ROCKET_DURATION
    };
  }

  /**
   * Get platform spacing configuration
   * @param difficulty Current difficulty value
   * @param jumpHeight Maximum height player can reach with a jump
   * @returns Platform spacing configuration object
   */
  public static getPlatformSpacing(difficulty: number, jumpHeight: number) {
    // Calculate minimum and maximum spacing based on difficulty and jump height
    // Ensure spacing doesn't exceed 80% of player's jump height to maintain playability
    const maxJumpableGap = jumpHeight * 0.8;
    
    // Increase spacing with difficulty, but ensure it doesn't exceed maximum jumpable distance
    const baseMinSpacing = 40 + (difficulty * 1.5);
    const baseMaxSpacing = 60 + (difficulty * 2);
    
    const minSpacing = Math.min(baseMinSpacing, maxJumpableGap - 10);
    const maxSpacing = Math.min(baseMaxSpacing, maxJumpableGap);
    
    return {
      minSpacing,
      maxSpacing
    };
  }
} 