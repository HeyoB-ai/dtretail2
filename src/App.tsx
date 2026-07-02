// App component configured for Netlify and Serverless Claude routing
import { useState } from "react";
import { 
  Building2, Cpu, HelpCircle, ArrowRight, Layers, Sparkles, AlertCircle, ShoppingBag, Database, Radio, Wifi
} from "lucide-react";
import { ChatMessage, TwinType } from "./types";
import Navigation from "./components/Navigation";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import { resilientAnalyze } from "./utils/aiClient";

export default function App() {
  const [currentTab, setTab] = useState<'landing' | 'dashboard' | 'ai-lab'>('landing');
  const [selectedTwin, setSelectedTwin] = useState<TwinType>('qbtec');
  
  // Chat History state with high-quality onboarding
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Hallo! Ik ben Leta, jouw Let's-Twin AI Co-pilot.\n\n" +
            "Ik sta rechtstreeks in verbinding met de IoT-sensoren via onze Edge SCADA-gateways bij QBTEC (maakbedrijf), Gemeente Woerden (stadsbeheer) en Sole Twin Luxe Schoenmode (5 filialen).\n\n" +
            "Samen analyseren we de live telemetry en rekenen we complexe 'Wat-Als'-scenario's door. Zo help ik je de juiste beleids- en operationele beslissingen te nemen. " +
            "Stuur een bericht of klik op een scenario-knop in de Live Control Room om te beginnen.",
      timestamp: new Date()
    }
  ]);

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Send message to Express backend API route
  const handleSendMessage = async (payloadString: string) => {
    // Check if the user passed JSON payload (from the dashboard with telemetry) or raw text
    let text = payloadString;
    let telemetryContext: any = null;
    let twinContext: TwinType = selectedTwin;

    try {
      const parsed = JSON.parse(payloadString);
      text = parsed.text;
      telemetryContext = parsed.telemetry;
      twinContext = parsed.activeTwin;
      setSelectedTwin(twinContext);
    } catch (e) {
      // Not a JSON payload, treat as raw text
    }

    // Append user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsAiLoading(true);
    setAiError(null);

    try {
      // Fetch response using resilient Gemini client
      const rawText = await resilientAnalyze({
        message: text,
        activeTwin: twinContext,
        telemetry: telemetryContext || { info: "Geen rechtstreekse telemetry meegezonden. Analyseer het algemene Let's-Twin-platform." }
      });

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: rawText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      console.error(error);
      setAiError(error.message || "Er is een verbindingsfout opgetreden met de Leta AI-module.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleStartTwin = (twin: TwinType) => {
    setSelectedTwin(twin);
    setTab('dashboard');
  };

  const clearChatHistory = () => {
    setMessages([
      {
        id: "welcome-reset",
        sender: "ai",
        text: "Geschiedenis gewist. De IoT-sensoren staan klaar. Waar kan ik je mee helpen?",
        timestamp: new Date()
      }
    ]);
  };

  const getTwinReadableName = (t: TwinType) => {
    if (t === 'qbtec') return 'Maakbedrijf QBTEC';
    if (t === 'woerden') return 'Gemeente Woerden';
    return 'Sole Twin Schoenmode';
  };

  return (
    <div className="min-h-screen bg-[#07090F] text-slate-100 font-sans antialiased overflow-x-hidden">
      
      {/* Top navbar */}
      <Navigation 
        currentTab={currentTab} 
        setTab={setTab} 
        isAiResponding={isAiLoading}
      />

      {/* Main workspace layout switching */}
      <main>
        {currentTab === 'landing' && (
          <LandingPage 
            onStartTwin={handleStartTwin} 
            setTab={setTab} 
          />
        )}

        {currentTab === 'dashboard' && (
          <Dashboard
            initialTwin={selectedTwin}
            messages={messages}
            onSendMessage={handleSendMessage}
            isAiLoading={isAiLoading}
            aiError={aiError}
            clearHistory={clearChatHistory}
          />
        )}

        {currentTab === 'ai-lab' && (
          <div className="grid-bg min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col justify-between" id="ai-lab-workspace">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-900 mb-8">
              <div>
                <span className="text-xs font-mono text-cyan-400 tracking-wider uppercase block mb-1">Let's-Twin Conversational Hub</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white flex items-center space-x-2">
                  <span>Centraal Leta AI Simulator Lab</span>
                  <Sparkles className="h-5 w-5 text-cyan-455 fill-cyan-400" />
                </h2>
              </div>
              
              <button
                onClick={() => setTab('dashboard')}
                className="cursor-pointer font-display text-xs font-semibold px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-550 rounded-xl text-white hover:opacity-95 transition-opacity self-start md:self-auto"
              >
                Naar de Live Control Room
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-12 items-stretch flex-grow">
              
              {/* Left Column: Full systems status & multiplex indicators */}
              <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
                
                {/* Tech specifications introduction box */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                  <h3 className="font-display font-bold text-white text-base mb-3">Globale Multiplex Netwerkstatus</h3>
                  <p className="text-slate-400 text-xs leading-relaxed mb-4">
                    Dit lab is de directe toegang tot Leta's AI-beslissingsmodel. Hieronder ziet u de actieve gateways van onze drie live-embedded replica's.
                  </p>

                  <div className="space-y-3 font-mono text-xs">
                    {/* QBTEC */}
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <Layers className="h-4 w-4 text-blue-400" />
                        <div>
                          <span className="block font-semibold text-white">QBTEC Voedsel-Systemen</span>
                          <span className="block text-[9px] text-slate-500">Modbus/TCP Client • SCADA Core</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400">
                        Online
                      </span>
                    </div>

                    {/* Woerden */}
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <Database className="h-4 w-4 text-cyan-400" />
                        <div>
                          <span className="block font-semibold text-white">Woerden Stedelijk Netwerk</span>
                          <span className="block text-[9px] text-slate-500">LoRaWAN Gateway • 1,240 nodes</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400">
                        Online
                      </span>
                    </div>

                    {/* Retail */}
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <ShoppingBag className="h-4 w-4 text-indigo-400" />
                        <div>
                          <span className="block font-semibold text-white">Schoenmode Retail (5 Filialen)</span>
                          <span className="block text-[9px] text-slate-500">Edge Router Node • API Sync</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400">
                        Online
                      </span>
                    </div>
                  </div>
                </div>

                {/* Predictief Rapport */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex-grow flex flex-col justify-between backdrop-blur-sm">
                  <div>
                    <h3 className="font-display font-medium text-slate-350 text-xs uppercase tracking-widest mb-3">Model Predictief Rapport</h3>
                    
                    <div className="bg-black/40 font-mono text-[10px] text-slate-400 p-3.5 rounded-xl border border-white/5 leading-normal space-y-2">
                      <div className="flex items-center justify-between text-[9px] border-b border-white/5 pb-1.5 mb-1.5">
                        <span>Leta Diagnostische Log</span>
                        <span className="text-slate-650">UTC {new Date().toISOString().substring(11, 19)}</span>
                      </div>
                      <p className="text-blue-400">&gt; Bezig met scannen van QBTEC lasersnijder-temperaturen...</p>
                      <p className="text-emerald-400">&gt; Status: Geen hitte-overschrijding gedetecteerd op de fabrieksvloer.</p>
                      <p className="text-cyan-400">&gt; Woerden waterpeil Singel bevindt zich op een volkomen veilig niveau.</p>
                      <p className="text-purple-400">&gt; Klimaatbeheersing Flagship store functioneert optimaal rond de 21.0°C.</p>
                      <p className="text-slate-500">&gt; AI Model staat klaar voor directe scenario-evaluatie.</p>
                    </div>
                  </div>

                  <div className="mt-4 p-3.5 rounded-xl border border-white/5 bg-black/20 flex items-start space-x-2 text-xs text-slate-450">
                    <HelpCircle className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                    <p className="font-sans leading-relaxed">
                      Leta beantwoordt ook algemene vragen over Digital Twins, waterbeheersystemen, CNC-robotkalibratie, dervingsreductie in retail en het berekenen van forecasts.
                    </p>
                  </div>
                </div>

              </div>

              {/* Right Column: Full width chat console (7 cols) */}
              <div className="lg:col-span-7 h-full flex flex-col justify-between" id="ai-lab-chat-workspace">
                <div className="h-full">
                  <div className="bg-black/30 rounded-2xl border border-white/10 p-3 min-h-[380px] max-h-[580px] overflow-hidden flex flex-col justify-end">
                    <div className="flex-grow flex flex-col justify-between overflow-hidden">
                      
                      {/* Sub header for context twin */}
                      <div className="px-3 py-2 border-b border-white/5 mb-3 flex items-center justify-between text-xs text-slate-400 font-mono bg-black/40 rounded-lg">
                        <span>Leta's Actieve Context Focus:</span>
                        <span className="text-blue-400 uppercase font-black">
                          {getTwinReadableName(selectedTwin)}
                        </span>
                      </div>

                      {/* Chat Messages */}
                      <div className="flex-grow overflow-y-auto px-2 py-1 space-y-4 max-h-[440px] flex flex-col">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex flex-col max-w-[85%] ${
                              msg.sender === 'user' ? "align-end self-end items-end" : "align-start self-start items-start"
                            }`}
                          >
                            <div
                              className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-sans leading-relaxed ${
                                msg.sender === 'user'
                                  ? "bg-blue-600/20 text-slate-100 rounded-br-none border border-blue-500/30"
                                  : "bg-white/5 text-slate-300 rounded-bl-none border border-white/10"
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                            <span className="text-[9px] font-mono text-slate-600 mt-1">
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                        ))}

                        {isAiLoading && (
                          <div className="flex flex-col max-w-[85%] align-start self-start items-start">
                            <div className="rounded-2xl px-4 py-3 bg-white/5 border border-white/10 rounded-bl-none flex items-center space-x-3 text-xs text-slate-450">
                              <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                              </span>
                              <span>Leta controleert de volledige simulatie...</span>
                            </div>
                          </div>
                        )}

                        {aiError && (
                          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-start space-x-2">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <p className="font-sans leading-relaxed">{aiError}</p>
                          </div>
                        )}
                      </div>

                      {/* Input controls form */}
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const input = (e.currentTarget.elements.namedItem('labMessage') as HTMLInputElement);
                        if (!input.value.trim() || isAiLoading) return;
                        handleSendMessage(input.value);
                        input.value = "";
                      }} className="pt-3 border-t border-white/5 bg-[#07090F] mt-3 flex items-center relative">
                        <input
                          name="labMessage"
                          type="text"
                          disabled={isAiLoading}
                          placeholder="Stel uw vraag aan de AI Co-pilot..."
                          className="w-full bg-white/5 border border-white/15 rounded-xl py-3 pl-4 pr-12 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all disabled:opacity-60"
                          id="lab-chat-input"
                        />
                        <button
                          type="submit"
                          disabled={isAiLoading}
                          className="cursor-pointer absolute right-2.5 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-all disabled:opacity-40"
                          id="lab-chat-send-btn"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </div>

                  </div>
                </div>
              </div>

            </div>

            <footer className="mt-8 text-center text-slate-600 text-[10px] font-mono">
              Controlecentrum aangedreven door Leta v3.5 • Let's-Twin Neuraal Netwerk
            </footer>
          </div>
        )}
      </main>
      
    </div>
  );
}
