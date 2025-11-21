import React, { useState } from 'react';
import { PropPrediction } from '../types';

interface BetSlipProps {
  selectedProps: PropPrediction[];
  onRemove: (prop: PropPrediction) => void;
}

const BetSlip: React.FC<BetSlipProps> = ({ selectedProps, onRemove }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (selectedProps.length === 0) return null;

  // Simulated odds calculation (Assuming standard -110 juice -> 1.91 decimal)
  const calculateOdds = () => {
     const decimal = Math.pow(1.91, selectedProps.length);
     const american = decimal >= 2 
        ? `+${Math.round((decimal - 1) * 100)}` 
        : `-${Math.round(100 / (decimal - 1))}`;
     return american;
  };

  const handleCopy = () => {
    const text = `🏆 COURTSIDE IQ SLIP 🏆\n\n` + 
    selectedProps.map(p => `${p.player} ${p.prediction} ${p.line} ${p.stat}`).join('\n') +
    `\n\nEst. Odds: ${calculateOdds()}`;
    
    navigator.clipboard.writeText(text);
    alert("Slip copied to clipboard!");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 flex justify-center pointer-events-none">
      <div className="bg-slate-900 border border-neon-blue/30 shadow-[0_0_30px_rgba(0,240,255,0.15)] rounded-2xl w-full max-w-md overflow-hidden pointer-events-auto transition-all duration-300">
        {/* Header */}
        <div 
            className="bg-slate-800 p-3 flex justify-between items-center cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
        >
            <div className="flex items-center space-x-2">
                <div className="bg-neon-blue text-black text-xs font-bold px-2 py-0.5 rounded-full">
                    {selectedProps.length}
                </div>
                <span className="text-white font-bold font-sans">Active Slip</span>
            </div>
            <div className="flex items-center space-x-3">
                <span className="text-neon-green font-mono font-bold">{calculateOdds()}</span>
                <svg className={`w-4 h-4 text-slate-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
            </div>
        </div>

        {/* List */}
        <div className={`transition-[max-height] duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-64 overflow-y-auto' : 'max-h-0'}`}>
            <div className="p-3 space-y-2">
                {selectedProps.map((prop, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-950/50 p-2 rounded border border-slate-800 text-xs">
                        <div>
                            <span className="text-white font-bold block">{prop.player}</span>
                            <span className={`${prop.prediction === 'OVER' ? 'text-neon-green' : 'text-neon-red'}`}>
                                {prop.prediction} {prop.line}
                            </span> <span className="text-slate-500">{prop.stat}</span>
                        </div>
                        <button onClick={() => onRemove(prop)} className="text-slate-500 hover:text-white p-1">
                             ✕
                        </button>
                    </div>
                ))}
            </div>
            <div className="p-3 bg-slate-900 border-t border-slate-800">
                <button 
                    onClick={handleCopy}
                    className="w-full bg-neon-blue hover:bg-blue-400 text-black font-bold py-2 rounded font-mono text-sm transition-colors"
                >
                    COPY SLIP TO CLIPBOARD
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BetSlip;