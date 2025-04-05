import { GameProvider } from '@/components/GameProvider'
import { DoodleJump } from '@/components/DoodleJump'
import { GameBoy } from '@/components/GameBoy'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-[#88d0ff]">
      <div className="w-full max-w-[90vh] flex justify-center">
        <GameProvider>
          <GameBoy>
            <DoodleJump />
          </GameBoy>
        </GameProvider>
      </div>
    </main>
  );
}
