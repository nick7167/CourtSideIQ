import React from 'react';
import { MarketContext } from '../types';

interface GameContextProps {
    context: MarketContext;
}

const GameContext: React.FC<GameContextProps> = ({ context }) => {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex space-x-8">
            <div className="text-center">
                <div className="text-xs text-slate-500 font-mono uppercase">Spread</div>
                <div className="text-white font-bold font-sans text-lg">{context.spread}</div>
            </div>
            <div className="text-center">
                <div className="text-xs text-slate-500 font-mono uppercase">Total</div>
                <div className="text-white font-bold font-sans text-lg">{context.total}</div>
            </div>
        </div>
        
        <div className="flex-1 border-l border-slate-800 pl-0 md:pl-6 w-full md:w-auto">
             <div className="text-xs text-neon-orange font-mono uppercase mb-1 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                Sharp Action Report
             </div>
             <p className="text-sm text-slate-300 italic">"{context.summary}"</p>
        </div>
    </div>
  );
};

export default GameContext;