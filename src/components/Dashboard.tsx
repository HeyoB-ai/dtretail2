import { useState, useEffect } from "react";
import { 
  Radio, Cpu, Activity, Thermometer, ShieldAlert, Zap, 
  RotateCw, RefreshCw, Layers, Gauge, Sliders, ToggleLeft, ToggleRight,
  Database, Users, Sun, Droplets, ShoppingBag, Eye, Sparkles, HelpCircle
} from "lucide-react";
import { 
  QbtecTelemetry, WoerdenTelemetry, RetailTelemetry, 
  TwinType, ChatMessage 
} from "../types";
import ModelViewer2D from "./ModelViewer2D";
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
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [scenarioReport, setScenarioReport] = useState<{title: string, impact: string, recommendation: string} | null>(null);

  // Synchronize activeTwin with changes from Parent
  useEffect(() => {
    setActiveTwin(initialTwin);
    setSelectedScenario(null);
    setScenarioReport(null);
  }, [initialTwin]);

  // Use state definitions matching our new types
  const [qbtec, setQbtec] = useState<QbtecTelemetry>({
    status: 'operational',
    productionRate: 14,
    machineTemp: 44.5,
    energyLoad: 120, // kW
    defectRate: 0.5, // %
    activeOperators: 5,
    ordersInQueue: 18,
    laserPressure: 6.2 // bar
  });

  const [woerden, setWoerden] = useState<WoerdenTelemetry>({
    status: 'operational',
    trafficCongestion: 15,
    drainageLevel: 28,
    urbanHeatIndex: 3,
    parkingVacancy: 410,
    co2Level: 412,
    energyGridLoad: 38,
    rainIntensity: 0.0 // mm/hr
  });

  const [retail, setRetail] = useState<RetailTelemetry>({
    status: 'operational',
    aisleTraffic: 14,
    checkoutQueueLength: 2,
    averageBasketValue: 24.50,
    refrigerationTemp: 4.2, // °C
    stockLevel: 94, // %
    energyConsumption: 12.8, // kW
    promoActive: false
  });

  // Trend history lists to render real-time SVG curves
  const [qbtecHistory, setQbtecHistory] = useState<number[]>([14, 15, 12, 16, 15, 14, 13, 14]);
  const [woerdenHistory, setWoerdenHistory] = useState<number[]>([25, 27, 28, 26, 29, 28, 27, 28]);
  const [retailHistory, setRetailHistory] = useState<number[]>([4.1, 4.2, 4.3, 4.1, 4.2, 4.3, 4.2, 4.2]);

  // Periodic simulations: drifts or soft reaction to parameters
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. QBTEC Drift
      setQbtec(prev => {
        if (prev.status === 'offline') return prev;
        
        // Machine temp drifts towards equilibrium relative to production speed
        const targetTemp = 25 + (prev.productionRate * 1.8) + (prev.laserPressure * 1.5);
        const machineTemp = Number((prev.machineTemp + (targetTemp - prev.machineTemp) * 0.1 + (Math.random() * 0.4 - 0.2)).toFixed(1));
        
        // Energy consumption linked to production rate
        const energyLoad = Math.round(40 + (prev.productionRate * 6.8) + (prev.laserPressure * 1.2));
        const defectRate = Number(Math.max(0.1, Math.min(3.5, 0.2 + (prev.productionRate * 0.03))).toFixed(2));
        
        // Push to history
        setQbtecHistory(h => [...h.slice(-7), prev.productionRate]);

        // Auto transition status if safety index is violated
        let status = prev.status;
        if (machineTemp > 75) {
          status = 'warning';
        } else if (prev.status === 'warning' && machineTemp <= 75) {
          status = 'operational';
        }

        return {
          ...prev,
          machineTemp: prev.status === 'maintenance' ? 22.0 : machineTemp,
          energyLoad: prev.status === 'maintenance' ? 12 : energyLoad,
          defectRate: prev.status === 'maintenance' ? 0.0 : defectRate,
          status
        };
      });

      // 2. Woerden Drift
      setWoerden(prev => {
        // Drainage/water level rises with rain intensity, else slow drainage grid absorption/release
        let drainageLevel = prev.drainageLevel;
        if (prev.rainIntensity > 0) {
          drainageLevel = Math.min(100, Math.round(prev.drainageLevel + (prev.rainIntensity * 1.1)));
        } else {
          drainageLevel = Math.max(20, Math.round(prev.drainageLevel - 1.2));
        }

        // CO2 level shifts with traffic congestion
        const co2Level = Math.round(390 + (prev.trafficCongestion * 1.8) + (Math.random() * 4 - 2));
        const energyGridLoad = Math.min(98, Math.round(25 + (prev.urbanHeatIndex * 6.5) + (prev.trafficCongestion * 0.15)));
        const parkingVacancy = Math.max(10, Math.min(600, prev.parkingVacancy + (Math.random() > 0.6 ? -3 : 2)));

        setWoerdenHistory(h => [...h.slice(-7), drainageLevel]);

        let status = prev.status;
        if (drainageLevel > 75 || prev.urbanHeatIndex > 8) {
          status = 'warning';
        } else {
          status = 'operational';
        }

        return {
          ...prev,
          drainageLevel,
          co2Level,
          energyGridLoad,
          parkingVacancy,
          status
        };
      });

      // 3. Retail Drift
      setRetail(prev => {
        // Checkout queues respond to visitor density in aisles
        const targetQueues = Math.max(1, Math.ceil(prev.aisleTraffic / 8));
        const checkoutQueueLength = prev.checkoutQueueLength < targetQueues 
          ? prev.checkoutQueueLength + (Math.random() > 0.5 ? 1 : 0)
          : prev.checkoutQueueLength > targetQueues ? prev.checkoutQueueLength - 1 : prev.checkoutQueueLength;

        // Freezer temperature soft oscillation
        const targetFreezer = prev.promoActive ? 5.2 : 4.0;
        const refrigerationTemp = Number((prev.refrigerationTemp + (targetFreezer - prev.refrigerationTemp) * 0.15 + (Math.random() * 0.3 - 0.15)).toFixed(1));

        // Energy consumption
        const energyReg = prev.promoActive ? 16.5 : 12.2;
        const energyConsumption = Number((energyReg + (prev.aisleTraffic * 0.08)).toFixed(1));

        // Stock levels decline slightly when traffic is high
        const stockLevel = Math.max(10, Math.round(prev.stockLevel - (prev.aisleTraffic * 0.02)));

        setRetailHistory(h => [...h.slice(-7), refrigerationTemp]);

        let status = prev.status;
        if (refrigerationTemp > 6.8) {
          status = 'warning';
        } else {
          status = 'operational';
        }

        return {
          ...prev,
          checkoutQueueLength,
          refrigerationTemp,
          energyConsumption,
          stockLevel,
          status
        };
      });

    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Predefined realistic simulation scenario handler
  const handleTriggerScenario = (scenarioId: string) => {
    setSelectedScenario(scenarioId);

    if (activeTwin === 'qbtec') {
      if (scenarioId === 'optimise_shift') {
        const payload = {
          status: 'operational' as const,
          productionRate: 15,
          machineTemp: 45.0,
          ordersInQueue: 12,
          defectRate: 0.3,
          laserPressure: 6.0,
          activeOperators: 6
        };
        setQbtec(prev => ({ ...prev, ...payload }));
        setScenarioReport({
          title: "Scenario: Optimale Productie-Shift",
          impact: "Personeelsbezetting en machinetemperaturen in perfecte harmonie. Energieverbruik gebalanceerd.",
          recommendation: "AI Evaluatie: De lasersnijders draaien op 92% optimale efficiency. Geen extra hercalibratie vereist."
        });
        triggerAiConsultKey("Leta, graag een snelle evaluatie van onze actuele QBTEC optimale shift-status.");
      } else if (scenarioId === 'peak_demand') {
        const payload = {
          status: 'operational' as const,
          productionRate: 32,
          machineTemp: 68.5,
          ordersInQueue: 48,
          activeOperators: 10,
          laserPressure: 8.5
        };
        setQbtec(prev => ({ ...prev, ...payload }));
        setScenarioReport({
          title: "Scenario: Extreme Piekbelasting",
          impact: "Bestellingen lopen op van 18 naar 48. Machinetemperaturen stijgen snel richting 69°C. Hoge elektriciteitsbelasting.",
          recommendation: "AI Evaluatie: Schakel een extra back-up koelcompressor in en verminder tijdelijk de lasersnelheid met 10% om storingen te vermijden."
        });
        triggerAiConsultKey("Leta, we ervaren een flinke piekorderstroom bij QBTEC van 48 lopende opdrachten. Wat is uw corrigerend advies voor de machinebezetting?");
      } else if (scenarioId === 'laser_failure') {
        const payload = {
          status: 'warning' as const,
          productionRate: 2,
          machineTemp: 82.0,
          ordersInQueue: 35,
          laserPressure: 0.1,
          activeOperators: 3
        };
        setQbtec(prev => ({ ...prev, ...payload }));
        setScenarioReport({
          title: "Scenario: Laser-Oververhitting & Drukverlies",
          impact: "Lasersnijder stopt wegens overschrijding alarmmarge (82°C). Productiesnelheid stort in. Wachtrij groeit snel.",
          recommendation: "AI Evaluatie: Activeer onmiddellijk het sprinkler- en koelcircuit van de laserspiegel. Verplaats openstaande orders naar back-up CNC-lijn."
        });
        triggerAiConsultKey("Leta, kritieke lasersnijder-fout bij QBTEC! Temperatuur is 82°C en laser druk is weggevallen. Geef een direct herstel- en evacuatieprotocol.");
      }
    }

    else if (activeTwin === 'woerden') {
      if (scenarioId === 'dry_weekend') {
        const payload = {
          status: 'operational' as const,
          rainIntensity: 0.0,
          drainageLevel: 24,
          trafficCongestion: 10,
          urbanHeatIndex: 2,
          parkingVacancy: 480
        };
        setWoerden(prev => ({ ...prev, ...payload }));
        setScenarioReport({
          title: "Scenario: Rustige Weekend-modus",
          impact: "Geen neerslag. Waterpeil in de Singels stabiel op 24%. Zeer lage verkeersdrukte en optimale CO2-waarden.",
          recommendation: "AI Evaluatie: Stedelijke waterbuffers staan in opvangmodus. Sensoren rapporteren een gezonde hitte-index."
        });
        triggerAiConsultKey("Leta, analyseer de algemene smart city status van Woerden tijdens dit rustige en droge weekend.");
      } else if (scenarioId === 'heavy_rain') {
        const payload = {
          status: 'warning' as const,
          rainIntensity: 42.0,
          drainageLevel: 82,
          trafficCongestion: 65,
          urbanHeatIndex: 1,
          parkingVacancy: 140
        };
        setWoerden(prev => ({ ...prev, ...payload }));
        setScenarioReport({
          title: "Scenario: Zware Wolkbreuk (Stortbui)",
          impact: "Heftige regenval van 42 mm/uur. Singels en drainage-reservoirs vullen zich razendsnel tot 82%. Verkeersinfarct op de toegangswegen.",
          recommendation: "AI Evaluatie: Activeer de extra overloopgemalen bij de Woerdense polders. Zend een vroege burgerwaarschuwing uit voor ondergelopen kelders."
        });
        triggerAiConsultKey("Leta, nood-scenario in Woerden! Enorme wolkbreuk met 42 mm neerslag per uur. Drainagepeil raakt overbelast op 82%. Welke sluisdeuren moeten direct open?");
      } else if (scenarioId === 'heatwave') {
        const payload = {
          status: 'warning' as const,
          rainIntensity: 0.0,
          urbanHeatIndex: 9,
          trafficCongestion: 22,
          drainageLevel: 18,
          parkingVacancy: 290,
          energyGridLoad: 89
        };
        setWoerden(prev => ({ ...prev, ...payload }));
        setScenarioReport({
          title: "Scenario: Snikhete Hittegolf",
          impact: "Extreme hitte-index van 9/10 leidt tot 'Urban Heat Island' effect. De stroombelasting stijgt tot 89% wegens airco's. Waterpeil historisch laag.",
          recommendation: "AI Evaluatie: Open de stedelijke fonteinen ter koeling. Activeer het hitteprotocol voor kwetsbare groepen en verlaag kantoorventilaties."
        });
        triggerAiConsultKey("Leta, hittegolf in Woerden (hitte-index 9 van 10). Stroomnetbelasting klimt tot 89%. Hoe kunnen we zwart-outs van het stroomnetwerk proactief voorkomen?");
      }
    }

    else if (activeTwin === 'retail') {
      if (scenarioId === 'quiet_morning') {
        const payload = {
          status: 'operational' as const,
          aisleTraffic: 11,
          checkoutQueueLength: 1,
          stockLevel: 98,
          refrigerationTemp: 3.8
        };
        setRetail(prev => ({ ...prev, ...payload }));
        setScenarioReport({
          title: "Scenario: Groene Ochtend-modus",
          impact: "Lage winkelbezetting. Koelcel temperaturen bevinden zich in de superveilige 3.8°C eco-zone.",
          recommendation: "AI Evaluatie: Energieverbruik is minimaal. Geen wachtrij-optimalisatie noodzakelijk."
        });
        triggerAiConsultKey("Leta, geef een korte samenvatting van de prestatie-metrieken voor retail tijdens de kantoor-ochtend.");
      } else if (scenarioId === 'friday_rush') {
        const payload = {
          status: 'operational' as const,
          aisleTraffic: 62,
          checkoutQueueLength: 8,
          averageBasketValue: 46.80,
          stockLevel: 68
        };
        setRetail(prev => ({ ...prev, ...payload }));
        setScenarioReport({
          title: "Scenario: Vrijdagmiddag Piekdrukte",
          impact: "Winkelstroom explodeert naar 62 actieve bezoekers. Gemiddelde wachttijden bij de kassa lopen fors op.",
          recommendation: "AI Evaluatie: Open kassa 3 en 4 onmiddellijk om doorstroom te garanderen. Activeer mobiel vullen wegens krimpende stockniveaus."
        });
        triggerAiConsultKey("Leta, vrijdagmiddagdrukte in de supermarkt! We hebben 62 bezoekers in de gangpaden en reeds 8 wachtenden per kassa. Hoe herverdelen we de bezetting?");
      } else if (scenarioId === 'cooler_failure') {
        const payload = {
          status: 'warning' as const,
          refrigerationTemp: 11.5,
          aisleTraffic: 24,
          checkoutQueueLength: 2,
          energyConsumption: 2.4
        };
        setRetail(prev => ({ ...prev, ...payload }));
        setScenarioReport({
          title: "Scenario: Stroomuitval Koelcellen",
          impact: "Vries/koelcel verliest stroomtoevoer! Temperatuur koeling schiet omhoog naar 11.5°C (critical limit is 7.0°C).",
          recommendation: "AI Evaluatie: Gevaar voor bacteriegroei en voedselbederf. Activeer noodstroomaggregaat koeling en sluit direct alle isolatiedeuren."
        });
        triggerAiConsultKey("Leta, kritieke koelstoring in de winkel! De diepvries-sensor meldt 11.5 graden Celsius. Wat moeten onze winkelmedewerkers NU direct doen om derving te voorkomen?");
      }
    }
  };

  const triggerAiConsultKey = (prompt: string) => {
    onSendMessage(JSON.stringify({
      text: prompt,
      activeTwin,
      telemetry: currentTelemetry
    }));
  };

  const currentTelemetry = 
    activeTwin === 'qbtec' ? qbtec :
    activeTwin === 'woerden' ? woerden : retail;

  // Send message attaching telemetry
  const handleSendMessage = (text: string) => {
    return onSendMessage(JSON.stringify({
      text,
      activeTwin,
      telemetry: currentTelemetry
    }));
  };

  // SVG mini-chart utility
  const getSvgPathFromArray = (arr: number[], maxVal: number, width = 300, height = 70) => {
    if (arr.length === 0) return { path: "", area: "" };
    const min = Math.min(...arr) * 0.9;
    const max = maxVal;
    const range = max - min || 1;
    
    const points = arr.map((val, idx) => {
      const x = (idx / (arr.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 10) - 5;
      return `${x},${y}`;
    });

    const path = `M ${points.join(" L ")}`;
    const area = `${path} L ${width},${height} L 0,${height} Z`;
    return { path, area };
  };

  const resetAllToEco = () => {
    setSelectedScenario(null);
    setScenarioReport(null);
    
    if (activeTwin === 'qbtec') {
      setQbtec({
        status: 'operational',
        productionRate: 14,
        machineTemp: 44.5,
        energyLoad: 120,
        defectRate: 0.5,
        activeOperators: 5,
        ordersInQueue: 18,
        laserPressure: 6.2
      });
    } else if (activeTwin === 'woerden') {
      setWoerden({
        status: 'operational',
        trafficCongestion: 15,
        drainageLevel: 28,
        urbanHeatIndex: 3,
        parkingVacancy: 410,
        co2Level: 412,
        energyGridLoad: 38,
        rainIntensity: 0.0
      });
    } else {
      setRetail({
        status: 'operational',
        aisleTraffic: 14,
        checkoutQueueLength: 2,
        averageBasketValue: 24.50,
        refrigerationTemp: 4.2,
        stockLevel: 94,
        energyConsumption: 12.8,
        promoActive: false
      });
    }
  };

  return (
    <div className="grid-bg min-h-screen bg-[#07090F] text-slate-200 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="dashboard-root">
      
      {/* Dynamic Digital Twin Selector Tabs Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 pb-5 border-b border-white/5 gap-4" id="dashboard-header">
        <div>
          <span className="text-xs font-mono text-blue-400 tracking-wider uppercase block mb-1">IoT Operational Center</span>
          <h2 className="text-xl sm:text-2xl font-black font-display text-white">Let's-Twin Live Control Room</h2>
        </div>

        {/* Selector pills for active twin */}
        <div className="flex bg-black/40 p-1 rounded-full border border-white/10 self-start md:self-auto" id="twin-controller-tabs">
          <button
            onClick={() => { setActiveTwin('qbtec'); setSelectedScenario(null); setScenarioReport(null); }}
            className={`cursor-pointer px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 ${
              activeTwin === 'qbtec' ? 'bg-blue-600 text-white shadow shadow-blue-500/15' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Maakbedrijf (QBTEC)</span>
          </button>
          
          <button
            onClick={() => { setActiveTwin('woerden'); setSelectedScenario(null); setScenarioReport(null); }}
            className={`cursor-pointer px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 ${
              activeTwin === 'woerden' ? 'bg-cyan-600 text-slate-950 font-extrabold shadow shadow-cyan-500/15' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>Gemeente Woerden</span>
          </button>

          <button
            onClick={() => { setActiveTwin('retail'); setSelectedScenario(null); setScenarioReport(null); }}
            className={`cursor-pointer px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 ${
              activeTwin === 'retail' ? 'bg-purple-600 text-white shadow shadow-purple-500/15' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Retail Supermarkt</span>
          </button>
        </div>
      </div>

      {/* THREE BENTO GRID COLUMNS LAYOUT */}
      <div className="grid gap-5 lg:grid-cols-12 items-stretch" id="dashboard-layout-grid">
        
        {/* COLUMN 1: "NU" LIVE PARAMETER SLIDERS (4 COLS) */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-5" id="dashboard-controller-column">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col justify-between backdrop-blur-sm self-stretch h-full">
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Sliders className="h-4.5 w-4.5 text-blue-400" />
                <h3 className="font-display font-black uppercase text-xs tracking-wider text-white">NU: Telemetry Sturen</h3>
              </div>
              <p className="text-slate-400 text-[11px] mb-5 leading-relaxed font-sans">
                Verander live de IoT-sensoren van de actieve digital twin om te ontdekken welke drempelmarges en triggers direct geactiveerd worden.
              </p>

              {/* A. QBTEC SLIDERS */}
              {activeTwin === 'qbtec' && (
                <div className="space-y-4" id="slider-panel-qbtec">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                      <span className="text-slate-400">Lasersnijder Druk</span>
                      <span className="text-blue-400 font-bold">{qbtec.laserPressure.toFixed(1)} bar</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="15"
                      step="0.1"
                      value={qbtec.laserPressure}
                      onChange={(e) => setQbtec(prev => ({ ...prev, laserPressure: parseFloat(e.target.value) }))}
                      className="w-full accent-blue-500 h-1 bg-slate-900 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-0.5">
                      <span>Min: 0.1 bar</span>
                      <span>Max: 15 bar</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                      <span className="text-slate-400">Productie Rate</span>
                      <span className="text-blue-400 font-bold">{qbtec.productionRate} orders/u</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={qbtec.productionRate}
                      onChange={(e) => setQbtec(prev => ({ ...prev, productionRate: parseInt(e.target.value) }))}
                      className="w-full accent-blue-500 h-1 bg-slate-900 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                      <span className="text-slate-400">Actieve Operators</span>
                      <span className="text-blue-400 font-bold">{qbtec.activeOperators} shifts</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="12"
                      value={qbtec.activeOperators}
                      onChange={(e) => setQbtec(prev => ({ ...prev, activeOperators: parseInt(e.target.value) }))}
                      className="w-full accent-blue-500 h-1 bg-slate-900 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="pt-3 border-t border-white/5 space-y-1.5 text-[10px] font-mono">
                    <span className="block text-slate-500 uppercase tracking-wider font-semibold">Live status-metingen:</span>
                    <div className="flex justify-between">
                      <span>Machinetemperatuur:</span>
                      <span className={qbtec.machineTemp > 75 ? "text-red-400 font-bold" : "text-white"}>{qbtec.machineTemp}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stroomverbruik oven:</span>
                      <span className="text-white">{qbtec.energyLoad} kW</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Geschat uitvalpercentage:</span>
                      <span className="text-white">{qbtec.defectRate}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* B. WOERDEN SLIDERS */}
              {activeTwin === 'woerden' && (
                <div className="space-y-4" id="slider-panel-woerden">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                      <span className="text-slate-400">Neerslagintensiteit</span>
                      <span className="text-cyan-400 font-bold">{woerden.rainIntensity.toFixed(1)} mm/u</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="0.5"
                      value={woerden.rainIntensity}
                      onChange={(e) => setWoerden(prev => ({ ...prev, rainIntensity: parseFloat(e.target.value) }))}
                      className="w-full accent-cyan-400 h-1 bg-slate-900 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-0.5">
                      <span>Droog</span>
                      <span>Stortbui (50mm)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                      <span className="text-slate-400">Stedelijke Hitte-dome</span>
                      <span className="text-cyan-400 font-bold">Index {woerden.urbanHeatIndex} / 10</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={woerden.urbanHeatIndex}
                      onChange={(e) => setWoerden(prev => ({ ...prev, urbanHeatIndex: parseInt(e.target.value) }))}
                      className="w-full accent-cyan-400 h-1 bg-slate-900 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                      <span className="text-slate-400">Verkeersdrukte Singel</span>
                      <span className="text-cyan-400 font-bold">{woerden.trafficCongestion}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={woerden.trafficCongestion}
                      onChange={(e) => setWoerden(prev => ({ ...prev, trafficCongestion: parseInt(e.target.value) }))}
                      className="w-full accent-cyan-400 h-1 bg-slate-900 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="pt-3 border-t border-white/5 space-y-1.5 text-[10px] font-mono">
                    <span className="block text-slate-500 uppercase tracking-wider font-semibold">Live status-metingen:</span>
                    <div className="flex justify-between">
                      <span>Drainage/Singel Waterpeil:</span>
                      <span className={woerden.drainageLevel > 75 ? "text-red-400 font-bold" : "text-white"}>{woerden.drainageLevel}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CO2 ppm Binnenstad:</span>
                      <span className="text-white">{woerden.co2Level} ppm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Energienet Belasting:</span>
                      <span className="text-white">{woerden.energyGridLoad}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* C. RETAIL SLIDERS */}
              {activeTwin === 'retail' && (
                <div className="space-y-4" id="slider-panel-retail">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                      <span className="text-slate-400">Bezoekerstegoed Gangpaden</span>
                      <span className="text-purple-400 font-bold">{retail.aisleTraffic} klanten</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={retail.aisleTraffic}
                      onChange={(e) => setRetail(prev => ({ ...prev, aisleTraffic: parseInt(e.target.value) }))}
                      className="w-full accent-purple-500 h-1 bg-slate-900 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                      <span className="text-slate-400">Temperatuur Vriesvitrines</span>
                      <span className="text-purple-400 font-bold">{retail.refrigerationTemp.toFixed(1)}°C</span>
                    </div>
                    <input
                      type="range"
                      min="-5"
                      max="15"
                      step="0.1"
                      value={retail.refrigerationTemp}
                      onChange={(e) => setRetail(prev => ({ ...prev, refrigerationTemp: parseFloat(e.target.value) }))}
                      className="w-full accent-purple-500 h-1 bg-slate-900 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-0.5">
                      <span>Eco: -5°C</span>
                      <span>Alarm: 15°C</span>
                    </div>
                  </div>

                  <div className="py-2 px-3 border border-slate-900/60 bg-black/30 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-semibold text-white">Promotie-Campagne Active</span>
                      <span className="block text-[9px] text-slate-500">Verhoogt mandwaarde en traffic</span>
                    </div>
                    <button
                      onClick={() => setRetail(prev => ({ ...prev, promoActive: !prev.promoActive, averageBasketValue: !prev.promoActive ? 42.0 : 24.5 }))}
                      className="cursor-pointer text-slate-400 hover:text-white transition-colors"
                    >
                      {retail.promoActive ? (
                        <ToggleRight className="h-8 w-8 text-purple-400" />
                      ) : (
                        <ToggleLeft className="h-8 w-8 text-slate-600" />
                      )}
                    </button>
                  </div>

                  <div className="pt-3 border-t border-white/5 space-y-1.5 text-[10px] font-mono">
                    <span className="block text-slate-500 uppercase tracking-wider font-semibold">Live status-metingen:</span>
                    <div className="flex justify-between">
                      <span>Wachtrij Kassazuil:</span>
                      <span className="text-white">{retail.checkoutQueueLength} personen</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gemiddelde Mandwaarde:</span>
                      <span className="text-white">€{retail.averageBasketValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Schapbezetting stock level:</span>
                      <span className="text-white">{retail.stockLevel}%</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Actions Reset box */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-4 mt-4 text-[11px]">
              <span className="block text-[9px] font-mono tracking-widest text-slate-500 uppercase mb-2.5">Systeembesturing</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleTriggerScenario(activeTwin === 'qbtec' ? 'laser_failure' : activeTwin === 'woerden' ? 'heavy_rain' : 'cooler_failure')}
                  className="cursor-pointer flex items-center justify-center space-x-1 px-3 py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 text-rose-400 font-bold transition-all"
                  id="stress-test-btn"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Stresstest</span>
                </button>
                <button
                  onClick={resetAllToEco}
                  className="cursor-pointer flex items-center justify-center space-x-1 px-3 py-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/15 text-blue-400 font-bold transition-all"
                  id="eco-restore-btn"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Reset / Eco</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: LIVE IFRAME & SCENARIO MANAGER (4 COLS) */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-5" id="dashboard-viewer-column">
          
          {/* Iframe or SVG schematics container */}
          <div className="flex-grow">
            <ModelViewer2D twinType={activeTwin} telemetry={currentTelemetry} />
          </div>

          {/* WHAT-IFS / SCENARIO-SIMULATOR MENU */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between backdrop-blur-sm">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
                <span className="text-[10px] uppercase tracking-wider font-mono text-white font-bold">Wat-Als Scenarioplanner Simulation</span>
              </div>
              <p className="text-slate-400 text-[10px] leading-relaxed mb-3">
                Kies een scenario om te testen. De sensoren veranderen mee en de AI Co-pilot geeft direct advies over de uitkomst.
              </p>

              {/* Dynamic scenario buttons list */}
              {activeTwin === 'qbtec' && (
                <div className="grid grid-cols-1 gap-2 text-[11px]" id="scenarios-qbtec">
                  <button
                    onClick={() => handleTriggerScenario('optimise_shift')}
                    className={`cursor-pointer px-3.5 py-2.5 rounded-xl border text-left font-semibold font-display transition-all ${
                      selectedScenario === 'optimise_shift' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-black/30 border-white/5 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    🚀 Optimale Machine-Shift (Balanced)
                  </button>
                  <button
                    onClick={() => handleTriggerScenario('peak_demand')}
                    className={`cursor-pointer px-3.5 py-2.5 rounded-xl border text-left font-semibold font-display transition-all ${
                      selectedScenario === 'peak_demand' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-black/30 border-white/5 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    🔥 Extreme Order-Piekbelasting
                  </button>
                  <button
                    onClick={() => handleTriggerScenario('laser_failure')}
                    className={`cursor-pointer px-3.5 py-2.5 rounded-xl border text-left font-semibold font-display transition-all ${
                      selectedScenario === 'laser_failure' ? 'bg-blue-600 border-blue-500 text-white animate-pulse' : 'bg-black/30 border-white/5 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    ⚠️ Lasersnijmachine Drukval / Defect
                  </button>
                </div>
              )}

              {activeTwin === 'woerden' && (
                <div className="grid grid-cols-1 gap-2 text-[11px]" id="scenarios-woerden">
                  <button
                    onClick={() => handleTriggerScenario('dry_weekend')}
                    className={`cursor-pointer px-3.5 py-2.5 rounded-xl border text-left font-semibold font-display transition-all ${
                      selectedScenario === 'dry_weekend' ? 'bg-cyan-600 border-cyan-500 text-slate-950 font-bold' : 'bg-black/30 border-white/5 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    ☀️ Rustig, Droog Weekend Grid
                  </button>
                  <button
                    onClick={() => handleTriggerScenario('heavy_rain')}
                    className={`cursor-pointer px-3.5 py-2.5 rounded-xl border text-left font-semibold font-display transition-all ${
                      selectedScenario === 'heavy_rain' ? 'bg-cyan-600 border-cyan-500 text-slate-950 font-bold animate-pulse' : 'bg-black/30 border-white/5 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    ⛈️ Zware Wolkbreuk & Afwateringspiek
                  </button>
                  <button
                    onClick={() => handleTriggerScenario('heatwave')}
                    className={`cursor-pointer px-3.5 py-2.5 rounded-xl border text-left font-semibold font-display transition-all ${
                      selectedScenario === 'heatwave' ? 'bg-cyan-600 border-cyan-500 text-slate-950 font-bold' : 'bg-black/30 border-white/5 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    🥵 Snikhete Zomerdag (Hittestress index 9)
                  </button>
                </div>
              )}

              {activeTwin === 'retail' && (
                <div className="grid grid-cols-1 gap-2 text-[11px]" id="scenarios-retail">
                  <button
                    onClick={() => handleTriggerScenario('quiet_morning')}
                    className={`cursor-pointer px-3.5 py-2.5 rounded-xl border text-left font-semibold font-display transition-all ${
                      selectedScenario === 'quiet_morning' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-black/30 border-white/5 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    🥬 Reguliere Ochtendbezetting (Eco-On)
                  </button>
                  <button
                    onClick={() => handleTriggerScenario('friday_rush')}
                    className={`cursor-pointer px-3.5 py-2.5 rounded-xl border text-left font-semibold font-display transition-all ${
                      selectedScenario === 'friday_rush' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-black/30 border-white/5 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    🛍️ Vrijdagmiddag Piekbelasting
                  </button>
                  <button
                    onClick={() => handleTriggerScenario('cooler_failure')}
                    className={`cursor-pointer px-3.5 py-2.5 rounded-xl border text-left font-semibold font-display transition-all ${
                      selectedScenario === 'cooler_failure' ? 'bg-purple-600 border-purple-500 text-white animate-pulse' : 'bg-black/30 border-white/5 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    🚨 Stroomstoring Koelvitrines 11°C
                  </button>
                </div>
              )}
            </div>

            {/* Scenario Evaluation Report Box */}
            {scenarioReport && (
              <div className="mt-3.5 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-1.5 text-[10px] animate-fade-in text-slate-300">
                <span className="text-white block font-black uppercase tracking-wider">{scenarioReport.title}</span>
                <p className="font-sans leading-relaxed">{scenarioReport.impact}</p>
                <div className="p-1 px-2 rounded bg-black/20 text-cyan-400 font-mono italic leading-normal">
                  {scenarioReport.recommendation}
                </div>
              </div>
            )}
            
            {/* SVG mini trend logger graph */}
            <div className="border-t border-white/5 pt-4 mt-4">
              <span className="block text-[8px] font-mono tracking-wider text-slate-500 uppercase mb-1.5 flex justify-between">
                <span>Real-time Telemetry Trend tracker</span>
                <span className="text-green-500">Online sync</span>
              </span>
              <div className="bg-[#040608] rounded-lg border border-white/5 p-1 flex items-center justify-center">
                <svg viewBox="0 0 300 45" className="w-full h-[45px]">
                  {activeTwin === 'qbtec' && (() => {
                    const { path, area } = getSvgPathFromArray(qbtecHistory, 45);
                    return (
                      <>
                        <path d={area} fill="url(#grad-blue)" opacity="0.1" />
                        <path d={path} fill="none" stroke="#3b82f6" strokeWidth="2" />
                        <defs>
                          <linearGradient id="grad-blue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="transparent" />
                          </linearGradient>
                        </defs>
                      </>
                    );
                  })()}

                  {activeTwin === 'woerden' && (() => {
                    const { path, area } = getSvgPathFromArray(woerdenHistory, 100);
                    return (
                      <>
                        <path d={area} fill="url(#grad-cyan)" opacity="0.1" />
                        <path d={path} fill="none" stroke="#22d3ee" strokeWidth="2" />
                        <defs>
                          <linearGradient id="grad-cyan" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22d3ee" />
                            <stop offset="100%" stopColor="transparent" />
                          </linearGradient>
                        </defs>
                      </>
                    );
                  })()}

                  {activeTwin === 'retail' && (() => {
                    const { path, area } = getSvgPathFromArray(retailHistory, 15);
                    return (
                      <>
                        <path d={area} fill="url(#grad-purple)" opacity="0.1" />
                        <path d={path} fill="none" stroke="#a855f7" strokeWidth="2" />
                        <defs>
                          <linearGradient id="grad-purple" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="transparent" />
                          </linearGradient>
                        </defs>
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 3: AI DECISION-SUPPORT PANEL (4 COLS) */}
        <div className="lg:col-span-4" id="dashboard-chat-column">
          <GeminiPanel
            activeTwin={activeTwin}
            telemetry={currentTelemetry}
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isAiLoading}
            errorStr={aiError}
            clearHistory={clearHistory}
          />
        </div>

      </div>

    </div>
  );
}
