import { useState, useRef, useEffect, FormEvent } from "react";
import { Send, Cpu, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { ChatMessage, TwinType } from "../types";

interface GeminiPanelProps {
  activeTwin: TwinType;
  telemetry: any;
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  errorStr: string | null;
  clearHistory: () => void;
}

export default function GeminiPanel({
  activeTwin,
  telemetry,
  messages,
  onSendMessage,
  isLoading,
  errorStr,
  clearHistory
}: GeminiPanelProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggestions depending on active twin (QBTEC, Woerden, Retail)
  const suggestions = {
    qbtec: [
      { text: "Welke invloed heeft een laser-oververhitting op onze productie-output en de orders?", label: "Druk- & Temp Analyse" },
      { text: "Wat is de optimale shiftbezetting bij de actuele lasersnijder parameters?", label: "Shift Optimalisatie" },
      { text: "Predictief onderhoud: wanneer moeten we de food-lijnen kalibreren?", label: "Onderhoud Propositie" }
    ],
    woerden: [
      { text: "Analyseer het drainage- en waterniveau risico in Woerden bij 40mm neerslag", label: "Waterpeil Risico" },
      { text: "Stel maatregelen voor tegen hittestress en warmte-concentraties in de binnenstad", label: "Hittegolf Aanpak" },
      { text: "Welke stroombesparingen kunnen we doorvoeren op het energienetwerk bij piekbelasting?", label: "Netwerk Belasting" }
    ],
    retail: [
      { text: "Stel de ideale diepvriestemperatuur in bij een winkelbezetting van 60 personen", label: "Koeling & Eco-Zone" },
      { text: "Hoe kunnen we kassa-wachttijden verkorten tijdens de vrijdagmiddagdrukte?", label: "Klantenstroom Advies" },
      { text: "Analyseer de stockbeschikbaarheid en dervingsrisico's", label: "Stock Analyse" }
    ]
  };

  const activeSuggestions = suggestions[activeTwin] || [];

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const handleSuggestionClick = (text: string) => {
    if (isLoading) return;
    onSendMessage(text);
  };

  return (
    <div className="flex flex-col h-full bg-[#07090F]/90 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-md" id="gemini-panel-root">
      {/* Header bar */}
      <div className="p-4 border-b border-white/10 bg-[#07090F]/95 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Cpu className="h-4.5 w-4.5 text-blue-400 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white font-display flex items-center space-x-1">
              <span>Leta AI Co-pilot</span>
              <Sparkles className="h-3 w-3 text-cyan-400 fill-cyan-400" />
            </h4>
            <span className="block text-[10px] font-mono text-slate-500">
              Gemini 3.5-Flash Core • Live Sync Active
            </span>
          </div>
        </div>

        {messages.length > 1 && (
          <button
            onClick={clearHistory}
            className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            title="Wis chatgeschiedenis"
            id="clear-chat-btn"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Messages list */}
      <div className="flex-grow p-4 overflow-y-auto space-y-4 min-h-[220px] max-h-[460px] md:max-h-none flex flex-col">
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

        {isLoading && (
          <div className="flex flex-col max-w-[85%] align-start self-start items-start">
            <div className="rounded-2xl px-4 py-3 bg-white/5 border border-white/10 rounded-bl-none flex items-center space-x-3 text-xs text-slate-400">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span>Leta is de IoT telemetry aan het analyseren...</span>
            </div>
          </div>
        )}

        {errorStr && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="font-sans leading-relaxed">{errorStr}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions block */}
      <div className="px-4 py-2 border-t border-white/5 bg-[#07090F]/45">
        <span className="block text-[10px] uppercase font-mono tracking-widest text-slate-500 mb-2">
          Stel een vraag aan Leta over de actuele IoT-status:
        </span>
        <div className="flex flex-wrap gap-1.5" id="chat-suggestions">
          {activeSuggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(s.text)}
              disabled={isLoading}
              className="cursor-pointer text-[10px] text-slate-400 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all text-left truncate disabled:opacity-50 max-w-full"
            >
              💡 {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input controls form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-[#07090F]" id="chat-input-form">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder="Type uw IoT-analyse of sturingsvraag..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all disabled:opacity-60"
            id="chat-input-text"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="absolute right-2 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-all disabled:opacity-40 disabled:scale-100 cursor-pointer"
            id="chat-send-btn"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
