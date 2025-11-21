import React, { useState } from 'react';
import { getUpcomingGames, analyzeGameProps } from './services/geminiService';
import { Game, ViewState, AnalysisResult, PropPrediction } from './types';
import ThinkingVisualizer from './components/ThinkingVisualizer';
import GameCard from './components/GameCard';
import PropCard from './components/PropCard';
import BetSlip from './components/BetSlip';
import GameContext from './components/GameContext';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>(ViewState.HOME);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [filter, setFilter] = useState<'OVER' | 'UNDER' | 'ALL'>('ALL');
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [slip, setSlip] = useState<PropPrediction[]>([]);

  const handleEnter = async () => {
    setViewState(ViewState.LOADING_GAMES);
    setLoadingMessage("Scanning NBA schedule via Google Search...");
    try {
      const fetchedGames = await getUpcomingGames();
      setGames(fetchedGames);
      setViewState(ViewState.SELECT_GAME);
    } catch (e) {
      console.error(e);
      // Fallback manual if search fails completely
      setGames([]);
      setViewState(ViewState.SELECT_GAME);
    }
  };

  const handleSelectGame = async (game: Game) => {
    setSelectedGame(game);
    setViewState(ViewState.ANALYZING);
    setLoadingMessage(`Initializing 7-Point Deep Dive Protocol for ${game.awayTeam} vs ${game.homeTeam}...`);
    
    try {
      const result = await analyzeGameProps(game, filter);
      setAnalysisResult(result);
      setViewState(ViewState.RESULTS);
    } catch (e) {
      console.error(e);
      setViewState(ViewState.SELECT_GAME);
      alert("Analysis failed. Please try again. The AI might be overloaded.");
    }
  };

  const handleBack = () => {
      setAnalysisResult(null);
      setSlip([]); // Clear slip on back or keep it? Let's clear for now to avoid confusion between games
      setViewState(ViewState.SELECT_GAME);
  };

  const toggleSlip = (prop: PropPrediction) => {
      setSlip(prev => {
          const exists = prev.find(p => p.player === prop.player && p.stat === prop.stat);
          if (exists) {
              return prev.filter(p => p !== exists);
          }
          return [...prev, prop];
      });
  };

  return (
    <div className="min-h-screen bg-court-black text-slate-200 font-sans selection:bg-neon-blue selection:text-black pb-20">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-neon-blue/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-neon-orange/5 rounded-full blur-[100px]"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6 h-screen flex flex-col">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setViewState(ViewState.HOME)}>
             <div className="w-8 h-8 bg-gradient-to-br from-neon-blue to-blue-700 rounded-md flex items-center justify-center">
                 <span className="font-bold text-black font-mono">IQ</span>
             </div>
             <h1 className="text-2xl font-bold tracking-tight text-white">COURTSIDE <span className="text-neon-blue font-light">IQ</span></h1>
          </div>
          {viewState === ViewState.RESULTS && (
             <div className="flex space-x-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
                {(['ALL', 'OVER', 'UNDER'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => {
                            setFilter(f);
                        }}
                        className={`px-4 py-1 rounded text-xs font-mono transition-all ${filter === f ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        {f}
                    </button>
                ))}
             </div>
          )}
        </header>

        {/* Content Area */}
        <main className="flex-grow flex flex-col">
          
          {/* HOME VIEW */}
          {viewState === ViewState.HOME && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-[fadeIn_0.5s]">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-neon-blue to-neon-orange opacity-20 blur-xl animate-pulse"></div>
                <h2 className="relative text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
                  BEAT THE <br/> BOOKS.
                </h2>
              </div>
              <p className="text-slate-400 max-w-lg text-lg font-light leading-relaxed">
                Leveraging <span className="text-neon-blue">Gemini 3.0 Thinking</span> & <span className="text-neon-orange">Real-Time Search</span> to execute a 7-point deep dive protocol on every NBA matchup.
              </p>
              <button 
                onClick={handleEnter}
                className="group relative px-8 py-4 bg-white text-black font-bold font-mono tracking-wider text-sm hover:bg-neon-blue transition-colors duration-300 overflow-hidden"
              >
                <span className="relative z-10 group-hover:text-white transition-colors">ENTER SHARPSHOOTER MODE</span>
                <div className="absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-0"></div>
              </button>
            </div>
          )}

          {/* LOADING VIEW */}
          {(viewState === ViewState.LOADING_GAMES || viewState === ViewState.ANALYZING) && (
            <ThinkingVisualizer message={loadingMessage} />
          )}

          {/* GAME SELECTION VIEW */}
          {viewState === ViewState.SELECT_GAME && (
            <div className="space-y-6 animate-[slideUp_0.5s]">
              <div className="flex justify-between items-end">
                <h2 className="text-2xl font-bold text-white">Select Matchup</h2>
                <span className="text-neon-green text-xs font-mono animate-pulse">● LIVE SCHEDULE UPDATED</span>
              </div>
              
              {games.length === 0 ? (
                 <div className="text-center py-20 border border-dashed border-slate-800 rounded-xl">
                    <p className="text-slate-500">No games found for today/tomorrow.</p>
                    <button onClick={handleEnter} className="mt-4 text-neon-blue hover:underline">Retry Search</button>
                 </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {games.map((game) => (
                    <GameCard key={game.id} game={game} onSelect={handleSelectGame} />
                    ))}
                </div>
              )}
            </div>
          )}

          {/* RESULTS VIEW */}
          {viewState === ViewState.RESULTS && analysisResult && (
            <div className="space-y-6 animate-[fadeIn_0.5s] pb-24">
              <div className="flex items-center space-x-4 mb-2">
                <button onClick={handleBack} className="text-slate-500 hover:text-white transition-colors">
                    ← Back
                </button>
                <h2 className="text-xl font-bold text-white">
                    {analysisResult.game.awayTeam} @ {analysisResult.game.homeTeam}
                </h2>
              </div>

              <GameContext context={analysisResult.marketContext} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analysisResult.props
                    .filter(p => filter === 'ALL' || p.prediction === filter)
                    .map((prop, idx) => (
                    <PropCard 
                        key={idx} 
                        prop={prop} 
                        index={idx} 
                        onAdd={toggleSlip}
                        isSelected={slip.some(p => p.player === prop.player && p.stat === prop.stat)}
                    />
                ))}
              </div>

              {analysisResult.props.filter(p => filter === 'ALL' || p.prediction === filter).length === 0 && (
                  <div className="text-center py-20 text-slate-500 font-mono">
                      No {filter} props identified with high confidence.
                  </div>
              )}

              {/* Sources Footer */}
              <div className="mt-12 pt-6 border-t border-slate-900">
                <h4 className="text-xs font-mono text-slate-600 uppercase mb-3">Verified Sources</h4>
                <div className="flex flex-wrap gap-2">
                    {analysisResult.sources.map((source, i) => (
                        <a 
                            key={i} 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] bg-slate-900 text-slate-500 px-2 py-1 rounded hover:text-neon-blue hover:bg-slate-800 transition-colors truncate max-w-[200px]"
                        >
                            {source.title}
                        </a>
                    ))}
                </div>
              </div>
            </div>
          )}
          
          {/* BET SLIP COMPONENT */}
          {viewState === ViewState.RESULTS && (
              <BetSlip selectedProps={slip} onRemove={toggleSlip} />
          )}

        </main>
      </div>
    </div>
  );
};

export default App;