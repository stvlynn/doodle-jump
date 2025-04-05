'use client'

import React, { ReactNode, useState, useRef, useEffect } from 'react'
import { DoodleJump } from './DoodleJump'
import { useGame } from './GameProvider'
import { Settings } from './Settings'

interface GameBoyProps {
  children: ReactNode;
}

export const GameBoy: React.FC<GameBoyProps> = ({ children }) => {
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const { startGame, restartGame, gameState, movePlayerLeft, movePlayerRight, stopMoving, pauseGame } = useGame();
  const settingsRef = useRef<any>(null);
  
  // Handle button press
  const handleButtonDown = (direction: string) => {
    setActiveButton(direction);
    
    // If settings menu is visible, prioritize handling direction key operations for the settings menu
    if (settingsRef.current && settingsRef.current.isVisible) {
      // Pass direction key events to settings menu
      if (direction === 'up' || direction === 'down' || direction === 'left' || 
          direction === 'right' || direction === 'a' || direction === 'b') {
        settingsRef.current.handleDirectionKey(direction);
        return;
      }
    }
    
    // Directly call game state management functions
    if (direction === 'left') {
      movePlayerLeft();
    } else if (direction === 'right') {
      movePlayerRight();
    } else if (direction === 'start' || direction === 'a') {
      // Handle Start button or A button - directly use startGame/restartGame
      if (gameState.gameOver) {
        restartGame();
      } else if (!gameState.gameStarted) {
        startGame();
      }
    } else if (direction === 'select') {
      // Handle Select button - open settings menu
      if (settingsRef.current && typeof settingsRef.current.toggleVisibility === 'function') {
        settingsRef.current.toggleVisibility();
      }
    }
  }
  
  // Handle button release
  const handleButtonUp = () => {
    setActiveButton(null);
    stopMoving();
  }
  
  // Listen for keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If settings menu is visible, pass keyboard events to settings menu
      if (settingsRef.current?.isVisible) {
        if (e.key === 'ArrowUp') {
          settingsRef.current.handleDirectionKey('up');
        } else if (e.key === 'ArrowDown') {
          settingsRef.current.handleDirectionKey('down');
        } else if (e.key === 'ArrowLeft') {
          settingsRef.current.handleDirectionKey('left');
        } else if (e.key === 'ArrowRight') {
          settingsRef.current.handleDirectionKey('right');
        } else if (e.key === 'a' || e.key === 'A') {
          settingsRef.current.handleDirectionKey('a');
        } else if (e.key === 'b' || e.key === 'B') {
          settingsRef.current.handleDirectionKey('b');
        }
        return;
      }

      // Handle game controls
      if (e.key === 'ArrowLeft') {
        handleButtonDown('left');
        // Stop moving when keyboard is released
        const handleKeyUp = () => {
          handleButtonUp();
          window.removeEventListener('keyup', handleKeyUp);
        };
        window.addEventListener('keyup', handleKeyUp);
      } else if (e.key === 'ArrowRight') {
        handleButtonDown('right');
        // Stop moving when keyboard is released
        const handleKeyUp = () => {
          handleButtonUp();
          window.removeEventListener('keyup', handleKeyUp);
        };
        window.addEventListener('keyup', handleKeyUp);
      } else if (e.key === 'Enter') {
        handleButtonDown('start');
        // Restore button when keyboard is released
        const handleKeyUp = () => {
          handleButtonUp();
          window.removeEventListener('keyup', handleKeyUp);
        };
        window.addEventListener('keyup', handleKeyUp);
      } else if (e.key === 'a' || e.key === 'A') {
        handleButtonDown('a');
        // Restore button when keyboard is released
        const handleKeyUp = () => {
          handleButtonUp();
          window.removeEventListener('keyup', handleKeyUp);
        };
        window.addEventListener('keyup', handleKeyUp);
      } else if (e.key === 'Escape') {
        handleButtonDown('select');
        // Restore button when keyboard is released
        const handleKeyUp = () => {
          handleButtonUp();
          window.removeEventListener('keyup', handleKeyUp);
        };
        window.addEventListener('keyup', handleKeyUp);
      } else if (e.key === 'b' || e.key === 'B') {
        handleButtonDown('b');
        // Restore button when keyboard is released
        const handleKeyUp = () => {
          handleButtonUp();
          window.removeEventListener('keyup', handleKeyUp);
        };
        window.addEventListener('keyup', handleKeyUp);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <div className="gameboy relative select-none w-full max-w-[500px]">
      {/* Main body shell - replace fixed width with responsive width */}
      <div className="gameboy-body relative w-full aspect-[3/5] bg-gradient-to-br from-[#e0e2e7] to-[#c8cad0] rounded-[4%_4%_20%_4%] p-[4%] shadow-xl border-[#d2d3d5] border-[2px] overflow-hidden">
        {/* Top edge decoration and switch */}
        <div className="absolute top-0 left-0 right-0 h-[5%] bg-[#c8cad0] border-b-[1px] border-[#b5b7bd] overflow-hidden">
          <div className="z-10 absolute right-[15%] top-[25%] w-[10%] h-[35%] rounded-[8px] bg-gradient-to-b from-[#a9abae] to-[#888a8d]">
            <div className="absolute top-[15%] left-[20%] w-[65%] h-[55%] rounded-[2px] bg-[#777] flex justify-center items-center">
              <div className="relative w-[80%] h-[70%] bg-[#9a9c9f] rounded-[2px]">
                <div className="absolute top-[30%] left-[5%] right-[5%] h-[20%] bg-[#ccc] rounded-[1px]"></div>
              </div>
            </div>
          </div>
          <div className="absolute left-[6%] top-[30%] h-[30%] text-[0.7em] text-[#555] font-semibold">
            <span className="opacity-80">OFF</span>
            <span className="mx-[2px] opacity-50">◄►</span>
            <span className="opacity-80">ON</span>
          </div>
        </div>
        
        {/* Screen outer frame */}
        <div className="screen-outer relative mt-[3%] mx-[1%] rounded-b-[1%] rounded-t-[4%] bg-[#565d67] pt-[6%] pb-[7%] px-[9%] shadow-inner">
          {/* Colored horizontal strip decoration */}
          <div className="absolute top-[6%] left-[18%] right-[18%] h-[1.5%] flex">
            <div className="flex-1 h-full bg-[#e7515b]"></div>
            <div className="flex-1 h-full bg-[#fff]"></div>
            <div className="flex-1 h-full bg-[#4a51a3]"></div>
          </div>
          
          {/* Screen title */}
          <div className="absolute top-[3%] left-0 right-0 text-center text-[0.8em] text-[#e9e9e9] tracking-wide uppercase font-bold">
            DOT MATRIX WITH STEREO SOUND
          </div>
          
          {/* Battery indicator */}
          <div className="absolute left-[15%] top-[15%] flex flex-col items-center">
            <div className="w-[0.6em] h-[0.6em] rounded-full bg-[#e94141]"></div>
            <div className="text-[0.7em] text-[#e9e9e9] font-semibold mt-[2px]">BATTERY</div>
          </div>
          
          {/* Screen area */}
          <div className="screen-inner bg-[#8bac0f] rounded-[1%] aspect-square overflow-hidden relative border-[2%] border-[#232323]">
            {children}
            <Settings ref={settingsRef} />
          </div>
        </div>
        
        {/* GameBoy logo */}
        <div className="text-center mt-[5%]">
          <div className="text-[#02297D] text-[1.5em] font-extrabold tracking-wide">Nintendo<span className="text-[0.4em] align-super ml-[1px]">®</span></div>
          <div className="mt-[-4px] tracking-wide">
            <span className="text-[#02297D] text-[1em] font-black italic tracking-[1px] ml-[10px]">GAME BOY</span>
            <span className="text-[#02297D] text-[0.5em] align-super">™</span>
          </div>
        </div>
        
        {/* Start/Select buttons area - moved below Logo */}
        <div className="w-full flex justify-center mt-[2%] mb-[2%]">
          <div className="w-[70%] flex justify-center space-x-[3em]">
            <div className="flex flex-col items-center">
              <button 
                className={`select-button w-[4em] h-[0.8em] bg-gradient-to-b from-[#333] to-[#222] rounded-[4px] shadow-md cursor-pointer ${activeButton === 'select' ? 'shadow-inner' : ''}`}
                onMouseDown={() => handleButtonDown('select')}
                onMouseUp={handleButtonUp}
                onMouseLeave={handleButtonUp}
                onTouchStart={() => handleButtonDown('select')}
                onTouchEnd={handleButtonUp}
              >
                <div className="w-full h-full rounded-[4px] bg-gradient-to-r from-transparent via-[#444] to-transparent opacity-20"></div>
              </button>
              <div className="text-[0.8em] text-[#444] font-bold mt-[0.3em]">SETTINGS</div>
            </div>
            
            <div className="flex flex-col items-center">
              <button 
                className={`start-button w-[4em] h-[0.8em] bg-gradient-to-b from-[#333] to-[#222] rounded-[4px] shadow-md cursor-pointer ${activeButton === 'start' ? 'shadow-inner' : ''}`}
                onMouseDown={() => handleButtonDown('start')}
                onMouseUp={handleButtonUp}
                onMouseLeave={handleButtonUp}
                onTouchStart={() => handleButtonDown('start')}
                onTouchEnd={handleButtonUp}
              >
                <div className="w-full h-full rounded-[4px] bg-gradient-to-r from-transparent via-[#444] to-transparent opacity-20"></div>
              </button>
              <div className="text-[0.8em] text-[#444] font-bold mt-[0.3em]">START</div>
            </div>
          </div>
        </div>
        
        {/* Controls area */}
        <div className="controls mt-[2%] flex flex-col items-center">
          <div className="w-full flex justify-between">
            {/* Direction keys area - D-pad */}
            <div className="dpad-container ml-[5%] w-[25%]">
              <div className="dpad relative w-full aspect-square">
                {/* D-pad base shadow */}
                <div className="absolute inset-0 rounded-full bg-[#afafaf] shadow-md"></div>
                
                {/* Direction buttons */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[85%] h-[85%]">
                  {/* D-pad background - improved shape */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%]">
                    {/* Horizontal part */}
                    <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-full h-[33%] bg-[#2c2c2c] rounded-sm"></div>
                    {/* Vertical part */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-full w-[33%] bg-[#2c2c2c] rounded-sm"></div>
                  </div>
                  
                  {/* Up button */}
                  <button 
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[33%] h-[33%] cursor-pointer"
                    onMouseDown={() => handleButtonDown('up')}
                    onMouseUp={handleButtonUp}
                    onMouseLeave={handleButtonUp}
                    onTouchStart={() => handleButtonDown('up')}
                    onTouchEnd={handleButtonUp}
                  >
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#555]"></div>
                  </button>
                  
                  {/* Right button */}
                  <button 
                    className="absolute top-1/2 right-0 transform -translate-y-1/2 w-[33%] h-[33%] cursor-pointer"
                    onMouseDown={() => handleButtonDown('right')}
                    onMouseUp={handleButtonUp}
                    onMouseLeave={handleButtonUp}
                    onTouchStart={() => handleButtonDown('right')}
                    onTouchEnd={handleButtonUp}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-[#555]"></div>
                  </button>
                  
                  {/* Down button */}
                  <button 
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[33%] h-[33%] cursor-pointer"
                    onMouseDown={() => handleButtonDown('down')}
                    onMouseUp={handleButtonUp}
                    onMouseLeave={handleButtonUp}
                    onTouchStart={() => handleButtonDown('down')}
                    onTouchEnd={handleButtonUp}
                  >
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-[#555]"></div>
                  </button>
                  
                  {/* Left button */}
                  <button 
                    className="absolute top-1/2 left-0 transform -translate-y-1/2 w-[33%] h-[33%] cursor-pointer"
                    onMouseDown={() => handleButtonDown('left')}
                    onMouseUp={handleButtonUp}
                    onMouseLeave={handleButtonUp}
                    onTouchStart={() => handleButtonDown('left')}
                    onTouchEnd={handleButtonUp}
                  >
                    <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-[#555]"></div>
                  </button>
                  
                  {/* Center point */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[20%] h-[20%] bg-[#3d3d3d] rounded-[2px]"></div>
                </div>
              </div>
            </div>
            
            {/* A/B buttons area */}
            <div className="action-buttons mr-[5%] transform rotate-[15deg] w-[25%]">
              <div className="relative w-full aspect-[2/1]">
                {/* A/B buttons base shadow */}
                <div className="absolute inset-0 rounded-full bg-[#afafaf] shadow-md"></div>
                
                {/* B button */}
                <button 
                  className={`absolute top-1/2 left-[30%] transform -translate-x-1/2 -translate-y-1/2 w-[40%] aspect-square cursor-pointer ${activeButton === 'b' ? 'translate-y-[1px]' : ''}`}
                  onMouseDown={() => handleButtonDown('b')}
                  onMouseUp={handleButtonUp}
                  onMouseLeave={handleButtonUp}
                  onTouchStart={() => handleButtonDown('b')}
                  onTouchEnd={handleButtonUp}
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#d6386d] to-[#a01f51] shadow-sm">
                    <div className="absolute inset-[1px] rounded-full bg-gradient-to-br from-[#e44b7a] to-[#c92963]">
                      <div className="absolute inset-[2px] top-[3px] rounded-full bg-gradient-to-b from-[#f26a93] to-[#e44b7a] opacity-40"></div>
                    </div>
                  </div>
                </button>
                
                {/* A button */}
                <button 
                  className={`absolute top-1/2 right-[30%] transform translate-x-1/2 -translate-y-1/2 w-[40%] aspect-square cursor-pointer ${activeButton === 'a' ? 'translate-y-[1px]' : ''}`}
                  onMouseDown={() => handleButtonDown('a')}
                  onMouseUp={handleButtonUp}
                  onMouseLeave={handleButtonUp}
                  onTouchStart={() => handleButtonDown('a')}
                  onTouchEnd={handleButtonUp}
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#d6386d] to-[#a01f51] shadow-sm">
                    <div className="absolute inset-[1px] rounded-full bg-gradient-to-br from-[#e44b7a] to-[#c92963]">
                      <div className="absolute inset-[2px] top-[3px] rounded-full bg-gradient-to-b from-[#f26a93] to-[#e44b7a] opacity-40"></div>
                    </div>
                  </div>
                </button>
                
                {/* A/B labels */}
                <div className="absolute bottom-[-25%] right-[20%] text-[0.8em] font-bold text-[#444]">A</div>
                <div className="absolute bottom-[-25%] left-[20%] text-[0.8em] font-bold text-[#444]">B</div>
              </div>
            </div>
          </div>
          
          {/* Bottom stripe decoration */}
          <div className="absolute bottom-[8%] right-[12%] flex space-x-[0.3em] transform rotate-[-15deg]">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-[1.2em] h-[0.3em] bg-[#444] rounded-full"></div>
            ))}
          </div>
          
          {/* Bottom speaker channels */}
          <div className="absolute bottom-[4%] left-0 right-0 flex justify-center">
            <div className="speaker-grill transform rotate-[-2deg]">
              <div className="text-center text-[0.7em] font-semibold text-[#555] mb-[0.3em]">PHONES</div>
              <div className="flex space-x-[0.3em] justify-center">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-[0.4em] h-[0.4em] bg-[#777] rounded-full"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 