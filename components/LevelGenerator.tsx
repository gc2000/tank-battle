import React, { useState } from 'react';
import { generateLevel } from '../services/geminiService';

interface LevelGeneratorProps {
  onLevelGenerated: (grid: number[][]) => void;
}

const LevelGenerator: React.FC<LevelGeneratorProps> = ({ onLevelGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    try {
      const grid = await generateLevel(prompt);
      onLevelGenerated(grid);
    } catch (err) {
      setError('Failed to generate level. Please check API Key or try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-gray-800 p-6 rounded-lg border-4 border-gray-700 shadow-xl mb-6">
      <h2 className="text-xl text-yellow-500 mb-4 text-center">AI BATTLEFIELD ARCHITECT</h2>
      <form onSubmit={handleGenerate} className="flex flex-col gap-4">
        <div className="relative">
            <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: 'A maze with a lot of water and steel walls protecting the base' or 'Open field with scatter bricks'"
            className="w-full h-24 bg-gray-900 border-2 border-gray-600 text-green-400 p-3 focus:outline-none focus:border-green-500 font-mono text-sm resize-none rounded"
            />
            {loading && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-green-500 animate-pulse">
                    GENERATING...
                </div>
            )}
        </div>
        
        {error && <p className="text-red-500 text-xs">{error}</p>}

        <button
          type="submit"
          disabled={loading || !prompt}
          className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all font-bold uppercase tracking-wider"
        >
          Generate Level
        </button>
      </form>
      <div className="mt-4 text-xs text-gray-500 text-center">
        Powered by Gemini 2.5 Flash
      </div>
    </div>
  );
};

export default LevelGenerator;
