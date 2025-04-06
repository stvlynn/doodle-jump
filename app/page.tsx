'use client'

import { GameProvider } from '@/components/GameProvider'
import { DoodleJump } from '@/components/DoodleJump'
import { GameBoy } from '@/components/GameBoy'
import GameFooter from '@/components/GameFooter'
import { useRef } from 'react'

export default function Home() {
  // 创建DoodleJump的ref
  const doodleJumpRef = useRef<any>(null);
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-[#88d0ff]">
      <div className="w-full max-w-[90vh] flex flex-col items-center">
        <GameProvider>
          <GameBoy>
            <DoodleJump ref={doodleJumpRef} />
          </GameBoy>
          <GameFooter />
        </GameProvider>
      </div>
    </main>
  );
}
