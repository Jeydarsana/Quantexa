import { Component, type ReactNode, type ErrorInfo } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import StrategyDNA from './pages/StrategyDNA';
import StrategyLab from './pages/StrategyLab';
import MarketAnalysis from './pages/MarketAnalysis';
import CrossAsset from './pages/CrossAsset';
import MarketRegimes from './pages/MarketRegimes';
import Overview from './pages/Overview';
import Robustness from './pages/Robustness';
import Intelligence from './pages/Intelligence';
import PlaceholderPage from './pages/PlaceholderPage';
import { useMode } from './contexts/ModeContext';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-2xl bg-surface border border-danger/40 text-text max-w-2xl mx-auto my-12 space-y-4 shadow-2xl">
          <div className="flex items-center gap-3 text-danger">
            <h2 className="text-xl font-bold">Rendering Diagnostic Encountered</h2>
          </div>
          <p className="text-sm text-textMuted">
            A rendering issue occurred. Here are the technical details:
          </p>
          <pre className="p-4 bg-background rounded-lg text-xs font-mono text-danger/90 overflow-x-auto whitespace-pre-wrap">
            {this.state.error?.message || 'Unknown error'}
            {'\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = '/strategy-dna';
            }}
            className="px-4 py-2 bg-primary hover:bg-primaryHover text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            Reset to Strategy DNA
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const tabs = [
    { name: 'Strategy DNA', path: '/strategy-dna', featured: true },
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
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-indigo-500 to-secondary flex items-center justify-center shadow-lg shadow-primary/25">
                <span className="text-white font-black text-xl">Q</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-gray-400">
                    QuantLens
                  </h1>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                    Platform v3.0
                  </span>
                </div>
                <p className="text-[11px] text-textMuted hidden sm:block">
                  Investment Analysis & Portfolio Simulation Platform
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-textMuted flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full border border-border mr-4 border-r pr-4">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                <span>Active</span>
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
            <nav className="flex space-x-6 overflow-x-auto overflow-y-hidden hide-scrollbar">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.name}
                  to={tab.path}
                  className={({ isActive }) =>
                    `whitespace-nowrap py-3.5 px-1 border-b-2 font-medium text-sm transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'border-primary text-primary font-bold'
                        : 'border-transparent text-textMuted hover:text-text hover:border-border'
                    }`
                  }
                >
                  {tab.name}
                  {tab.featured && (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-primary/20 text-primary font-semibold">
                      New
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Navigate to="/strategy-dna" replace />} />
              <Route path="/strategy-dna" element={<StrategyDNA />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/market-analysis" element={<MarketAnalysis />} />
              <Route path="/cross-asset" element={<CrossAsset />} />
              <Route path="/strategy-lab" element={<StrategyLab />} />
              <Route path="/robustness" element={<Robustness />} />
              <Route path="/regimes" element={<MarketRegimes />} />
              <Route path="/intelligence" element={<Intelligence />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
