import { useState, useEffect } from "react";
import { 
  Layers, Database, ShoppingBag, Sparkles, Cpu, ExternalLink, 
  Network, Wifi, Terminal, Settings, Activity, ShieldCheck
} from "lucide-react";
import { TwinType, ChatMessage } from "../types";
import GeminiPanel from "./GeminiPanel";

interface DashboardProps {
  initialTwin: TwinType;
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isAiLoading: boolean;
  aiError: string | null;
  clearHistory: () => void;
}

export default function Dashboard({
  initialTwin,
  messages,
  onSendMessage,
  isAiLoading,
  aiError,
  clearHistory
}: DashboardProps) {
  const [activeTwin, setActiveTwin] = useState<TwinType>(initialTwin);

  // Synchronize activeTwin with changes from Parent (e.g. from LandingPage clicks)
  useEffect(() => {
    setActiveTwin(initialTwin);
  }, [initialTwin]);

  // Match the live iframe URLs from Netlify
  const iframeUrls: Record<TwinType, string> = {
    qbtec: "https://dtqbtec.netlify.app",
    woerden: "https://dtwoerden.netlify.app",
    retail: "https://dt-retail.netlify.app"
  };

  const getTwinTitle = (t: TwinType) => {
    switch(t) {
      case 'qbtec': return "Let's-Twin #QB-500 (Smart Food Systems QBTEC)";
      case 'woerden': return "Let's-Twin #WO-340 (Woerden Smart City Grid)";
      case 'retail': return "Let's-Twin #ST-910 (Sole Twin Luxe Schoenmode)";
    }
  };

  const getTwinArchitectureDocs = (t: TwinType) => {
    switch(t) {
      case 'qbtec':
        return {
          title: "QBTEC Voedsel-Systemen Replica",
          sector: "Maakindustrie & High-tech Machinebouw",
          architecture: "Modbus/TCP • Siemens Industrial SCADA integration",
          points: [
            { label: "IoT Sensoren", value: "Realtime laser-temperatuursensoren, Modbus controllers en snijkoppen-telemetry." },
            { label: "Primaire Business Waarde", value: "Faalkost-reductie door preventief onderhoud en voorspelbare orderplanning." },
            { label: "Integratiemodel", value: "Bi-directionele Edge API verbinding met PLC controller-hubs op de montagerubrieken." }
          ]
        };
      case 'woerden':
        return {
          title: "Gemeente Woerden Smart City",
          sector: "Openbaar Bestuur & Stedelijke Infrastructuur",
          architecture: "LoRaWAN Urban Gateway • Sensor-Multiplex Network",
          points: [
            { label: "IoT Sensoren", value: "Hydro-grafische debietmeters, stadsbrede hittestress-sensoren en CO2-binnenstadsmonitoren." },
            { label: "Primaire Bestuurs Waarde", value: "Proactief anticiperen op zware neerslag en stedelijke temperatuurconcentraties." },
            { label: "Integratiemodel", value: "Geospatiale open data integratie met actieve LoraWAN omgevings-omslagmeters." }
          ]
        };
      case 'retail':
        return {
          title: "Sole Twin Luxe Schoenmode",
          sector: "Luxe Retail & Supply Chain (5 Filialen)",
          architecture: "Winkel Edge telemetry • Dynamic Inventory Sync API",
          points: [
            { label: "IoT Sensoren", value: "Looproute-analysers, point-of-sale kassahuizen, en actuele depot-bevoorrading matrices." },
            { label: "Primaire Retail Waarde", value: "Optimale inter-filiaal schoenmaat herverdeling ter voorkoming van derving en 'out of stock'." },
            { label: "Integratiemodel", value: "JSON live inventory streams via gecentraliseerde cloud ERP database poorten." }
          ]
        };
    }
  };

  const activeDocs = getTwinArchitectureDocs(activeTwin);

  // Wrapper for sending messages to Gemini AI panel with active twin context injected seamlessly
  const handleSendAiMessage = async (rawText: string) => {
    const payload = {
      text: rawText,
      activeTwin: activeTwin,
      telemetry: {
        twinName: activeDocs.title,
        sector: activeDocs.sector,
        architectureType: activeDocs.architecture,
        activeParameters: activeDocs.points
      }
    };
    await onSendMessage(JSON.stringify(payload));
  };

  return (
    <div className="grid-bg min-h-screen bg-[#07090F] text-slate-205 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="dashboard-root">
      
      {/* Top Banner and Twin Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 pb-5 border-b border-white/5 gap-4" id="dashboard-header">
        <div>
          <span className="text-xs font-mono text-blue-400 tracking-wider uppercase block mb-1">Missions Control Center</span>
          <h2 className="text-xl sm:text-2xl font-black font-display text-white">Let's-Twin Live Control Room</h2>
        </div>

        {/* High-contrast selector pills */}
        <div className="flex bg-black/40 p-1 rounded-full border border-white/10 self-start md:self-auto font-mono text-[10px]" id="twin-controller-tabs">
          <button
            onClick={() => setActiveTwin('qbtec')}
            className={`cursor-pointer px-4.5 py-2 rounded-full transition-all flex items-center space-x-1.5 ${
              activeTwin === 'qbtec' ? 'bg-blue-600 font-extrabold text-white shadow shadow-blue-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="h-3 w-3" />
            <span>Maakbedrijf QBTEC</span>
          </button>
          
          <button
            onClick={() => setActiveTwin('woerden')}
            className={`cursor-pointer px-4.5 py-2 rounded-full transition-all flex items-center space-x-1.5 ${
              activeTwin === 'woerden' ? 'bg-cyan-600 font-extrabold text-slate-950 font-bold shadow shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="h-3 w-3" />
            <span>Gemeente Woerden</span>
          </button>

          <button
            onClick={() => setActiveTwin('retail')}
            className={`cursor-pointer px-4.5 py-2 rounded-full transition-all flex items-center space-x-1.5 ${
              activeTwin === 'retail' ? 'bg-purple-600 font-extrabold text-white shadow shadow-purple-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="h-3 w-3" />
            <span>Sole Twin Shoes</span>
          </button>
        </div>
      </div>

      {/* Main Column Breakdown */}
      <div className="grid gap-6 lg:grid-cols-12 items-stretch" id="dashboard-workspace-grid">
        
        {/* LEFT COLUMN: THE COMPLETE, UNOBSTRUCTED LIVE DIGITAL TWIN SITE (8 COLS) */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-6" id="dashboard-left-workspace">
          
          {/* Iframe framing console */}
          <div className="flex flex-col rounded-2xl border border-white/15 bg-[#090C14] overflow-hidden shadow-2xl relative flex-grow min-h-[660px]">
            {/* Top address / telemetry status banner */}
            <div className="h-11 bg-[#07090F]/90 backdrop-blur border-b border-white/10 flex items-center justify-between px-4 text-[10px] font-mono text-slate-400 z-10 shrink-0">
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-slate-350 text-[9px] uppercase tracking-wider">IoT Link Actief</span>
              </div>
              
              <div className="hidden sm:block px-3 py-1 bg-black/45 rounded-lg border border-white/5 text-[9px] text-slate-500 w-64 text-center truncate">
                {iframeUrls[activeTwin]}
              </div>

              <div className="flex items-center space-x-1.5 text-blue-400 hover:text-blue-300 transition-colors">
                <a href={iframeUrls[activeTwin]} target="_blank" rel="noreferrer" className="flex items-center font-bold space-x-1 text-[9px] uppercase tracking-wide">
                  <span>Open in nieuw tabblad</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            </div>

            {/* Injected uncompromised iFrame workspace */}
            <div className="relative flex-grow w-full h-full min-h-[610px]">
              <iframe
                src={iframeUrls[activeTwin]}
                title={getTwinTitle(activeTwin)}
                className="absolute inset-0 w-full h-full border-none bg-[#090C14]"
                allow="geolocation; microphone; camera; midi; encrypted-media;"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Business & Architecture details box */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm shadow-lg">
            <h3 className="font-display font-black uppercase text-xs tracking-wider text-white mb-3.5 flex items-center space-x-2">
              <Network className="h-4 w-4 text-gradient bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300" />
              <span>Digital Twin Systeemspecificaties</span>
            </h3>
            
            <div className="grid gap-3.5 sm:grid-cols-3">
              {activeDocs.points.map((p, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-black/30 border border-white/5 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-mono text-slate-500 tracking-wider font-bold block mb-1">
                      {p.label}
                    </span>
                    <p className="text-[11px] text-slate-350 font-sans leading-relaxed">
                      {p.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: CHAT INTEGRATION WITH CO-PILOT LETA (4 COLS) */}
        <div className="lg:col-span-4 flex flex-col justify-between" id="dashboard-right-workspace">
          <div className="h-full min-h-[580px] lg:min-h-0 flex flex-col">
            <GeminiPanel
              activeTwin={activeTwin}
              telemetry={{}}
              messages={messages}
              onSendMessage={handleSendAiMessage}
              isLoading={isAiLoading}
              errorStr={aiError}
              clearHistory={clearHistory}
            />
          </div>
        </div>

      </div>

    </div>
  );
}
