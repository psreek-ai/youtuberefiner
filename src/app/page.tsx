"use client";

import { motion } from "framer-motion";
import { ArrowRight, Brain, Code, Zap } from "lucide-react";
import { signIn } from "next-auth/react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center pt-24 pb-16 px-4">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-4xl mx-auto"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-primary mb-8">
          <Zap className="h-4 w-4" />
          <span>Next-Gen Algorithm Training</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
          Curate Your Feed for <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent text-glow">
            Maximum Growth
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
          YoutubeRefiner programmatically trains your YouTube algorithm. 
          Send massive positive signals to high-value AI and coding content to build 
          a feed that constantly advances your career.
        </p>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]"
          >
            Start Refining <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </motion.div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full mt-32">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="glass-card p-8 rounded-2xl"
        >
          <div className="h-12 w-12 bg-primary/20 rounded-xl flex items-center justify-center mb-6">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-3">AI & Machine Learning</h3>
          <p className="text-zinc-400">
            Tell the algorithm to prioritize deep tech over viral noise. We curate the best architecture breakdowns, research paper reviews, and tutorials.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="glass-card p-8 rounded-2xl"
        >
          <div className="h-12 w-12 bg-accent/20 rounded-xl flex items-center justify-center mb-6">
            <Code className="h-6 w-6 text-accent" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Software Engineering</h3>
          <p className="text-zinc-400">
            Rapidly signal your interest in system design, Next.js, Rust, and modern web development through high-velocity positive feedback loops.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
