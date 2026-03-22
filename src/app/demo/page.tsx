"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal, Shield, Activity, Play, Square, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type LogEntry = {
  id: string;
  time: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
};

export default function DemoDashboardPage() {
  const [isActive, setIsActive] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([{
    id: "init",
    time: new Date().toLocaleTimeString(),
    message: "System initialized. Ready to engage algorithm auto-pilot.",
    type: "info"
  }]);
  const [stats, setStats] = useState({ videosLiked: 28, videosDisliked: 4, channelsSubbed: 142 });
  const [timeLeft, setTimeLeft] = useState<string>("--:--");
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // The Demo Loop
  useEffect(() => {
    let step = 0;
    let timer: NodeJS.Timeout;
    let isCancelled = false;

    const MOCK_SCENARIO = [
      { t: 0, msg: "Auto-pilot engaged. Utilizing randomized stealth intervals (30s-5m).", type: "success" },
      { t: 500, msg: "Slop-Punisher subsystem ONLINE. Engaging independent scan sweeps.", type: "info" },
      { t: 1500, msg: "Initializing Routine: Scanning subscriptions...", type: "info" },
      { t: 2500, msg: "✓ Aggregated Top 5 Subscriptions: 'Fireship', 'ThePrimeagen', 'Lex Fridman', 'Andrej Karpathy'", type: "success" },
      { t: 3500, msg: "Gemma 3 Synthesis Engine: Synthesizing search parameters...", type: "info" },
      { t: 5000, msg: "✓ Generated optimal search query: 'Advanced AI Architecture and Next.js Actions'", type: "success" },
      { t: 6500, msg: "Locating trending videos (published within 5 days, highly rated)...", type: "info" },
      { t: 8000, msg: "Transcription Density Checks: passed (Technical Depth Verified)", type: "success" },
      { t: 9000, msg: "[Positive Signal] Executed 'Like' on: 'Building a RAG App in Next.js 15' by ByteMaster", type: "success", like: true },
      { t: 10500, msg: "[Sleep] Bot blending in. Next algorithm strike in 0.5 minutes...", type: "warning" },
      { t: 14000, msg: "Initializing Sanitizer: Scanning YouTube Trending cache for clickbait...", type: "info" },
      { t: 16000, msg: "[Slop Detected] Explicitly Disliking: 'MY INSANE 24 HOUR CHALLENGE 😱' by ViralKing23", type: "error", dislike: true },
      { t: 17500, msg: "[Sanitizer] Negative Signal cannon arming in 3.1 minutes...", type: "warning" },
    ];

    if (isActive) {
      const runNext = () => {
        if (step < MOCK_SCENARIO.length && !isCancelled) {
          const action = MOCK_SCENARIO[step];
          const delay = step === 0 ? action.t : (action.t - MOCK_SCENARIO[step - 1].t);
          
          timer = setTimeout(() => {
            if (isCancelled) return;
            setLogs(prev => [...prev, {
              id: Math.random().toString(),
              time: new Date().toLocaleTimeString(),
              message: action.msg,
              type: action.type as any
            }]);
            
            if (action.like) setStats(s => ({ ...s, videosLiked: s.videosLiked + 1 }));
            if (action.dislike) setStats(s => ({ ...s, videosDisliked: s.videosDisliked + 1 }));

            step++;
            runNext();
          }, delay);
        }
      };
      runNext();

      // Fake timer count down from 30 seconds
      let s = 30;
      setTimeLeft(`00:30`);
      const tic = setInterval(() => {
        s--;
        if (s > 0 && !isCancelled) {
           setTimeLeft(`00:${s.toString().padStart(2, '0')}`);
        } else if (s <= 0) {
           setTimeLeft(`00:00`);
        }
      }, 1000);

      return () => { isCancelled = true; clearTimeout(timer); clearInterval(tic); };
    } else {
      setTimeLeft("--:--");
      setLogs(prev => [...prev, {
        id: Math.random().toString(),
        time: new Date().toLocaleTimeString(),
        message: "Auto-pilot disengaged. Standing by.",
        type: "warning"
      }]);
    }
  }, [isActive]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] bg-grid-white/[0.02]">
      {/* Navbar */}
      <nav className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-white tracking-wide">YoutubeRefiner</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 p-[2px]">
                <div className="w-full h-full rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden">
                   <div className="w-full h-full bg-primary/20" />
                </div>
              </div>
              <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">Demo User</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Sidebar - Controls & Stats */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
            
            {/* Control Panel */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Command Center
              </h2>
              
              <button
                onClick={() => setIsActive(!isActive)}
                className={cn(
                  "w-full py-4 rounded-xl flex items-center justify-center gap-3 font-semibold transition-all duration-300",
                  isActive 
                    ? "bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.15)]" 
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
                )}
              >
                {isActive ? (
                  <><Square className="w-5 h-5 fill-current" /> Stop Auto-Pilot</>
                ) : (
                  <><Play className="w-5 h-5 fill-current" /> Engage Auto-Pilot</>
                )}
              </button>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Status</span>
                  <span className={cn("font-medium flex items-center gap-2", isActive ? "text-primary animate-pulse" : "text-zinc-500")}>
                    <span className={cn("w-2 h-2 rounded-full", isActive ? "bg-primary shadow-[0_0_10px_rgba(168,85,247,0.8)]" : "bg-zinc-600")} />
                    {isActive ? "ACTIVE" : "STANDBY"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">LLM Engine</span>
                  <span className="text-zinc-300 font-mono">Gemma-3-27B</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Target Niche</span>
                  <span className="text-zinc-300 truncate max-w-[120px]">Subscribed Ops</span>
                </div>
              </div>
            </div>

            {/* Session Stats */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2 border-b border-white/10 pb-2">Session Telemetry</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider mb-1">Payloads Delivered</p>
                  <p className="text-4xl font-extrabold text-[#4ade80] text-glow-green">{stats.videosLiked}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider mb-1">Slop Destroyed</p>
                  <p className="text-4xl font-extrabold text-red-500 text-glow-red">{stats.videosDisliked}</p>
                </div>
                <div className="col-span-2 mt-2">
                  <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider mb-1">Next Strike In</p>
                  <p className={cn("text-3xl font-mono tracking-tighter", isActive ? "text-primary animate-pulse text-glow-primary" : "text-zinc-600")}>
                    {timeLeft}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Side - Terminal Output */}
          <div className="flex-1 glass-card rounded-2xl overflow-hidden flex flex-col h-[600px] border border-white/10 shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
            
            {/* Terminal Header */}
            <div className="bg-[#0f0f11] px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-mono text-zinc-400">agent_execution.log</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
              </div>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 font-mono text-sm p-4 overflow-y-auto bg-[#0a0a0A] selection:bg-primary/30">
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4">
                    <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                    <span className={cn(
                      "break-words",
                      log.type === "info" && "text-zinc-300",
                      log.type === "success" && "text-emerald-400",
                      log.type === "warning" && "text-amber-400",
                      log.type === "error" && "text-red-400 font-medium"
                    )}>
                      {log.message}
                    </span>
                  </div>
                ))}
                {isActive && (
                  <div className="flex items-center gap-2 text-zinc-500 mt-4">
                    <span className="animate-pulse">_</span>
                    <span className="text-xs">waiting for next algorithmic window...</span>
                  </div>
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
