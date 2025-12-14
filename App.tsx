import React, { useState } from 'react';
import Game from './components/Game';
import LevelGenerator from './components/LevelGenerator';
import { GRID_SIZE } from './constants';
import { TileType } from './types';

// Helper to create a default level if none generated
const createDefaultLevel = () => {
  const grid = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(TileType.EMPTY));

  // Outer Walls
  for(let i=0; i<GRID_SIZE; i++) {
    grid[0][i] = TileType.STEEL;
    grid[GRID_SIZE-1][i] = TileType.STEEL;
    grid[i][0] = TileType.STEEL;
    grid[i][GRID_SIZE-1] = TileType.STEEL;
  }

  // Base Defense (The Eagle)
  const mid = Math.floor(GRID_SIZE / 2);
  grid[GRID_SIZE-2][mid] = TileType.BASE;
  grid[GRID_SIZE-2][mid-1] = TileType.BRICK;
  grid[GRID_SIZE-2][mid+1] = TileType.BRICK;
  grid[GRID_SIZE-3][mid] = TileType.BRICK;
  grid[GRID_SIZE-3][mid-1] = TileType.BRICK;
  grid[GRID_SIZE-3][mid+1] = TileType.BRICK;

  // Random obstacles for default map
  for(let i=0; i<50; i++) {
      const rx = Math.floor(Math.random() * (GRID_SIZE-2)) + 1;
      const ry = Math.floor(Math.random() * (GRID_SIZE-4)) + 2; // Don't block spawn too much
      // Avoid base area
      if (Math.abs(rx - mid) < 3 && ry > GRID_SIZE - 5) continue;
      
      grid[ry][rx] = Math.random() > 0.8 ? TileType.STEEL : TileType.BRICK;
  }

  return grid;
};

const App: React.FC = () => {
  const [levelGrid, setLevelGrid] = useState<number[][]>(createDefaultLevel());
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);

  const handleLevelGenerated = (grid: number[][]) => {
    setLevelGrid(grid);
    setGameState('playing');
  };

  const handleGameOver = (finalScore: number, win: boolean) => {
    setScore(finalScore);
    setGameState('gameover');
  };

  const startDefaultGame = () => {
    setLevelGrid(createDefaultLevel());
    setGameState('playing');
  };

  const backToMenu = () => {
    setGameState('menu');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl md:text-5xl text-yellow-500 mb-6 font-bold tracking-widest drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]" style={{ textShadow: '4px 4px 0 #000' }}>
        TANK BATTALION AI
      </h1>

      {gameState === 'menu' && (
        <div className="flex flex-col items-center w-full max-w-2xl animate-fade-in">
           <LevelGenerator onLevelGenerated={handleLevelGenerated} />
           
           <div className="mt-8 flex gap-4">
             <button 
               onClick={startDefaultGame}
               className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all shadow-lg font-bold"
             >
               PLAY CLASSIC MODE
             </button>
           </div>

           <div className="mt-8 text-gray-400 text-xs max-w-md text-center leading-relaxed bg-black/30 p-4 rounded border border-gray-700">
              <p className="text-yellow-200 mb-2 font-bold underline">MISSION BRIEFING:</p>
              <p>COMMANDER! Hostile tanks are approaching.</p>
              <p>1. Use <span className="text-white">WASD</span> or <span className="text-white">ARROWS</span> to maneuver.</p>
              <p>2. Press <span className="text-white">SPACE</span> to fire.</p>
              <p>3. Defend the <span className="text-purple-400">EAGLE BASE</span> at all costs.</p>
              <p>4. Destroy all enemy armor.</p>
           </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="flex flex-col items-center">
            <Game levelGrid={levelGrid} onGameOver={handleGameOver} />
            <button 
                onClick={() => setGameState('menu')}
                className="mt-4 text-gray-500 hover:text-white text-xs underline"
            >
                ABORT MISSION (Return to Menu)
            </button>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="text-center flex flex-col items-center bg-gray-800 p-10 rounded-xl border-4 border-red-900 shadow-2xl">
           <h2 className="text-5xl text-red-600 mb-6 font-bold" style={{ textShadow: '2px 2px 0 #000' }}>GAME OVER</h2>
           <p className="text-2xl text-white mb-8">FINAL SCORE: <span className="text-yellow-400">{score}</span></p>
           
           <div className="w-full h-1 bg-gray-700 mb-8"></div>

           <button 
             onClick={backToMenu}
             className="bg-yellow-500 hover:bg-yellow-600 text-black py-4 px-8 rounded font-bold border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 transition-all"
           >
             RETURN TO BASE
           </button>
        </div>
      )}
    </div>
  );
};

export default App;