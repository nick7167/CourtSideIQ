import React, { useState } from 'react';
import { PropPrediction } from '../types';
import TrendChart from './TrendChart';

interface PropCardProps {
    prop: PropPrediction;
    index: number;
    onAdd: (prop: PropPrediction) => void;
    isSelected: boolean;
}

const PropCard: React.FC<PropCardProps> = ({ prop, index, onAdd, isSelected }) => {
  const [expanded, setExpanded] = useState(false);
  const isOver = prop.prediction === 'OVER';
  const colorClass = isOver ? 'text-neon-green' : 'text-neon-red';
  const borderClass = isOver ? 'border-neon-green/30' : 'border-neon-red/30';
  const bgClass = isOver ? 'from-neon-green/5' : 'from-neon-red/5';

  return (
    <div 
        className={`glass-panel rounded-xl overflow-hidden transition-all duration-500 hover:border-slate-500 relative ${borderClass}`}
        style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Selection Indicator */}
      <button 
        onClick={(e) => {
            e.stopPropagation();
            onAdd(prop);
        }}
        className={`absolute top-3 right-3 z-20 p-2 rounded-full transition-all ${isSelected ? 'bg-neon-blue text-black scale-110 shadow-[0_0_10px_#00f0ff]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
      >
         {isSelected ? (
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
         ) : (
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
         )}
      </button>

      {/* Header */}
      <div 
        className={`p-5 bg-gradient-to-r ${bgClass} to-transparent cursor-pointer`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-start pr-10">
          <div>
             <h4 className="text-sm text-slate-400 font-mono mb-1">{prop.team}</h4>
             <h3 className="text-xl font-bold text-white font-sans">{prop.player}</h3>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-black font-mono ${colorClass}`}>
                {prop.prediction} {prop.line}
            </div>
            <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">{prop.stat}</div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center space-x-4 mt-4 mb-2">
             {prop.last5History && (
                 <div className="flex items-center space-x-2 bg-black/30 px-2 py-1 rounded border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">L5 Trend</span>
                    <span className={`text-xs font-bold font-mono ${
                        (isOver && parseInt(prop.last5History) >= 3) || (!isOver && parseInt(prop.last5History) <= 2) 
                        ? 'text-neon-green' : 'text-orange-400'
                    }`}>
                        {prop.last5History}
                    </span>
                 </div>
             )}
             <div className="flex items-center space-x-2 bg-black/30 px-2 py-1 rounded border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Avg L5</span>
                <span className="text-xs font-bold text-white font-mono">{prop.averageLast5}</span>
             </div>
        </div>

        <div className="mt-2 flex items-center justify-between">
           <div className="flex items-center space-x-2">
                <div className="flex space-x-0.5">
                    {[...Array(10)].map((_, i) => (
                        <div 
                            key={i} 
                            className={`h-1.5 w-1.5 rounded-full ${i < prop.confidence ? (isOver ? 'bg-neon-green' : 'bg-neon-red') : 'bg-slate-800'}`}
                        ></div>
                    ))}
                </div>
                <span className="text-xs text-slate-400 font-mono">CONFIDENCE {prop.confidence}/10</span>
           </div>
           <span className="text-xs text-slate-500 underline decoration-slate-700 underline-offset-4 hover:text-neon-blue transition-colors">
              {expanded ? 'HIDE INTEL' : 'VIEW INTEL'}
           </span>
        </div>
      </div>

      {/* Expanded Content */}
      <div className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${expanded ? 'max-h-[800px]' : 'max-h-0'}`}>
        <div className="p-5 border-t border-slate-800 bg-black/20 text-sm space-y-4">
            
            {/* Visualizations */}
            <div className="grid grid-cols-1 gap-4">
                <TrendChart data={prop.last5Values} line={prop.line} prediction={prop.prediction} />
                
                {prop.opponentRank && (
                    <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded border border-slate-800">
                        <span className="text-slate-500 text-xs uppercase font-mono">Matchup Difficulty</span>
                        <div className="text-right">
                            <span className="text-white font-bold text-sm font-mono">{prop.opponentRank}</span>
                            <span className="text-slate-600 text-[10px] block uppercase">Opponent vs Position</span>
                        </div>
                    </div>
                )}
            </div>

            <div>
                <span className="text-neon-blue font-mono text-xs uppercase block mb-1">Deep Dive Rationale</span>
                <p className="text-slate-300 leading-relaxed">{prop.rationale}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prop.protocolAnalysis.refereeFactor && (
                    <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
                        <span className="text-slate-500 text-xs uppercase block mb-1">Whistle Factor</span>
                        <p className="text-slate-200">{prop.protocolAnalysis.refereeFactor}</p>
                    </div>
                )}
                 {prop.protocolAnalysis.sharpMoney && (
                    <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
                        <span className="text-slate-500 text-xs uppercase block mb-1">Vegas Trap</span>
                        <p className="text-slate-200">{prop.protocolAnalysis.sharpMoney}</p>
                    </div>
                )}
                 {prop.protocolAnalysis.schemeMismatch && (
                    <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
                        <span className="text-slate-500 text-xs uppercase block mb-1">Scheme War</span>
                        <p className="text-slate-200">{prop.protocolAnalysis.schemeMismatch}</p>
                    </div>
                )}
            </div>

            <div className="p-3 bg-neon-blue/5 border border-neon-blue/20 rounded">
                 <span className="text-neon-blue text-xs uppercase font-bold block mb-1">THE X-FACTOR</span>
                 <p className="text-white font-medium">{prop.xFactor}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PropCard;