import { GameProvider } from '@/components/GameProvider'
import { DoodleJump } from '@/components/DoodleJump'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8">
      <div className="flex flex-col items-center w-full max-w-md">
        <h1 className="text-4xl font-bold mb-8">Doodle Jump</h1>
        <GameProvider>
          <DoodleJump />
        </GameProvider>
      </div>
    </main>
  );
}
