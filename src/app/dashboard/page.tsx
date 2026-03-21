"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Play, Square, Terminal, TrendingUp } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface LogEntry {
  id: string;
  time: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

export default function Dashboard() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/");
    },
  });

  const [isActive, setIsActive] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([{
    id: "init",
    time: new Date().toLocaleTimeString(),
    message: "System initialized. Ready to engage algorithm auto-pilot.",
    type: "info"
  }]);
  const [stats, setStats] = useState({ videosLiked: 0, channelsSubbed: 0 });
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // The Main Loop
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isCancelled = false;

    const scheduleNextCycle = () => {
      // Random between 1 minute (60,000ms) and 10 minutes (600,000ms)
      const minMs = 60000;
      const maxMs = 600000;
      const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
      
      const delayMinutes = (delay / 60000).toFixed(1);
      addLog(`[Sleep] Bot blending in. Next algorithm strike in ${delayMinutes} minutes...`, "warning");

      timeoutId = setTimeout(async () => {
        if (!isCancelled) {
          await runAutomationCycle();
          if (!isCancelled) scheduleNextCycle();
        }
      }, delay);
    };

    if (isActive) {
      addLog("Auto-pilot engaged. Utilizing randomized human-mimicry intervals (1-10 mins).", "success");
      
      // Run immediately once, then schedule the first delayed burst
      runAutomationCycle().then(() => {
         if (!isCancelled) scheduleNextCycle();
      });
      
    } else {
      if (logs.length > 1) {
        addLog("Auto-pilot disengaged. Standing by.", "warning");
      }
    }

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [isActive]);

  const addLog = (message: string, type: LogEntry["type"] = "info") => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      time: new Date().toLocaleTimeString(),
      message,
      type
    }]);
  };

  const runAutomationCycle = async () => {
    try {
      addLog("Initializing Routine: Scanning subscriptions...", "info");
      
      const res = await fetch('/api/youtube', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) {
        addLog(`API Warning: ${data.message || 'Unknown error'}`, "warning");
        if (res.status === 429) setIsActive(false); // Stop if quota exceeded
        return;
      }
      
      if (data.action === 'liked') {
         addLog(`[Analysis] Source: '${data.sourceSub}' -> Derived query: "${data.queryUsed}"`, "info");
         addLog(`[Signal Sent] Auto-Liked trending video: "${data.videoTitle}" by ${data.channelName}`, "success");
         setStats(prev => ({ ...prev, videosLiked: prev.videosLiked + 1 }));
      } else if (data.action === 'no_content') {
         addLog(data.message || "No suitable content found. Expanding search context later.", "warning");
         if (data.logData) {
           addLog(`[Context] Analyzed ${data.logData.channelName} using terms "${data.logData.queryVerbiage}"`, "info");
         }
      }
      
    } catch (error) {
      addLog("Unexpected error reaching the refinement server.", "error");
      setIsActive(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center flex-col items-center min-h-[50vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-zinc-500 animate-pulse">Authenticating with Google...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar: Controls & Stats */}
        <div className="w-full md:w-1/3 flex flex-col gap-6">
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Terminal className="text-primary" /> Auto-Pilot Controls
            </h2>
            
            <button
              onClick={() => setIsActive(!isActive)}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white transition-all shadow-[0_0_20px_rgba(0,0,0,0.2)]",
                isActive 
                  ? "bg-red-500/20 border border-red-500 text-red-400 hover:bg-red-500/30" 
                  : "bg-primary border border-primary hover:bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
              )}
            >
              {isActive ? <><Square className="h-5 w-5" fill="currentColor"/> Stop Automation</> : <><Play className="h-5 w-5" fill="currentColor" /> Engage Auto-Pilot</>}
            </button>

            <p className="text-zinc-500 text-sm mt-4 text-center">
              Leave this tab open. The bot will poll YouTube automatically to train your algorithm.
            </p>

            <div className="h-px w-full bg-white/10 my-6" />

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Session Stats</h3>
              <div>
                <p className="text-zinc-400 text-sm">Videos Processed & Liked</p>
                <p className="text-4xl font-extrabold text-white text-glow">{stats.videosLiked}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content: Terminal Output */}
        <div className="w-full md:w-2/3 flex flex-col">
          <div className="glass-card rounded-2xl flex-1 flex flex-col overflow-hidden min-h-[500px] border border-white/10">
            {/* Terminal Header */}
            <div className="bg-black/40 border-b border-white/5 py-3 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <span className="text-xs font-mono text-zinc-500 ml-2">refiner_sys.exe</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  {isActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>}
                  <span className={cn("relative inline-flex rounded-full h-2 w-2", isActive ? "bg-primary" : "bg-zinc-600")}></span>
                </span>
                <span className="text-xs font-mono text-zinc-500 uppercase">{isActive ? "RUNNING" : "HALTED"}</span>
              </div>
            </div>

            {/* Terminal Output */}
            <div className="flex-1 p-6 overflow-y-auto font-mono text-sm space-y-2 bg-[#050505]">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-4 group">
                  <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                  <span className={cn(
                    "break-words",
                    log.type === "info" && "text-zinc-300",
                    log.type === "success" && "text-[#4ade80]",
                    log.type === "warning" && "text-yellow-400",
                    log.type === "error" && "text-red-400"
                  )}>
                    {log.type === "success" && "✓ "}{log.type === "error" && "✗ "}{log.type === "warning" && "⚠ "}{log.message}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
              {isActive && (
                <div className="flex gap-4 animate-pulse">
                  <span className="text-zinc-600 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                  <span className="text-zinc-500">_waiting for next cycle...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
