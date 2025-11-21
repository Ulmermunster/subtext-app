import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Zap, ShieldAlert, Lock, Activity, Share2, X, Settings, 
  Eye, Sparkles, ArrowRight, MessageSquare, Smartphone,
  Fingerprint, Skull, Ghost, FileSearch, ScanEye
} from 'lucide-react';

/**
 * SUBTEXT V2.4 - CENTERED ICON
 * * CHANGE LOG:
 * - Fixed CSS to perfectly center the upload icon inside its circular container.
 */

// --- THE APP COMPONENT ---
const AnalysisApp = ({ onBack }: { onBack: () => void }) => {
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [analyzeText, setAnalyzeText] = useState("INITIATE PSYCH EVAl");

  // Randomize the button text for fun
  useEffect(() => {
    const options = [
      "EXPOSE THE LIES",
      "UNPACK THE TRAUMA",
      "DECODE THE SUBTEXT",
      "RUN FORENSIC AUDIT",
      "CHECK FOR GASLIGHTING"
    ];
    setAnalyzeText(options[Math.floor(Math.random() * options.length)]);
  }, [image]);

  // MOCK DATA
  const mockResult = {
    powerDynamic: "70/30 (Advantage: THEM)",
    powerExplanation: "You (Right side) are double-texting with paragraphs. They (Left side) are responding with single lines hours later.",
    signals: [
      { title: "The Alignment Gap", interpretation: "Notice how much blue/green ink is on the right vs grey on the left. You are over-investing." },
      { title: "The 'Haha' Shield", interpretation: "You used 'haha' at the end of a serious question. You are terrified of being perceived as intense." },
      { title: "Latency Power Play", interpretation: "They waited 45 minutes to reply to your instant response." }
    ],
    translation: {
      quote: "I'm just super busy with work rn",
      meaning: "I am keeping you in orbit as a backup option while I pursue someone I actually like."
    },
    forecast: "They will ghost you for 3 days, then send a meme to check if you're still hooked.",
    brutalTruth: "You are auditioning for a role in their life that has already been cast."
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setScanProgress(0);
    setError(null);

    // Animation timer
    const interval = setInterval(() => {
      setScanProgress((prev) => (prev >= 90 ? prev : prev + 5));
    }, 200);

    try {
      if (!apiKey) {
        // SIMULATION MODE
        await new Promise(resolve => setTimeout(resolve, 3500));
        setResult(mockResult);
      } else {
        // REAL AI MODE
        await analyzeWithGPT4(image);
      }
    } catch (err: any) {
      setError(err.message || "Analysis failed.");
    } finally {
      clearInterval(interval);
      setScanProgress(100);
      setIsAnalyzing(false);
    }
  };

  const analyzeWithGPT4 = async (base64Image: string) => {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o", 
          messages: [
            {
              role: "system",
              content: `You are "Subtext," an advanced forensic behavioral AI.

              CRITICAL VISUAL INSTRUCTION:
              You are analyzing a mobile phone screenshot of a conversation.
              1. IDENTIFY THE SPEAKERS BY POSITION (NOT COLOR):
                 - Bubbles aligned to the RIGHT side of the screen = THE USER (The person who submitted this image).
                 - Bubbles aligned to the LEFT side of the screen = THE OTHER PERSON (The Target).
                 - IGNORE color (Blue/Green/Grey/White). Position is the only truth.

              2. ANALYZE THE DYNAMICS:
                 - Compare the volume of text on the RIGHT vs the LEFT.
                 - Look at timestamps.
                 - Look at linguistic effort (punctuation, capitalization).

              3. OUTPUT FORMAT:
              Return ONLY a raw JSON object with these keys:
              - powerDynamic: string (e.g. "60/40 Advantage Them")
              - powerExplanation: string (One sharp sentence explaining why, referencing "You" for right side and "Them" for left side)
              - signals: array of 3 objects [{ title: string, interpretation: string }]
              - translation: object { quote: string, meaning: string }
              - forecast: string (Prediction of future behavior)
              - brutalTruth: string (The final savage takeaway)

              TONE: Clinical, cutting, no fluff. Gen-Z Sherlock Holmes.`
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Analyze this conversation. Remember: Right side is ME, Left side is THEM." },
                { type: "image_url", image_url: { url: base64Image } }
              ]
            }
          ],
          max_tokens: 800
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      const content = data.choices[0].message.content;
      const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        setResult(JSON.parse(cleanJson));
      } catch (e) {
        throw new Error("AI malfunction. Please try a clearer screenshot.");
      }

    } catch (err: any) {
      console.error(err);
      throw new Error("Failed to connect. Check your API Key.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans animate-in fade-in duration-500">
      {/* HEADER */}
      <header className="border-b border-gray-800 p-4 flex justify-between items-center bg-black/90 sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
          <Eye className="text-blue-500 w-6 h-6" />
          <span className="font-bold text-xl tracking-tighter text-white">SUBTEXT</span>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-gray-900 rounded-full">
          <Settings className="w-5 h-5 text-gray-400" />
        </button>
      </header>

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="bg-gray-900 border-b border-gray-800 p-6 animate-slide-down">
          <h3 className="text-white font-bold mb-2 flex items-center gap-2"><Lock className="w-4 h-4" /> Configuration</h3>
          <p className="text-xs text-gray-500 mb-3">Paste your OpenAI API Key to enable the real AI brain.</p>
          <input 
            type="password" 
            placeholder="sk-..." 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded p-3 text-white text-sm mb-4 focus:border-blue-500 outline-none"
          />
          <div className="flex justify-end">
             <button onClick={() => setShowSettings(false)} className="text-sm text-gray-400 hover:text-white">Close</button>
          </div>
        </div>
      )}

      {/* MAIN UI */}
      <main className="max-w-md mx-auto p-4 pb-20">
        {!image ? (
          // STATE 1: NO IMAGE UPLOADED
          // Only the Icon is clickable. No big button yet.
          <div className="mt-20 flex flex-col items-center text-center space-y-8">

            {/* CLICKABLE UPLOAD ICON */}
            <label className="group relative cursor-pointer w-32 h-32 flex items-center justify-center">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

              {/* Pulsing rings */}
              <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping opacity-75"></div>
              <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-pulse delay-100"></div>

              {/* Main Circle - FIXED CSS HERE */}
              <div className="w-full h-full bg-gray-900 rounded-full flex items-center justify-center border-2 border-gray-800 relative z-10 group-hover:border-blue-500 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all duration-300">
                <Upload className="w-12 h-12 text-gray-400 group-hover:text-blue-400 group-hover:scale-110 transition-transform duration-300 flex-shrink-0" />
              </div>
            </label>

             {/* Label */}
            <div className="space-y-2">
                <h2 className="text-3xl font-black text-white tracking-tight group-hover:text-blue-400 transition-colors pointer-events-none">UPLOAD EVIDENCE</h2>
                <p className="text-gray-500 text-sm font-mono pointer-events-none">TAP TO ACCESS CAMERA ROLL</p>
            </div>

            <div className="pt-10 opacity-50 hover:opacity-100 transition-opacity">
              <button onClick={() => { setImage("https://placehold.co/400x600/1a1a1a/white?text=Simulation+Image"); setTimeout(() => runAnalysis(), 500); }} className="text-xs text-gray-500 hover:text-white flex items-center gap-1 border border-gray-800 px-3 py-1 rounded-full">
                <Sparkles className="w-3 h-3" /> OR TRY DEMO MODE
              </button>
            </div>
          </div>
        ) : (
          // STATE 2: IMAGE LOADED -> READY TO ANALYZE
          <div className="flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative rounded-xl overflow-hidden border border-gray-800 bg-gray-900 aspect-[9/16] shadow-2xl">
              <img src={image} alt="Upload" className="w-full h-full object-cover opacity-80" />

              {/* SCANNER OVERLAY (Only shows when isAnalyzing is true) */}
              {isAnalyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/60 backdrop-blur-sm">
                  <div className="w-full h-1 bg-blue-500 shadow-[0_0_20px_#3b82f6] absolute top-0 animate-[scan_2s_ease-in-out_infinite]"></div>
                  <div className="bg-black/90 px-6 py-4 rounded-xl border border-blue-500/30 flex flex-col items-center shadow-2xl">
                    <Activity className="w-8 h-8 text-blue-500 animate-pulse mb-3" />
                    <span className="font-mono text-blue-400 text-xs tracking-widest uppercase">Extracting Subtext...</span>
                    <div className="w-48 bg-gray-800 h-1 mt-4 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full transition-all duration-200" style={{width: `${scanProgress}%`}}></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Close Button (Only when not analyzing) */}
              {!isAnalyzing && (
                <div className="absolute top-3 right-3 z-20">
                   <button onClick={() => setImage(null)} className="bg-black/60 p-2 rounded-full text-white hover:bg-red-500/80 transition-colors backdrop-blur"><X className="w-5 h-5" /></button>
                </div>
              )}
            </div>

            {/* THE ACTION BUTTON - ONLY APPEARS NOW */}
            {!isAnalyzing && !result && (
              <div className="space-y-3">
                <button 
                  onClick={runAnalysis}
                  className="w-full bg-white text-black font-black text-lg py-4 rounded-xl hover:bg-blue-500 hover:text-white hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 uppercase tracking-wider"
                >
                  <ScanEye className="w-6 h-6" /> {analyzeText}
                </button>
                <p className="text-center text-xs text-gray-600 font-mono">WARNING: RESULTS MAY BE BRUTAL</p>
              </div>
            )}

            {error && <div className="bg-red-900/20 border border-red-800 text-red-400 p-4 rounded-lg text-sm text-center">{error}</div>}

            {/* REPORT CARD */}
            {result && (
              <div className="animate-in slide-in-from-bottom-10 duration-700 pb-10">
                <div className="bg-zinc-950 border border-gray-800 rounded-xl overflow-hidden shadow-2xl relative">
                  <div className="bg-stripes h-2 w-full opacity-20"></div>
                  <div className="p-6 space-y-6">

                    {/* HEADER */}
                    <div className="flex justify-between items-start border-b border-gray-800 pb-4">
                      <div>
                        <h2 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">CASE FILE #8821</h2>
                        <h1 className="text-2xl font-bold text-white">SUBTEXT REPORT</h1>
                      </div>
                      <div className="text-right"><div className="text-xs font-mono text-red-500 animate-pulse">● CLASSIFIED</div></div>
                    </div>

                    {/* POWER */}
                    <div>
                      <h3 className="text-xs text-blue-400 font-bold uppercase mb-2 flex items-center gap-2"><Activity className="w-3 h-3" /> Power Dynamic</h3>
                      <div className="text-3xl font-black text-white mb-2 font-mono">{result.powerDynamic}</div>
                      <p className="text-sm text-gray-400 border-l-2 border-blue-500 pl-3">{result.powerExplanation}</p>
                    </div>

                    {/* SIGNALS */}
                    <div className="space-y-3">
                      <h3 className="text-xs text-yellow-500 font-bold uppercase mb-1 flex items-center gap-2"><Zap className="w-3 h-3" /> Signals Detected</h3>
                      {result.signals.map((signal: any, idx: number) => (
                        <div key={idx} className="bg-white/5 p-3 rounded border border-white/10">
                          <div className="text-sm font-bold text-gray-200 mb-1">{signal.title}</div>
                          <div className="text-xs text-gray-500">{signal.interpretation}</div>
                        </div>
                      ))}
                    </div>

                    {/* TRANSLATOR */}
                    <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded-lg">
                       <h3 className="text-xs text-blue-300 font-bold uppercase mb-3">Translation Engine</h3>
                       <div className="mb-2 text-sm text-gray-400 italic">"{result.translation.quote}"</div>
                       <div className="flex items-center gap-2 text-blue-500 text-sm font-bold"><span>↳</span><span>{result.translation.meaning}</span></div>
                    </div>

                    {/* TRUTH */}
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                       <h3 className="text-xs text-red-500 font-bold uppercase mb-2 flex items-center gap-2"><ShieldAlert className="w-3 h-3" /> Brutal Truth</h3>
                       <p className="text-white font-medium text-sm leading-relaxed">{result.brutalTruth}</p>
                    </div>
                  </div>

                  {/* FOOTER */}
                  <div className="bg-black p-4 border-t border-gray-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-gray-600" />
                      <span className="text-xs font-mono text-gray-600">GENERATED BY SUBTEXT</span>
                    </div>
                  </div>
                </div>

                <button className="w-full mt-4 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-colors font-medium mb-8">
                  <Share2 className="w-4 h-4" /> Share Report
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .bg-stripes {
          background-image: linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent);
          background-size: 10px 10px;
        }
      `}</style>
    </div>
  );
};

// --- THE LANDING PAGE COMPONENT ---
const LandingPage = ({ onLaunch }: { onLaunch: () => void }) => {
  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden">
      {/* HERO SECTION */}
      <section className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-red-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-4">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-mono text-gray-300 tracking-wider">AI FORENSICS ENGINE V2.0</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9]">
            TEXTING IS <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-gray-400">A GAME.</span> <br />
            START <span className="text-blue-600 relative inline-block">WINNING.</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            The world's first <strong>weaponized psychology</strong> app. Upload a screenshot. 
            Our AI detects passive aggression, hidden boredom, and manipulation instantly.
          </p>

          <div className="pt-8">
            <button 
              onClick={onLaunch}
              className="group relative bg-white text-black font-black text-lg px-10 py-5 rounded-full hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)] overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                SCAN YOUR TEXTS <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            <p className="text-xs text-gray-600 mt-4 font-mono">100% ANONYMOUS • ENCRYPTED • BRUTAL</p>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <div className="border-y border-white/10 bg-black/50 backdrop-blur overflow-hidden py-4">
        <div className="flex gap-12 animate-marquee whitespace-nowrap items-center opacity-50 font-mono text-sm tracking-widest text-gray-400">
          <span>🚩 RED FLAGS DETECTED</span>
          <span>👁️ GHOSTING PREDICTOR</span>
          <span>🧠 DELUSION METER</span>
          <span>💔 SUBTEXT DECODER</span>
          <span>🚩 RED FLAGS DETECTED</span>
        </div>
      </div>

      {/* FEATURES */}
      <section className="py-24 px-6 bg-zinc-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">DON'T ASK YOUR FRIENDS. <br /><span className="text-blue-500">ASK THE ALGORITHM.</span></h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl">
              <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-6">
                <Fingerprint className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Forensic Profiling</h3>
              <p className="text-gray-400 text-sm">We analyze punctuation and response times to build a psychological profile.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl">
              <div className="w-12 h-12 bg-red-900/30 rounded-lg flex items-center justify-center mb-6">
                <Skull className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">The Brutal Truth</h3>
              <p className="text-gray-400 text-sm">No sugar-coating. Our AI tells you if you are being ghosted or played.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl">
              <div className="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center mb-6">
                <Ghost className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Future Forecast</h3>
              <p className="text-gray-400 text-sm">Predictive modeling tells you if they will text back, and exactly what they will say.</p>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: inline-flex; animation: scroll 20s linear infinite; }
      `}</style>
    </div>
  );
};

// --- ROOT ---
export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  return (
    <>
      {currentView === 'landing' ? <LandingPage onLaunch={() => setCurrentView('app')} /> : <AnalysisApp onBack={() => setCurrentView('landing')} />}
    </>
  );
}