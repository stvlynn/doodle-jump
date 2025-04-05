'use client'

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useGame } from './GameProvider';

type MenuOption = 'gravityControl' | 'fullscreen' | 'github' | 'twitter';

// Extended ref interface type
interface SettingsRef {
  toggleVisibility: () => void;
  isVisible: boolean;
  handleDirectionKey: (direction: string) => void;
}

export const Settings = forwardRef<SettingsRef, {}>(({}, ref) => {
  const { gameState, resumeGame, pauseGame, toggleGravityControl, useGravityControl } = useGame();
  const [isVisible, setIsVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number>(0);
  const [gravityControl, setGravityControl] = useState(useGravityControl);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [authorOption, setAuthorOption] = useState<'github' | 'x'>('github');
  // Add selection position state
  const [selectedTogglePosition, setSelectedTogglePosition] = useState<'left' | 'right'>('right');
  const [selectedAuthorPosition, setSelectedAuthorPosition] = useState<'left' | 'right'>('left');

  // Synchronize gravityControl and useGravityControl
  useEffect(() => {
    setGravityControl(useGravityControl);
    // Update corresponding cursor position
    setSelectedTogglePosition(useGravityControl ? 'left' : 'right');
  }, [useGravityControl]);

  // Expose more methods and states to parent component
  useImperativeHandle(ref, () => ({
    toggleVisibility: () => {
      toggleVisibility();
    },
    isVisible: isVisible,
    handleDirectionKey: (direction: string) => {
      // Handle direction key events from GameBoy
      switch (direction) {
        case 'up':
          setSelectedOption(prev => (prev > 0 ? prev - 1 : prev));
          break;
        case 'down':
          setSelectedOption(prev => (prev < menuOptions.length - 1 ? prev + 1 : prev));
          break;
        case 'left':
          handleLeftRightNavigation('left');
          break;
        case 'right':
          handleLeftRightNavigation('right');
          break;
        case 'a':
          handleConfirm();
          break;
        case 'b':
          toggleVisibility();
          break;
      }
    }
  }));

  // Define menu options
  const menuOptions = [
    { id: 'gravityControl', label: 'USE GRAVITY CONTROL', value: gravityControl, type: 'toggle' },
    { id: 'fullscreen', label: 'FULLSCREEN MODE', value: fullscreenMode, type: 'toggle' },
    { id: 'author', label: 'AUTHOR: STEVEN LYNN', options: ['GITHUB', 'X'], value: authorOption, type: 'select' },
    { id: 'back', label: <span><span className="border-b-2 border-white">B</span>ACK</span>, type: 'action' },
  ];
  
  // Handle common logic for left-right navigation - modified to only switch cursor position
  const handleLeftRightNavigation = (direction: 'left' | 'right') => {
    const currentOption = menuOptions[selectedOption];
    
    if (currentOption.type === 'toggle') {
      // Only switch cursor position, don't apply settings immediately
      setSelectedTogglePosition(direction);
    } else if (currentOption.type === 'select') {
      // Author option - switch cursor position
      setSelectedAuthorPosition(direction);
    }
  };
  
  // Listen for keyboard operations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;
      
      switch (e.key) {
        case 'ArrowUp':
          setSelectedOption(prev => (prev > 0 ? prev - 1 : prev));
          break;
        case 'ArrowDown':
          setSelectedOption(prev => (prev < menuOptions.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowLeft':
          handleLeftRightNavigation('left');
          break;
        case 'ArrowRight':
          handleLeftRightNavigation('right');
          break;
        case 'a':
        case 'A':
          // A key confirms
          handleConfirm();
          break;
        case 'b':
        case 'B':
          // B key returns
          toggleVisibility();
          break;
        case 'Escape':
          // ESC key closes menu
          toggleVisibility();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, selectedOption, menuOptions, gravityControl, fullscreenMode, authorOption, toggleGravityControl]);

  // Toggle menu visibility
  const toggleVisibility = () => {
    if (isVisible) {
      setIsVisible(false);
      resumeGame();
    } else {
      // When opening menu, initialize cursor position based on current settings
      setSelectedTogglePosition(gravityControl ? 'left' : 'right');
      setIsVisible(true);
      pauseGame();
    }
  };

  // Handle confirmation
  const handleConfirm = () => {
    const currentOption = menuOptions[selectedOption];
    
    if (currentOption.id === 'author') {
      // Decide which link to open based on current cursor position
      if (selectedAuthorPosition === 'left') {
        window.open('https://github.com/stvlynn', '_blank');
      } else {
        window.open('https://x.com/Stv_Lynn', '_blank');
      }
    } else if (currentOption.id === 'fullscreen') {
      // Set fullscreen mode based on current cursor position
      const newValue = selectedTogglePosition === 'left';
      setFullscreenMode(newValue);
      if (newValue) {
        requestFullscreen();
      } else {
        exitFullscreen();
      }
    } else if (currentOption.id === 'gravityControl') {
      // Set gravity control based on current cursor position
      const newValue = selectedTogglePosition === 'left';
      setGravityControl(newValue);
      toggleGravityControl(newValue);
    } else if (currentOption.id === 'back') {
      // Return to game
      toggleVisibility();
    }
  };

  // Request fullscreen
  const requestFullscreen = () => {
    // Add fullscreen CSS class to body and gameboy
    document.body.classList.add('fullscreen');
    document.querySelector('.gameboy')?.classList.add('fullscreen');
    
    // Save current scroll position and prevent scrolling
    document.body.style.overflow = 'hidden';
    
    // If native fullscreen API is supported, use it too
    const screenInner = document.querySelector('.screen-inner');
    if (screenInner && document.fullscreenEnabled) {
      screenInner.requestFullscreen()
        .catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    }
  };

  // Exit fullscreen
  const exitFullscreen = () => {
    // Remove fullscreen CSS class
    document.body.classList.remove('fullscreen');
    document.querySelector('.gameboy')?.classList.remove('fullscreen');
    
    // Restore scrolling
    document.body.style.overflow = '';
    
    // If native fullscreen API is supported, use it too
    if (document.fullscreenElement) {
      document.exitFullscreen()
        .catch(err => {
          console.error(`Error attempting to exit fullscreen: ${err.message}`);
        });
    }
  };

  // If menu is not visible, don't render anything
  if (!isVisible) return null;

  return (
    <div className="settings-menu absolute inset-0 bg-[#8bac0f] z-50 flex flex-col items-center justify-center px-4 font-[DOTMATRIX]">
      <h2 className="text-2xl mb-6">SETTINGS</h2>
      
      <div className="menu-options w-full max-w-[90%] space-y-4">
        {menuOptions.map((option, index) => (
          <div 
            key={option.id} 
            className={`menu-option flex justify-between items-center px-2 py-1 ${selectedOption === index ? 'bg-[#2c3e50] bg-opacity-20' : ''}`}
          >
            <span>{option.label}</span>
            {option.type === 'toggle' && (
              <div className="flex space-x-2">
                {option.id === 'gravityControl' || option.id === 'fullscreen' ? (
                  <>
                    <span className={`${selectedOption === index && selectedTogglePosition === 'left' ? 'cursor-highlight' : ''}`}>YES</span>
                    <span>/</span>
                    <span className={`${selectedOption === index && selectedTogglePosition === 'right' ? 'cursor-highlight' : ''}`}>NO</span>
                  </>
                ) : null}
              </div>
            )}
            {option.type === 'select' && (
              <div className="flex space-x-2">
                <span className={`${selectedOption === index && selectedAuthorPosition === 'left' ? 'cursor-highlight' : ''}`}>GITHUB</span>
                <span>/</span>
                <span className={`${selectedOption === index && selectedAuthorPosition === 'right' ? 'cursor-highlight' : ''}`}>X</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-8 text-xs text-center">
        UP/DOWN/LEFT/RIGHT: MOVE CURSOR, A: CONFIRM, B: BACK
      </div>
    </div>
  );
}); 