import { Activity, Globe, Cpu, Layers, HelpCircle } from "lucide-react";

interface NavigationProps {
  currentTab: 'landing' | 'dashboard' | 'ai-lab';
  setTab: (tab: 'landing' | 'dashboard' | 'ai-lab') => void;
  isAiResponding?: boolean;
}

export default function Navigation({ currentTab, setTab, isAiResponding = false }: NavigationProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0A0C14]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div 
          onClick={() => setTab('landing')}
          className="flex cursor-pointer items-center space-x-3 transition-opacity hover:opacity-90"
          id="nav-logo"
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 p-[1.5px] shadow-lg shadow-blue-500/10">
            <div className="flex h-full w-full items-center justify-center rounded-[7px] bg-[#0A0C14]">
              <Layers className="h-4.5 w-4.5 text-blue-400 animate-pulse animate-duration-1000" />
            </div>
            {/* Pulsing indicator */}
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-450"></span>
            </span>
          </div>
          <div>
            <span className="font-display text-lg font-black tracking-tight text-white uppercase italic">
              LET'S <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">TWIN</span>
            </span>
            <span className="block text-[9px] font-mono tracking-widest text-slate-500 uppercase">
              Digital Twin System v4.2
            </span>
          </div>
        </div>

        {/* Tab Navigation links */}
        <nav className="hidden md:flex items-center space-x-1" id="nav-menu">
          <button
            id="tab-btn-landing"
            onClick={() => setTab('landing')}
            className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              currentTab === 'landing'
                ? "bg-white/5 text-blue-400"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Platform</span>
          </button>

          <button
            id="tab-btn-dashboard"
            onClick={() => setTab('dashboard')}
            className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              currentTab === 'dashboard'
                ? "bg-white/5 text-cyan-400"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Live Replicas</span>
          </button>

          <button
            id="tab-btn-ai-lab"
            onClick={() => setTab('ai-lab')}
            className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              currentTab === 'ai-lab'
                ? "bg-white/5 text-blue-400"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Leta AI Lab</span>
          </button>
        </nav>

        {/* Right action button */}
        <div className="flex items-center space-x-3">
          {/* Active indicator */}
          <div className="hidden sm:flex items-center space-x-2 rounded-md border border-white/5 bg-[#07090F] px-3 py-1.5 font-mono text-[10px] uppercase text-slate-400">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${isAiResponding ? 'bg-blue-400 animate-ping' : 'bg-green-400 animate-pulse'}`} />
            <span>
              {isAiResponding ? 'Leta is analyzing' : 'System: Online'}
            </span>
          </div>

          <button
            id="nav-quickstart-btn"
            onClick={() => setTab(currentTab === 'landing' ? 'dashboard' : 'landing')}
            className="cursor-pointer px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-full uppercase tracking-widest transition-all border border-blue-400/30 shadow-lg shadow-blue-600/20"
          >
            {currentTab === 'landing' ? 'Open Dashboard' : 'Naar Home'}
          </button>
        </div>
      </div>

      {/* Mobile navigation container (for smaller screens) */}
      <div className="flex md:hidden border-t border-white/5 bg-[#07090F] justify-around py-2 px-3">
        <button
          onClick={() => setTab('landing')}
          className={`flex flex-col items-center space-y-1 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
            currentTab === 'landing' ? "text-blue-400" : "text-slate-500"
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setTab('dashboard')}
          className={`flex flex-col items-center space-y-1 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
            currentTab === 'dashboard' ? "text-cyan-400" : "text-slate-500"
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Control</span>
        </button>

        <button
          onClick={() => setTab('ai-lab')}
          className={`flex flex-col items-center space-y-1 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
            currentTab === 'ai-lab' ? "text-blue-400" : "text-slate-500"
          }`}
        >
          <Cpu className="h-4 w-4" />
          <span>Leta</span>
        </button>
      </div>
    </header>
  );
}
