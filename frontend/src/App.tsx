import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import StrategyLab from './pages/StrategyLab';
import MarketAnalysis from './pages/MarketAnalysis';
import CrossAsset from './pages/CrossAsset';
import MarketRegimes from './pages/MarketRegimes';
import Overview from './pages/Overview';
import Robustness from './pages/Robustness';
import Intelligence from './pages/Intelligence';
import PlaceholderPage from './pages/PlaceholderPage';
import { useMode } from './contexts/ModeContext';

function App() {
  const tabs = [
    { name: 'Overview', path: '/overview' },
    { name: 'Market Analysis', path: '/market-analysis' },
    { name: 'Cross-Asset', path: '/cross-asset' },
    { name: 'Strategy Lab', path: '/strategy-lab' },
    { name: 'Robustness', path: '/robustness' },
    { name: 'Regimes', path: '/regimes' },
    { name: 'Intelligence', path: '/intelligence' },
  ];

  const { isSimpleMode, toggleMode } = useMode();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-white font-bold text-xl">Q</span>
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                QuantLens
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-textMuted flex items-center gap-2 mr-4 border-r border-border pr-4">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                API Connected
              </div>
              
              {/* Mode Toggle */}
              <div className="flex items-center gap-2 bg-surface border border-border rounded-full p-1">
                <button 
                  onClick={() => !isSimpleMode && toggleMode()}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${!isSimpleMode ? 'bg-primary text-white' : 'text-textMuted hover:text-white'}`}
                >
                  Expert
                </button>
                <button 
                  onClick={() => isSimpleMode && toggleMode()}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${isSimpleMode ? 'bg-secondary text-background' : 'text-textMuted hover:text-white'}`}
                >
                  Jargon Free
                </button>
              </div>
            </div>
          </div>
          
          {/* Tabs Navigation */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8 overflow-x-auto overflow-y-hidden hide-scrollbar">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.name}
                  to={tab.path}
                  className={({ isActive }) =>
                    `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-textMuted hover:text-text hover:border-border'
                    }`
                  }
                >
                  {tab.name}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/strategy-lab" replace />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/market-analysis" element={<MarketAnalysis />} />
            <Route path="/cross-asset" element={<CrossAsset />} />
            <Route path="/strategy-lab" element={<StrategyLab />} />
            <Route path="/robustness" element={<Robustness />} />
            <Route path="/regimes" element={<MarketRegimes />} />
            <Route path="/intelligence" element={<Intelligence />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
