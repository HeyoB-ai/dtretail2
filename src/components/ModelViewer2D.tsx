import { useState } from "react";
import { Globe, Cpu, Eye, Wifi, ExternalLink } from "lucide-react";
import { QbtecTelemetry, WoerdenTelemetry, RetailTelemetry, TwinType } from "../types";

interface ModelViewer2DProps {
  twinType: TwinType;
  telemetry: QbtecTelemetry | WoerdenTelemetry | RetailTelemetry;
}

export default function ModelViewer2D({ twinType, telemetry }: ModelViewer2DProps) {
  const [viewMode, setViewMode] = useState<'live' | 'svg'>('live');

  // Match the live iframe URLs from Netlify
  const iframeUrls: Record<TwinType, string> = {
    qbtec: "https://dtqbtec.netlify.app",
    woerden: "https://dtwoerden.netlify.app",
    retail: "https://dt-retail.netlify.app"
  };

  const statusColor = 
    telemetry.status === 'operational' ? '#10b981' :
    telemetry.status === 'warning' ? '#f59e0b' : 
    telemetry.status === 'maintenance' ? '#3b82f6' : '#ef4444';

  const getTwinTitle = () => {
    switch(twinType) {
      case 'qbtec': return "Let's-Twin #QB-500 (Food Machinery Line)";
      case 'woerden': return "Let's-Twin #WO-340 (Woerden Smart City)";
      case 'retail': return "Let's-Twin #RT-880 (Predictive Supermarket)";
    }
  };

  const getGatewayText = () => {
    switch(twinType) {
      case 'qbtec': return "Modbus/TCP Client Enabled";
      case 'woerden': return "LoRaWAN Urban Gateway";
      case 'retail': return "Edge Co-Op Store Hub";
    }
  };

  return (
    <div className="relative flex flex-col justify-between h-full w-full bg-white/5 rounded-2xl border border-white/10 p-5 min-h-[440px] backdrop-blur-sm shadow-xl" id="model-viewer-root">
      {/* Title & View Selection Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-white/5">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-blue-400 uppercase block">Visualisatie & Live Replica</span>
          <h4 className="text-sm font-bold font-display text-white">{getTwinTitle()}</h4>
        </div>

        {/* Toggle View Mode Buttons */}
        <div className="flex bg-[#07090F] p-1 rounded-lg border border-white/10 self-start sm:self-auto shrink-0 font-mono text-[10px]">
          <button
            onClick={() => setViewMode('live')}
            className={`cursor-pointer px-3 py-1.5 rounded-md font-bold uppercase tracking-wider transition-all flex items-center space-x-1 ${
              viewMode === 'live' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="h-3 w-3" />
            <span>Live App</span>
          </button>
          
          <button
            onClick={() => setViewMode('svg')}
            className={`cursor-pointer px-3 py-1.5 rounded-md font-bold uppercase tracking-wider transition-all flex items-center space-x-1 ${
              viewMode === 'svg' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="h-3 w-3" />
            <span>Schematisch (NU)</span>
          </button>
        </div>
      </div>

      {/* Main Viewport Workspace */}
      <div className="flex-grow flex items-center justify-center relative bg-black/30 rounded-xl overflow-hidden min-h-[300px]">
        {viewMode === 'live' ? (
          /* LIVE IFRAME PORTAL */
          <div className="absolute inset-0 w-full h-full">
            <iframe
              src={iframeUrls[twinType]}
              title={getTwinTitle()}
              className="w-full h-full border-none"
              allow="geolocation; microphone; camera; midi; encrypted-media;"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            {/* Quick Link bar overlay */}
            <div className="absolute bottom-2 right-2 bg-[#07090F]/90 backdrop-blur px-2.5 py-1.5 rounded-lg border border-white/10 text-[9px] font-mono text-slate-400 hover:text-white transition-all flex items-center space-x-1">
              <a href={iframeUrls[twinType]} target="_blank" rel="noreferrer" className="flex items-center space-x-1">
                <span>Open in nieuw tabblad</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </div>
        ) : (
          /* CUSTOM FUNCTIONAL DYNAMIC SCHEMATICS BASED ON SLIDERS */
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            
            {/* 1. QBTEC SCHEMATIC */}
            {twinType === 'qbtec' && (() => {
              const qTelemetry = telemetry as QbtecTelemetry;
              const isOverheated = qTelemetry.machineTemp > 75;
              const flowSpeed = qTelemetry.productionRate > 0 ? (15 / qTelemetry.productionRate).toFixed(1) : 0;
              
              return (
                <div className="w-full flex flex-col items-center justify-center space-y-4">
                  <svg viewBox="0 0 320 200" className="w-full max-w-[280px] h-auto">
                    {/* Industrial Fryer Frame & Sheet metals */}
                    <rect x="20" y="80" width="280" height="90" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                    
                    {/* Heating Coil Filament (grows redder with machineTemp) */}
                    <path 
                      d="M 50 145 H 270 M 60 155 H 260 M 80 135 H 240" 
                      fill="none" 
                      stroke={isOverheated ? "#ef4444" : `rgb(${Math.round(qTelemetry.machineTemp * 3)}, 80, 180)`} 
                      strokeWidth="3.5" 
                      strokeLinecap="round"
                    />
                    
                    {/* Conveyor belts with moving orders */}
                    <line x1="10" y1="60" x2="310" y2="60" stroke="#64748b" strokeWidth="4" />
                    {qTelemetry.productionRate > 0 && (
                      <g className="animate-pulse">
                        <circle cx="60" cy="50" r="8" fill="#fbbf24" stroke="#d97706" />
                        <circle cx="160" cy="50" r="8" fill="#fbbf24" stroke="#d97706" />
                        <circle cx="260" cy="50" r="8" fill="#fbbf24" stroke="#d97706" />
                      </g>
                    )}

                    {/* Laser calibration beam indicator */}
                    <line 
                      x1="160" 
                      y1="20" 
                      x2="160" 
                      y2="80" 
                      stroke="#06b6d4" 
                      strokeWidth={qTelemetry.laserPressure > 7 ? "4" : "1.5"} 
                      strokeDasharray="4 4" 
                    />
                    
                    {/* Diagnostic indicators */}
                    <text x="30" y="105" className="text-[9px] font-mono" fill="#94a3b8">Temp: {qTelemetry.machineTemp}°C</text>
                    <text x="30" y="120" className="text-[9px] font-mono" fill="#94a3b8">Laser: {qTelemetry.laserPressure.toFixed(1)} bar</text>
                    {isOverheated && (
                      <rect x="30" y="130" width="100" height="15" rx="3" fill="#ef4444" opacity="0.8" />
                    )}
                    {isOverheated && (
                      <text x="35" y="141" className="text-[8px] font-mono font-bold" fill="#ffffff">OVERHEAT TRIG</text>
                    )}
                  </svg>
                  <div className="text-[10px] text-center font-mono text-slate-400">
                    Orderstroom: {qTelemetry.ordersInQueue} in wachtrij • Actieve Snelheid: {qTelemetry.productionRate} orders/u
                  </div>
                </div>
              );
            })()}

            {/* 2. GEMEENTE WOERDEN SCHEMATIC */}
            {twinType === 'woerden' && (() => {
              const wTelemetry = telemetry as WoerdenTelemetry;
              const hasHeavyFlooding = wTelemetry.drainageLevel > 70;
              const isHeatwave = wTelemetry.urbanHeatIndex > 7;
              
              return (
                <div className="w-full flex flex-col items-center justify-center space-y-4">
                  <svg viewBox="0 0 320 200" className="w-full max-w-[280px] h-auto">
                    {/* Sky / Heat dome */}
                    <rect x="0" y="0" width="320" height="200" fill="transparent" />
                    {isHeatwave && (
                      <path d="M 0 0 Q 160 80 320 0 Z" fill="url(#heat-gradient)" opacity="0.4" />
                    )}
                    
                    {/* Woerden City Outline with reservoirs */}
                    {/* Ground level */}
                    <rect x="10" y="130" width="300" height="60" rx="4" fill="#334155" />
                    
                    {/* Buildings */}
                    <rect x="30" y="70" width="35" height="60" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                    <rect x="75" y="50" width="45" height="80" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                    <rect x="130" y="90" width="40" height="40" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                    <rect x="230" y="65" width="50" height="65" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                    
                    {/* Water Canal Grid (Height dynamically fills based on drainageLevel) */}
                    <rect x="180" y="110" width="40" height="70" fill="#1e293b" stroke="#475569" />
                    <rect 
                      x="181" 
                      y={180 - (wTelemetry.drainageLevel * 0.6)} 
                      width="38" 
                      height={wTelemetry.drainageLevel * 0.6} 
                      fill={hasHeavyFlooding ? "#ef4444" : "#0284c7"} 
                      opacity="0.85" 
                    />
                    
                    {/* Rainfall particle generator vectors */}
                    {wTelemetry.rainIntensity > 0 && (
                      <g className="opacity-65" stroke="#38bdf8" strokeWidth="1" strokeLinecap="round">
                        <line x1="50" y1="20" x2="45" y2="40" />
                        <line x1="120" y1="15" x2="115" y2="35" />
                        <line x1="200" y1="22" x2="195" y2="42" />
                        <line x1="270" y1="18" x2="265" y2="38" />
                        <line x1="90" y1="40" x2="85" y2="60" />
                        <line x1="240" y1="45" x2="235" y2="65" />
                      </g>
                    )}

                    <defs>
                      <linearGradient id="heat-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    <text x="20" y="170" className="text-[9px] font-mono" fill="#cbd5e1">Binnenstad: {wTelemetry.urbanHeatIndex}/10 Hitte</text>
                    <text x="20" y="183" className="text-[9px] font-mono" fill="#cbd5e1">Neerslag: {wTelemetry.rainIntensity} mm/u</text>
                  </svg>
                  <div className="text-[10px] text-center font-mono text-slate-400">
                    Waterpeil Singels: {wTelemetry.drainageLevel}% • Verkeersdrukte: {wTelemetry.trafficCongestion}%
                  </div>
                </div>
              );
            })()}

            {/* 3. RETAIL SUPERMARKT SCHEMATIC */}
            {twinType === 'retail' && (() => {
              const rTelemetry = telemetry as RetailTelemetry;
              const isAisleCrowded = rTelemetry.aisleTraffic > 35;
              const isFreezerWarm = rTelemetry.refrigerationTemp > 7.0;
              
              return (
                <div className="w-full flex flex-col items-center justify-center space-y-4">
                  <svg viewBox="0 0 320 200" className="w-full max-w-[280px] h-auto">
                    {/* Supermarket floor aisles layout */}
                    <rect x="20" y="40" width="70" height="130" rx="3" fill="#1e293b" stroke="#334155" />
                    <rect x="110" y="40" width="70" height="130" rx="3" fill="#1e293b" stroke="#334155" />
                    
                    {/* Food cold lockers freezer */}
                    <rect x="200" y="40" width="100" height="55" rx="3" fill="#0f172a" stroke={isFreezerWarm ? "#ef4444" : "#3b82f6"} strokeWidth="1.5" />
                    <text x="210" y="55" className="text-[8px] font-mono" fill={isFreezerWarm ? "#ef4444" : "#3b82f6"}>FREEZER CELL</text>
                    <text x="210" y="72" className="text-[10px] font-mono font-bold" fill="#ffffff">{rTelemetry.refrigerationTemp}°C</text>
                    
                    {/* Customers queuing up at Checkouts */}
                    <rect x="200" y="115" width="100" height="55" rx="3" fill="#1e293b" stroke="#475569" />
                    <text x="208" y="128" className="text-[8px] font-mono" fill="#94a3b8">KASSA LINE</text>
                    
                    {/* Draw circles representing people in checkout queue */}
                    {Array.from({ length: Math.min(6, rTelemetry.checkoutQueueLength) }).map((_, idx) => (
                      <circle key={idx} cx={220 + (idx * 13)} cy="145" r="5" fill="#f43f5e" />
                    ))}

                    {/* Aisle customers indicator */}
                    {isAisleCrowded && (
                      <circle cx="55" cy="100" r="14" fill="#fbbf24" opacity="0.25" className="animate-ping" />
                    )}
                    
                    <text x="30" y="160" className="text-[8px] font-mono" fill="#e2e8f0">Gang 1: Actief</text>
                    <text x="120" y="160" className="text-[8px] font-mono" fill="#e2e8f0">Gang 2: Promotie</text>
                  </svg>
                  <div className="text-[10px] text-center font-mono text-slate-400">
                    Aisles Bezetting: {rTelemetry.aisleTraffic}p • Gem. mandwaarde: €{rTelemetry.averageBasketValue.toFixed(2)}
                  </div>
                </div>
              );
            })()}

          </div>
        )}
      </div>

      {/* Sync Status Banner */}
      <div className="border border-white/5 bg-[#07090F]/90 p-3 rounded-xl flex items-center justify-between font-mono text-[9px] text-slate-450 mt-2">
        <div className="flex items-center space-x-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>Gateway: {getGatewayText()}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Wifi className="h-2.5 w-2.5 text-green-400" />
          <span>Snelheid: 1ms latency</span>
        </div>
      </div>
    </div>
  );
}
