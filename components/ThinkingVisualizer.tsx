import React from 'react';

const ThinkingVisualizer: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 p-8">
      <div className="relative">
        {/* Outer Ring */}
        <div className="w-32 h-32 rounded-full border-4 border-slate-800 border-t-neon-blue animate-spin"></div>
        
        {/* Inner Ring */}
        <div className="absolute top-2 left-2 w-28 h-28 rounded-full border-4 border-slate-800 border-b-neon-orange animate-[spin_1.5s_linear_infinite_reverse]"></div>
        
        {/* Core */}
        <div className="absolute top-0 left-0 w-32 h-32 flex items-center justify-center">
            <div className="w-16 h-16 bg-neon-blue/10 rounded-full animate-pulse blur-xl"></div>
        </div>
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold font-sans text-white tracking-widest animate-pulse">
          PROTOCOL ENGAGED
        </h3>
        <p className="text-neon-blue font-mono text-sm max-w-xs mx-auto">
          {message}
        </p>
        
        <div className="flex flex-col space-y-1 mt-4 text-xs text-gray-500 font-mono text-left w-64 mx-auto opacity-70">
            <span className="animate-[fade_2s_infinite]">Scanning Beat Writers...</span>
            <span className="animate-[fade_2s_infinite_200ms]">Analyzing Referee Crew...</span>
            <span className="animate-[fade_2s_infinite_400ms]">Detecting Sharp Money...</span>
            <span className="animate-[fade_2s_infinite_600ms]">Reviewing Defensive Schemes...</span>
        </div>
      </div>
    </div>
  );
};

export default ThinkingVisualizer;
