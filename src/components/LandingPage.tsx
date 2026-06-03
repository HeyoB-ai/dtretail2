import { useState, FormEvent } from "react";
import { 
  ArrowRight, Cpu, Zap, Radio, Shield, Server, LineChart, 
  Building2, Eye, Sparkles, HelpCircle, ArrowUpRight, Play, Layers,
  Calculator, DollarSign, Calendar, Check, Send, AlertTriangle, FileText,
  Clock, Users, Award, ShieldAlert, BadgeCheck, PhoneCall, ArrowDown
} from "lucide-react";
import { TwinType } from "../types";

interface LandingPageProps {
  onStartTwin: (twin: 'qbtec' | 'woerden' | 'retail') => void;
  setTab: (tab: 'landing' | 'dashboard' | 'ai-lab') => void;
}

export default function LandingPage({ onStartTwin, setTab }: LandingPageProps) {
  const [activePreviewTwin, setActivePreviewTwin] = useState<TwinType>('qbtec');

  // ROI Calculator States
  const [selectedSector, setSelectedSector] = useState<'industry' | 'smartcity' | 'retail'>('industry');
  const [sensorCount, setSensorCount] = useState<number>(120);
  const [annualSpend, setAnnualSpend] = useState<number>(350000);

  // AI Pilot Proposal States
  const [companyName, setCompanyName] = useState<string>("");
  const [proposalSector, setProposalSector] = useState<string>("Maakindustrie & Machinebouw");
  const [contactEmail, setContactEmail] = useState<string>("");
  const [challengeText, setChallengeText] = useState<string>("");
  const [proposalResult, setProposalResult] = useState<string | null>(null);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState<boolean>(false);
  const [proposalError, setProposalError] = useState<string | null>(null);

  // Preview twin metadata for iframes on the landing page
  const previewTwins = [
    {
      id: "qbtec" as const,
      name: "Smart Food Systems Maakbedrijf",
      company: "QBTEC Let's-Twin",
      iframeUrl: "https://dtqbtec.netlify.app",
      description: "Een operationele digital twin voor QBTEC (hoogwaardige professionele frituursystemen). Beheer de binnengekomen orders, de metaalbewerkingsrobots en lasersnijders in realtime.",
      keyStats: [
        { label: "NU actieve orders", value: "24 stuks" },
        { label: "Optimalisatie", value: "+14.2% output" },
        { label: "Scenario", value: "Orderstroom Verdubbeling" }
      ],
      badges: ["Robotica", "Industrie 4.0", "Hitte-sensoren"],
      themeColor: "text-blue-400 border-blue-500/20 bg-blue-500/10"
    },
    {
      id: "woerden" as const,
      name: "Gemeenschappelijke Woerden Grid",
      company: "Gemeente Woerden Let's-Twin",
      iframeUrl: "https://dtwoerden.netlify.app",
      description: "Visualisatie van stedelijke telemetry voor Woerden. Beheer hittestress, waterhuishouding bij zware regenval, verkeersdrukte en gemeentelijke infrastructuur.",
      keyStats: [
        { label: "NU actieve sensoren", value: "1,240 nodes" },
        { label: "Optimalisatie", value: "-22% wateroverlast" },
        { label: "Scenario", value: "Wolkbreuk 50mm neerslag" }
      ],
      badges: ["Smart City", "Openbaar Bestuur", "Hittestress-beheer"],
      themeColor: "text-cyan-400 border-cyan-500/20 bg-cyan-500/10"
    },
    {
      id: "retail" as const,
      name: "Predictive Retail Supermarkt",
      company: "Winkel & Retail Let's-Twin",
      iframeUrl: "https://dt-retail.netlify.app",
      description: "Digital twin van een actieve retailwinkel. Beheer schapbezetting, koeling-telemetry, drukte bij de kassa's en de voorspelde effecten van promotie-acties.",
      keyStats: [
        { label: "NU winkelend", value: "48 personen" },
        { label: "Optimalisatie", value: "-18% derving" },
        { label: "Scenario", value: "Vrijdagmiddag Piekbelasting" }
      ],
      badges: ["Retail Analytics", "Eco-Koelingen", "Klantstromen"],
      themeColor: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
    }
  ];

  const currentPreview = previewTwins.find(t => t.id === activePreviewTwin) || previewTwins[0];

  const philosophyItems = [
    {
      icon: <Radio className="h-6 w-6 text-blue-400" />,
      title: "1. NU: Live Stand van Zaken",
      description: "U weet op elk gewenst moment exact hoe het met uw bedrijf, gemeente of winkel gaat. Sensoring telemetry streamt zonder vertraging direct naar uw dashboards."
    },
    {
      icon: <LineChart className="h-6 w-6 text-cyan-400" />,
      title: "2. SCENARIO'S: De Wat-Als Wereld",
      description: "U simuleert complexe scenario's voordat ze plaatsvinden. Wat gebeurt er met de afwatering in Woerden bij 40mm regen? Wat bij machine-uitval bij QBTEC?"
    },
    {
      icon: <Cpu className="h-6 w-6 text-purple-400" />,
      title: "3. AI: Intelligente Besluitvorming",
      description: "Onze geïntegreerde AI Co-pilot analyseert patronen in realtime. Het geeft proactieve adviezen, voorspelt onderhoud en helpt u operationele risico's direct te minimaliseren."
    }
  ];

  // Dynamic ROI calculations
  const calculateROI = () => {
    // Startup fee starting from 12k
    const baseStartup = selectedSector === 'industry' ? 18000 : selectedSector === 'smartcity' ? 25000 : 12000;
    const implementationCost = baseStartup + (sensorCount * 125);
    
    // Monthly licensing
    const monthlySaaS = 450 + (sensorCount * 4.5);
    const annualSaaS = monthlySaaS * 12;

    // Average efficiency savings rate (Industry: 15%, Smart City: 12%, Retail: 10%)
    const efficiencyRate = selectedSector === 'industry' ? 0.16 : selectedSector === 'smartcity' ? 0.14 : 0.11;
    const estimatedSavings = annualSpend * efficiencyRate;

    // First year net benefit
    const netSavingsFirstYear = estimatedSavings - implementationCost - annualSaaS;
    // Break-even period in months
    const breakEvenMonths = Math.max(1, (implementationCost / ((estimatedSavings - annualSaaS) / 12)));

    return {
      implementationCost,
      monthlySaaS,
      estimatedSavings,
      breakEvenMonths: breakEvenMonths.toFixed(1),
      netSavingsFirstYear: Math.max(0, netSavingsFirstYear)
    };
  };

  const roiResult = calculateROI();

  // Handle Pilot proposal generation with Gemini API Integration!
  const handleGenerateProposal = async (e: FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !contactEmail.trim() || isGeneratingProposal) return;

    setIsGeneratingProposal(true);
    setProposalResult(null);
    setProposalError(null);

    try {
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          activeTwin: 'general_consulting',
          telemetry: {
            companyName,
            proposalSector,
            contactEmail,
            challengeText: challengeText || "Algemene digitalisering en optimalisatie."
          },
          message: `Genereer een uiterst professioneel en overtuigend B2B Digital Twin & Dashboard Pilot Project Voorstel voor het bedrijf '${companyName}' actief in de sector '${proposalSector}'. ` +
                   `Hun belangrijkste uitdaging is: '${challengeText || "Ze willen live inzicht en predictive alerts op hun operationele data."}'. ` +
                   `Structuur het rapport heel duidelijk met de volgende Nederlandse koppen om een professionele indruk achter te laten:\n` +
                   `- **1. EXECUTIVE SAMENVATTING**: Waarom een digital twin cruciaal is voor ${companyName} om hun uitdaging aan te pakken.\n` +
                   `- **2. ARCHITECTUUR & SENSOR-DATA** (Modbus/LoRaWAN/API koppelingen gebaseerd op hun sector).\n` +
                   `- **3. HET LIVE INTERACTIEVE DASHBOARD**: Beschrijf welke KPI's we live gaan visualiseren en de voordelen van een 'Wat-Als' scenario-simulator.\n` +
                   `- **4. PREDICTIEF ADVIES DOOR CO-PILOT LETA**: Hoe onze AI-module hen helpt storingen te vermijden.\n` +
                   `- **5. PILOT PROJECT PLANNING & KOSTEN**: Een strakke 4-weken roadmap met een geschatte ROI.\n` +
                   `Gebruik een bemoedigende, overtuigende, deskundige toon en vermijd vage placeholders. Schrijf direct alsof je hun expert-consultant bent.`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Kon geen voorstel genereren.");
      }

      setProposalResult(data.text);
    } catch (err: any) {
      console.error(err);
      setProposalError(err.message || "Er is een verbindingsfout opgetreden tijdens het genereren van uw voorstel.");
    } finally {
      setIsGeneratingProposal(false);
    }
  };

  return (
    <div className="dot-bg min-h-screen bg-[#07090F] text-slate-200 flex flex-col justify-between" id="landing-page-root">
      {/* Background ambient decoration */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(#1E40AF 0.8px, transparent 0.8px)", backgroundSize: "32px 32px" }}></div>
      <div className="absolute top-10 right-1/4 h-[500px] w-[500px] rounded-full bg-blue-600/5 blur-[150px] pointer-events-none"></div>
      <div className="absolute top-[800px] left-10 h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-[180px] pointer-events-none"></div>
      <div className="absolute bottom-[600px] right-20 h-[500px] w-[500px] rounded-full bg-purple-600/5 blur-[140px] pointer-events-none"></div>

      {/* 1. HERO SECTION */}
      <section className="relative px-4 pt-20 pb-16 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center z-10 w-full">
        {/* Trust Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.25em] rounded-md mb-8 w-fit shadow-inner">
          <Award className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
          Realtime Digital Twin & SCADA Dashboards Specialist
        </div>

        <h1 className="font-display text-4xl sm:text-[68px] font-black leading-[1.05] text-white mb-6 tracking-tight max-w-5xl">
          Verander ruwe sensordata in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400">voorspelbare</span> operationele <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-300">perfectie</span>.
        </h1>

        <p className="max-w-3xl text-slate-400 text-sm sm:text-base mb-10 leading-relaxed font-sans">
          Beheert u een fabriek, een gemeentelijk energienetwerk of een logistieke keten? Wij bouwen op maat gemaakte, interactieve <strong>Digital Twins</strong> en dashboards. Krijg direct grip op wat er <strong>NU</strong> gebeurt, simuleer complexe <strong>"Wat-Als" scenario's</strong>, en reduceer faalkosten met onze intelligente <strong>Leta AI Co-pilot</strong>.
        </p>

        {/* Dynamic CTA buttons row */}
        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <button
            id="start-exploring-btn"
            onClick={() => setTab('dashboard')}
            className="cursor-pointer px-8 py-4.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-full uppercase tracking-widest transition-all border border-blue-400/30 shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-2.5 hover:scale-[1.02] active:scale-95"
          >
            <span>Bekijk Industriële Replicas (Live Control Room)</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          
          <a
            href="#pilot-tool"
            className="cursor-pointer px-8 py-4.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center space-x-2"
          >
            <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
            <span>Genereer een Pilot Voorstel</span>
          </a>
        </div>

        {/* 3 Pillar Strategic Value Propositions */}
        <div className="grid gap-6 md:grid-cols-3 w-full mb-8 text-left" id="philosophy-grid">
          {philosophyItems.map((item, idx) => (
            <div key={idx} className="p-6 rounded-2xl border border-white/10 bg-white/5 flex flex-col justify-between backdrop-blur-sm shadow-xl hover:border-white/20 hover:-translate-y-1 transition-all group">
              <div>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-2 font-display">{item.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-sans">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. LIVE CASE STUDIES SHOWCASE */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full z-10 border-t border-white/5" id="live-twins-showcase">
        <div className="text-center mb-10">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">INTERACTIEVE PORTFOLIO</span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight">
            ONZE WERKEND OPGELEVERDE DIGITAL TWINS
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed">
            Klik op een van onze drie referentieprojecten om direct de live, operationele web-replica's te testen die we aanbieden en hun real-time telemetry te inspecteren.
          </p>
        </div>

        {/* Interactive Selector Pill tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8" id="live-tab-controllers">
          {previewTwins.map((t) => (
            <button
              key={t.id}
              onClick={() => setActivePreviewTwin(t.id)}
              className={`cursor-pointer px-5 py-3 rounded-xl border text-[11px] font-bold uppercase tracking-wide transition-all ${
                activePreviewTwin === t.id
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-[#0E121E]/80 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{t.company}</span>
            </button>
          ))}
        </div>

        {/* Live embedding block with control specs */}
        <div className="grid gap-6 lg:grid-cols-12 items-stretch" id="live-preview-container">
          {/* Iframe Viewport (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0A0C14] overflow-hidden relative min-h-[520px] shadow-2xl">
            <div className="relative w-full h-full min-h-[520px]">
              <iframe
                src={currentPreview.iframeUrl}
                title={currentPreview.name}
                className="w-full h-full min-h-[520px] border-none"
                allow="geolocation; microphone; camera; midi; encrypted-media;"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              
              {/* Simulated browser navigation status bar overlay */}
              <div className="absolute top-0 left-0 right-0 h-10 bg-[#07090F]/90 backdrop-blur border-b border-white/10 flex items-center justify-between px-4 text-[10px] font-mono text-slate-400 z-20">
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="font-bold text-slate-300 text-[9px] uppercase tracking-wider">Gateway status: Gekoppeld & Live</span>
                </div>
                <div className="flex items-center space-x-1.5 text-blue-400 hover:text-blue-300 transition-colors">
                  <span>Bron:</span>
                  <a href={currentPreview.iframeUrl} target="_blank" rel="noreferrer" className="underline flex items-center font-bold">
                    {currentPreview.iframeUrl.replace("https://", "")} <ArrowUpRight className="h-3 w-3 ml-0.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Details Column for Selected Case (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="space-y-6">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-mono text-blue-400 font-bold block mb-1">
                  Werkend IoT Referentie-Model
                </span>
                <h3 className="text-xl font-extrabold font-display text-white leading-tight">
                  {currentPreview.name}
                </h3>
              </div>

              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-sans">
                {currentPreview.description}
              </p>

              {/* Badges/Tags */}
              <div className="flex flex-wrap gap-1.5" id="preview-tags">
                {currentPreview.badges.map((b, idx) => (
                  <span key={idx} className="px-2.5 py-1 text-[9px] font-mono font-bold text-blue-300 rounded bg-blue-500/10 border border-blue-500/20">
                    #{b}
                  </span>
                ))}
              </div>

              {/* Status metrics widget */}
              <div className="space-y-2.5 pt-4 border-t border-white/5">
                <span className="block text-[10px] font-mono tracking-widest text-slate-500 uppercase">
                  Operationele KPI's & Real-time Alerts
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {currentPreview.keyStats.map((stat, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-[#07090F] px-3.5 py-2.5 rounded-xl border border-white/5 text-[11px] font-mono">
                      <span className="text-slate-500 font-semibold">{stat.label}</span>
                      <span className="text-white font-bold">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/5 space-y-3">
              <button
                onClick={() => onStartTwin(currentPreview.id)}
                className="cursor-pointer w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-[11px] font-bold rounded-xl uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-md hover:scale-[1.01]"
              >
                <span>Open Simulator & Sensorknoppen</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
              
              <button
                onClick={() => setTab('ai-lab')}
                className="cursor-pointer w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-[10px] font-bold rounded-xl uppercase tracking-wider flex items-center justify-center space-x-2 transition-all animate-pulse"
              >
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>Stel AI Analyse-vraag over deze twin</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BUSINESS METHODOLOGY SECTION */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full z-10 border-t border-white/5 bg-[#07090F]/45">
        <div className="text-center mb-12">
          <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-1">STRATEGISCHE AANPAK</span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">Onze 4-Stappen Methodologie</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-xs sm:text-sm">
            Van legacy-installaties naar een levende en intelligente overzichtsplaat. Dit is hoe wij te werk gaan:
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-4 font-sans text-xs">
          <div className="p-5.5 rounded-2xl border border-white/5 bg-white/5 space-y-3">
            <span className="text-2xl font-black text-blue-500 font-display">01</span>
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">Sensor & API Koppeling</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              We koppelen uw fysieke installaties aan onze SCADA gateways via standaard industrie-protocollen zoals OPC-UA, Modbus/TCP, MQTT en moderne REST APIs.
            </p>
          </div>
          <div className="p-5.5 rounded-2xl border border-white/5 bg-white/5 space-y-3">
            <span className="text-2xl font-black text-cyan-400 font-display">02</span>
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">Aangepaste Visualisatie</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Onze engineers ontwerpen een overzichtelijke en drempelvrije 2D (schematische) of high-fidelity 3D replica van uw machines, bedrijfspand, of logistieke hub.
            </p>
          </div>
          <div className="p-5.5 rounded-2xl border border-white/5 bg-white/5 space-y-3">
            <span className="text-2xl font-black text-purple-400 font-display">03</span>
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">Scenario Planner Integration</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              We configureren 'hefbomen' waarmee u onder gecontroleerde omstandigheden stress tests en pieksimulaties uitvoert om bottlenecks vroegtijdig bloot te leggen.
            </p>
          </div>
          <div className="p-5.5 rounded-2xl border border-white/5 bg-white/5 space-y-3">
            <span className="text-2xl font-black text-emerald-400 font-display">04</span>
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">Leta AI Integratie</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              We integreren ons Gemini Large Language Model met uw data. De Co-pilot leest de telemetry live en geeft drempelvrij predictief onderhoudsadvies.
            </p>
          </div>
        </div>
      </section>

      {/* 4. DYNAMIC ROI & PRICING CALCULATOR */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full z-10 border-t border-white/5" id="roi-calculator">
        <div className="text-center mb-12">
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest block mb-1">BESPARINGEN ANALYSE</span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">Interactieve ROI & Kosten Calculator</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-xs sm:text-sm">
            Bereken de geschatte opstartkosten, maandelijkse licenties en het financiële voordeel van de inzet van een op maat gemaakte Digital Twin.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12 items-stretch">
          
          {/* Sliders Area (7 Cols) */}
          <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Sector Selection Toggle */}
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 font-bold">Selecteer Uw Sector</label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    onClick={() => setSelectedSector('industry')}
                    className={`cursor-pointer py-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${
                      selectedSector === 'industry'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                        : 'bg-black/35 border-white/5 text-slate-450 hover:bg-white/5'
                    }`}
                  >
                    🏗️ Industrie / Fabriek
                  </button>
                  <button
                    onClick={() => setSelectedSector('smartcity')}
                    className={`cursor-pointer py-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${
                      selectedSector === 'smartcity'
                        ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-500/30 border-cyan-500 text-cyan-400 font-extrabold'
                        : 'bg-black/35 border-white/5 text-slate-455 hover:bg-white/5'
                    }`}
                  >
                    🏛️ Smart City / infra
                  </button>
                  <button
                    onClick={() => setSelectedSector('retail')}
                    className={`cursor-pointer py-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${
                      selectedSector === 'retail'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                        : 'bg-black/35 border-white/5 text-slate-450 hover:bg-white/5'
                    }`}
                  >
                    🥬 Retail / Supermarkt
                  </button>
                </div>
              </div>

              {/* Sensor count Slider */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-slate-400 font-semibold">Aantal Sensoren / Machines / Assets</span>
                  <span className="text-white font-bold px-2 py-0.5 bg-black/40 rounded border border-white/10">{sensorCount} meetpunten</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="500"
                  value={sensorCount}
                  onChange={(e) => setSensorCount(parseInt(e.target.value))}
                  className="w-full accent-blue-500 h-1 bg-slate-900 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-550 mt-1">
                  <span>Min: 5 meetpunten</span>
                  <span>Max: 500 meetpunten</span>
                </div>
              </div>

              {/* Annual Budget spend Slider */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-slate-400 font-semibold">Huidige Jaarlijkse Operationele Kosten / Storingsboetes</span>
                  <span className="text-emerald-400 font-bold px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">€{annualSpend.toLocaleString('nl-NL')}</span>
                </div>
                <input
                  type="range"
                  min="20000"
                  max="2000000"
                  step="10000"
                  value={annualSpend}
                  onChange={(e) => setAnnualSpend(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 h-1 bg-slate-900 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-550 mt-1">
                  <span>€20.000,-</span>
                  <span>€2.000.000,-</span>
                </div>
              </div>

            </div>

            {/* Note indicator */}
            <div className="mt-6 flex items-start space-x-2.5 p-3 rounded-xl bg-black/30 text-[10px] text-slate-500 leading-normal border border-white/5 font-mono">
              <AlertTriangle className="h-4 w-4 text-cyan-500 shrink-0 mt-0.5" />
              <span>
                De efficiencyverbeteringen zijn gebaseerd op werkelijke data uit onze referentie-casussen en representeren gemiddelde faalkostreducties van 10% tot 16% in het eerste jaar.
              </span>
            </div>
          </div>

          {/* Savings Calculations Panel (5 Cols) */}
          <div className="lg:col-span-12 xl:col-span-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 flex flex-col justify-between shadow-xl">
            <div className="space-y-5">
              <div className="border-b border-emerald-500/10 pb-4">
                <span className="text-[10px] font-mono text-emerald-400 tracking-wider uppercase block mb-1 font-bold">Uw Financiële Prognose</span>
                <h3 className="text-lg font-black font-display text-white">Let's-Twin Rendement</h3>
              </div>

              <div className="space-y-3.5 text-xs font-mono">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Opstart & Ontwikkelingskosten:</span>
                  <span className="text-white font-bold">€{roiResult.implementationCost.toLocaleString('nl-NL')},-</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Licentiekosten p/mnd (SaaS):</span>
                  <span className="text-white font-bold">€{Math.round(roiResult.monthlySaaS)}/mnd</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-white/5 pt-3">
                  <span className="text-slate-400">Verwachte Besparingen p/jr:</span>
                  <span className="text-emerald-400 font-black text-sm">€{Math.round(roiResult.estimatedSavings).toLocaleString('nl-NL')},-</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Terugverdientijd:</span>
                  <span className="text-cyan-400 font-bold px-2 py-0.5 bg-cyan-400/10 rounded">{roiResult.breakEvenMonths} maanden</span>
                </div>
              </div>

              {/* Projected net year savings banner */}
              <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/20 text-center space-y-1 mt-6">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono block">Instapjaar Netto Resultaat (incl. installatie)</span>
                <span className="text-2xl font-black font-display text-emerald-400">
                  + €{Math.round(roiResult.netSavingsFirstYear).toLocaleString('nl-NL')}
                </span>
                <span className="block text-[8px] text-slate-500 font-mono">Positief resultaat behaald vanaf maand {Math.ceil(parseFloat(roiResult.breakEvenMonths))}</span>
              </div>
            </div>

            <div className="mt-8">
              <a
                href="#pilot-tool"
                className="cursor-pointer block text-center w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-xl uppercase tracking-wider transition-all border border-emerald-400/30 font-sans shadow-lg shadow-emerald-600/10"
              >
                Vraag Direct Een Pilot Project Aan
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* 5. INTERACTIVE PILOT PROJECT GENERATOR (AI SECURE POWERED) */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full z-10 border-t border-white/5" id="pilot-tool">
        <div className="text-center mb-10">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">GEEN VERPLICHTING</span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">Simuleer Uw Eigen Digital Twin</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-xs sm:text-sm">
            Vul uw bedrijfsnaam, sector en specifieke operational pain-points in. Onze Leta AI-module stelt direct een unieke, realistische digital twin pilot voor u op.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12 items-stretch">
          
          {/* Submission Form (5 Cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md flex flex-col justify-between">
            <form onSubmit={handleGenerateProposal} className="space-y-4.5">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1.5 font-bold">Bedrijfsnaam</label>
                <input
                  type="text"
                  required
                  placeholder="Bijv. Jansen Food Logistics of Groothandel BV"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#07090F]/80 border border-white/10 rounded-xl py-3 px-4 text-xs md:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1.5 font-bold">Branche / Sector</label>
                <select
                  value={proposalSector}
                  onChange={(e) => setProposalSector(e.target.value)}
                  className="w-full bg-[#07090F]/80 border border-white/10 rounded-xl py-3 px-4 text-xs md:text-sm text-white focus:outline-none focus:border-blue-500/55 transition-all"
                >
                  <option value="Maakindustrie & Machinebouw">Maakindustrie & Machinebouw</option>
                  <option value="Smart Government & Openbaar Beheer">Smart Government & Openbaar Beheer</option>
                  <option value="Retail & Koelcel Distributienetwerk">Retail & Koelcel Distributienetwerk</option>
                  <option value="Smart Energy & Zonneparken">Smart Energy & Zonneparken</option>
                  <option value="Logistiek, Transport & Warehousing">Logistiek, Transport & Warehousing</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1.5 font-bold">Zakelijk Emailadres</label>
                <input
                  type="email"
                  required
                  placeholder="naam@bedrijf.nl"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-[#07090F]/80 border border-white/10 rounded-xl py-3 px-4 text-xs md:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1.5 font-bold">Operationele Uitdaging</label>
                  <span className="text-[9px] text-slate-500 italic font-mono">Optioneel</span>
                </div>
                <textarea
                  placeholder="Bijv. 'Wij kampen met te grote stilstand van onze sorteerbanden', 'Winkelmedewerkers weten niet wanneer koelingen falen', etc."
                  value={challengeText}
                  onChange={(e) => setChallengeText(e.target.value)}
                  rows={3}
                  className="w-full bg-[#07090F]/80 border border-white/10 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-sans resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isGeneratingProposal || !companyName.trim() || !contactEmail.trim()}
                className="cursor-pointer w-full py-4 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-xl uppercase tracking-widest transition-all border border-blue-400/30 flex items-center justify-center space-x-2 disabled:opacity-40"
              >
                {isGeneratingProposal ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1" />
                    <span>Leta rekent uw digital twin uit...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                    <span>Genereer Realtime Pilot Plan</span>
                  </>
                )}
              </button>
            </form>

            <div className="p-3 bg-black/30 rounded-xl text-[10px] text-slate-500 mt-4 leading-normal font-mono border border-white/5">
              <span>Opmerking: Dit is een live AI-integratie. Uw input wordt verwerkt door Gemini 3.5-Flash via een beveiligde serververbinding om een nauwkeurig business-voorstel te compileren.</span>
            </div>
          </div>

          {/* Proposal Document Output Area (7 Cols) */}
          <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-[#0E121E]/80 backdrop-blur-md flex flex-col justify-between overflow-hidden shadow-2xl min-h-[460px]">
            {proposalResult ? (
              <div className="p-6 flex flex-col justify-between h-full space-y-4 animate-fade-in">
                {/* Header of Proposal document */}
                <div className="flex justify-between items-center pb-3 border-b border-white/5" id="proposals-viewer-header">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-cyan-400 animate-pulse" />
                    <div>
                      <span className="block text-[8px] font-mono text-slate-500 uppercase font-black">Ontvangen Pilot Voorbereiding</span>
                      <h4 className="text-xs font-bold text-white font-mono uppercase tracking-tight">{companyName} Twin Blueprint</h4>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if(typeof window !== "undefined") window.print();
                    }}
                    className="cursor-pointer text-[10px] font-mono text-slate-450 border border-white/10 rounded px-2.5 py-1 hover:text-white hover:bg-white/5 transition-all"
                  >
                    Printers weergave
                  </button>
                </div>

                {/* Main Scrollable Report */}
                <div className="flex-grow overflow-y-auto max-h-[380px] p-4 bg-black/40 rounded-xl border border-white/5 text-xs text-slate-300 leading-relaxed font-sans space-y-3.5 whitespace-pre-line mr-1">
                  {proposalResult}
                </div>

                {/* Final Booking Trigger */}
                <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                  <div>
                    <span className="block text-[10px] font-mono text-slate-500 font-bold uppercase">Leta AI Blueprint Compiler</span>
                    <span className="block text-[11px] text-emerald-400 font-mono font-semibold">Geproduceerd in {new Date().toLocaleDateString('nl-NL')}</span>
                  </div>
                  
                  <button
                    onClick={() => {
                      alert(`Hartelijk dank voor uw interesse! Er is een simulatie-notificatie verstuurd naar ${contactEmail}. We sturen u direct een uitnodiging.`);
                    }}
                    className="cursor-pointer px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg tracking-wider uppercase flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <PhoneCall className="h-3.5 w-3.5" />
                    <span>Boek Direct Demo Afspraak</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center p-8 text-center" id="proposals-placeholder">
                <FileText className="h-14 w-14 text-slate-700 mb-4 animate-pulse" />
                <h4 className="text-sm font-bold font-display text-white mb-2">Uw Digitale Blauwdruk Wacht</h4>
                <p className="text-slate-500 max-w-sm text-xs leading-relaxed font-sans">
                  Vul het formulier aan de linkerkant in om Leta AI direct uw op maat gemaakte digital twin architectuur en ROI prognose te laten berekenen.
                </p>
                {isGeneratingProposal && (
                  <div className="mt-6 flex flex-col items-center space-y-2">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 animate-duration-1000"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                    </span>
                    <span className="text-[10px] text-slate-450 font-mono">Sensoring, API & kosten ratio calculatie gaande...</span>
                  </div>
                )}
                {proposalError && (
                  <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-rose-400 font-mono text-[10px] max-w-xs">
                    {proposalError}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 6. TRUSTED TESTIMONIALS */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full z-10 border-t border-white/5 bg-[#07090F]">
        <div className="text-center mb-12">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">KLANTEN SUCCESSEN</span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">Vraag Het Onze Partners</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-xs sm:text-sm">
            Echte betrouwbaarheid door bewezen faalkostenreductie en smart datapunten.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 font-sans text-xs" id="testimonials-grid">
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 flex flex-col justify-between backdrop-blur-sm">
            <p className="italic text-slate-400 leading-relaxed">
              "Voor onze hoogwaardige frituursystemen hadden we behoefte aan realtime SCADA telemetry op de robots en lasersnijders. Dit digital twin platform van Let's-Twin gaf ons direct grip op temperatuurpieken en reduceerde onze defecten met maar liefst 14,2%."
            </p>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center space-x-3">
              <span className="h-8 w-8 rounded-full bg-blue-600/20 text-blue-400 font-bold font-display uppercase flex items-center justify-center">QB</span>
              <div>
                <span className="block font-bold text-white text-[11px]">Dhr. Van den Berg</span>
                <span className="block text-[9px] text-slate-500 font-mono uppercase">Hoofd Operations • QBTEC</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 flex flex-col justify-between backdrop-blur-sm">
            <p className="italic text-slate-400 leading-relaxed">
              "We beheren hiermee de stedelijke afwatering en hittestress in de binnenstad van Woerden. Dankzij de 'Wat-Als' scenariosimulatie weten we exact wanneer de poldergemalen preventief open moeten bij heftige wolkbreuken van 42mm neerslag."
            </p>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center space-x-3">
              <span className="h-8 w-8 rounded-full bg-cyan-600/20 text-cyan-400 font-bold font-display uppercase flex items-center justify-center">GW</span>
              <div>
                <span className="block font-bold text-white text-[11px]">Mevr. De Vries</span>
                <span className="block text-[9px] text-slate-500 font-mono uppercase">Smart City Lead • Gemeente Woerden</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 flex flex-col justify-between backdrop-blur-sm">
            <p className="italic text-slate-400 leading-relaxed">
              "In de retail telt elke seconde wachtrij en elke graad temperatuurafwijking in de diepvries. Dit operationele dashboard integreert onze sensoren vlekkeloos en stuurt proactief kassa-bezettingen aan wegens realtime klantstromen."
            </p>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center space-x-3">
              <span className="h-8 w-8 rounded-full bg-purple-600/20 text-purple-400 font-bold font-display uppercase flex items-center justify-center">RT</span>
              <div>
                <span className="block font-bold text-white text-[11px]">Ir. Jansen</span>
                <span className="block text-[9px] text-slate-500 font-mono uppercase">Directeur Logistiek • Predictive Retail</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. DETAILED FOOTER */}
      <footer className="mt-auto shrink-0 bg-[#07090F] border-t border-white/5 flex flex-col md:flex-row items-center justify-between px-12 py-8 z-10 text-slate-500 text-[10px] font-mono gap-4">
        <div className="flex flex-col md:items-start text-center md:text-left">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">Let's-Twin Agency B.V.</span>
          <span className="text-xs font-semibold text-slate-300">Overheid • Fabriek • Retail</span>
        </div>
        <div className="flex flex-col md:items-start text-center md:text-left">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">AI Co-pilot Generative Engine</span>
          <span className="text-xs font-semibold text-slate-300">Gemini 3.5-Flash Core</span>
        </div>
        <div className="flex flex-col md:items-start text-center md:text-left">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">Sensors Protocols</span>
          <span className="text-xs font-semibold text-slate-300">MQTT, Modbus/TCP, LoRaWAN, API</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-emerald-450 font-bold tracking-wide uppercase flex items-center space-x-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-450 animate-pulse inline-block mr-1" />
            <span>Systeem Status: Live Online</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
