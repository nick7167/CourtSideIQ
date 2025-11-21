import React, { useState } from 'react';

interface TrendChartProps {
  data: number[]; // Expecting [oldest, ..., newest]
  line: number;
  prediction: 'OVER' | 'UNDER';
}

const TrendChart: React.FC<TrendChartProps> = ({ data = [], line, prediction }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Fallback if data is missing
  if (!data || data.length === 0) {
    return <div className="h-32 flex items-center justify-center text-xs text-slate-600 font-mono">No Trend Data Available</div>;
  }

  // Chart Dimensions
  const width = 100;
  const height = 50;
  const padding = 5;

  // Calculate Scales
  const maxVal = Math.max(...data, line) * 1.1; // Add 10% headroom
  const minVal = Math.min(...data, line) * 0.9; // Add 10% floor
  const range = maxVal - minVal || 1; // Avoid divide by zero

  const getY = (val: number) => height - padding - ((val - minVal) / range) * (height - (padding * 2));
  const getX = (index: number) => padding + (index / (data.length - 1)) * (width - (padding * 2));

  // Generate Path points
  const points = data.map((val, i) => `${getX(i)},${getY(val)}`).join(' ');

  // Area Path (closes the loop for gradient fill)
  const areaPoints = `${getX(0)},${height} ${points} ${getX(data.length - 1)},${height}`;

  const lineY = getY(line);
  const isOver = prediction === 'OVER';
  const mainColor = isOver ? '#00ff9d' : '#ff2a6d'; // neon-green : neon-red

  return (
    <div className="w-full h-40 bg-slate-900/50 rounded-lg border border-slate-800 p-3 relative overflow-hidden group">
      {/* Header Info */}
      <div className="flex justify-between items-end mb-2">
        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">L5 Performance Trend</span>
        {hoverIndex !== null ? (
            <div className="text-xs font-bold font-mono text-white animate-pulse">
                GAME {5 - (data.length - 1 - hoverIndex)}: <span className="text-neon-blue">{data[hoverIndex]}</span>
            </div>
        ) : (
            <div className="text-xs font-mono text-slate-500">Hover for Details</div>
        )}
      </div>

      {/* SVG Chart */}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible preserve-3d">
        <defs>
          <linearGradient id={`grad-${prediction}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={mainColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={mainColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Betting Line (Dashed) */}
        <line 
            x1="0" 
            y1={lineY} 
            x2={width} 
            y2={lineY} 
            stroke="white" 
            strokeWidth="0.5" 
            strokeDasharray="2,2" 
            opacity="0.5" 
        />
        <text x={width + 2} y={lineY + 1} fontSize="3" fill="white" opacity="0.7" fontFamily="monospace">
            {line}
        </text>

        {/* Area Fill */}
        <polygon points={areaPoints} fill={`url(#grad-${prediction})`} />

        {/* Trend Line */}
        <polyline 
            points={points} 
            fill="none" 
            stroke={mainColor} 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="drop-shadow-[0_0_5px_rgba(0,0,0,0.5)]"
        />

        {/* Data Points */}
        {data.map((val, i) => {
            const x = getX(i);
            const y = getY(val);
            const isHit = isOver ? val > line : val < line;
            
            return (
                <g key={i} onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}>
                    {/* Invisible Interaction Area */}
                    <circle cx={x} cy={y} r="4" fill="transparent" className="cursor-crosshair" />
                    
                    {/* Visible Dot */}
                    <circle 
                        cx={x} 
                        cy={y} 
                        r={hoverIndex === i ? 2.5 : 1.5} 
                        fill={isHit ? mainColor : '#64748b'} // Gray if missed, Color if hit
                        stroke="#0a0a0c"
                        strokeWidth="0.5"
                        className="transition-all duration-200"
                    />
                </g>
            );
        })}
      </svg>
    </div>
  );
};

export default TrendChart;