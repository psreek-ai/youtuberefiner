"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { LogIn, LogOut, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-white/10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            YoutubeRefiner
          </span>
        </div>

        <div>
          {session ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "User"}
                    className="h-8 w-8 rounded-full border border-white/20"
                  />
                )}
                <span className="text-sm font-medium text-zinc-300 hidden sm:inline-block">
                  {session.user?.name}
                </span>
              </div>
              <button
                onClick={() => signOut()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full",
                  "bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all",
                  "hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                )}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className={cn(
                "flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-full",
                "bg-primary hover:bg-blue-600 text-white transition-all",
                "shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]"
              )}
            >
              <LogIn className="h-4 w-4" />
              Connect YouTube
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
