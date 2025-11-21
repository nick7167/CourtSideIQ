import React, { useState } from 'react';
import { PropPrediction } from '../types';

const PropCard: React.FC<{ prop: PropPrediction; index: number }> = ({ prop, index }) => {
  const [expanded, setExpanded] = useState(false);
  const isOver = prop.prediction === 'OVER';
  const colorClass = isOver ? 'text-neon-green' : 'text-neon-red';
  const borderClass = isOver ? 'border-neon-green/30' : 'border-neon-red/30';
  const bgClass = isOver ? 'from-neon-green/5' : 'from-neon-red/5';

  return (
    <div 
        className={`glass-panel rounded-xl overflow-hidden transition-all duration-500 hover:border-slate-500 ${borderClass}`}
        style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header */}
      <div 
        className={`p-5 bg-gradient-to-r ${bgClass} to-transparent cursor-pointer`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-start">
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

        <div className="mt-4 flex items-center justify-between">
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
           <span className="text-xs text-slate-500 underline decoration-slate-700 underline-offset-4">
              {expanded ? 'HIDE INTEL' : 'VIEW INTEL'}
           </span>
        </div>
      </div>

      {/* Expanded Content */}
      <div className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${expanded ? 'max-h-[500px]' : 'max-h-0'}`}>
        <div className="p-5 border-t border-slate-800 bg-black/20 text-sm space-y-4">
            
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
