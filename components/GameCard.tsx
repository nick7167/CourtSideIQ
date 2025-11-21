import React from 'react';
import { Game } from '../types';

interface GameCardProps {
  game: Game;
  onSelect: (game: Game) => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(game)}
      className="group relative w-full text-left transition-all duration-300 hover:scale-[1.02]"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-blue to-neon-orange opacity-20 group-hover:opacity-100 transition duration-500 blur rounded-xl"></div>
      <div className="relative glass-panel rounded-xl p-6 h-full flex flex-col justify-between hover:bg-slate-900/80 transition-colors">
        <div className="flex justify-between items-start mb-4">
            <span className="bg-slate-800 text-slate-400 text-xs font-mono px-2 py-1 rounded border border-slate-700">
                {game.date} • {game.time}
            </span>
            <div className="h-2 w-2 rounded-full bg-neon-green animate-pulse"></div>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white font-sans">{game.awayTeam}</h3>
            <span className="text-slate-500 text-sm font-mono">@</span>
          </div>
          <div className="flex justify-between items-center">
             <h3 className="text-xl font-bold text-white font-sans">{game.homeTeam}</h3>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center opacity-60 group-hover:opacity-100 transition-opacity">
            <span className="text-xs font-mono text-neon-blue">INITIATE DEEP DIVE</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neon-blue transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
        </div>
      </div>
    </button>
  );
};

export default GameCard;
