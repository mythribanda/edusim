import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, BookOpen, Calculator, Compass, Cpu } from "lucide-react";

const STEPS = [
  {
    text: "Deep searching textbook syllabus...",
    icon: BookOpen,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    text: "Retrieving core scientific principles...",
    icon: Brain,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    text: "Analyzing formulas & equations...",
    icon: Calculator,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    text: "Structuring interactive simulation parameters...",
    icon: Compass,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    text: "Synthesizing final pedagogical explanation...",
    icon: Sparkles,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
];

export function GeneratingLoader() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % STEPS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const StepIcon = STEPS[currentStep].icon;

  // Generate deterministic positions for particles to prevent hydration mismatch
  const particles = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    left: `${(i * 17) % 90 + 5}%`,
    delay: i * 0.4,
    duration: 3 + (i % 3),
    scale: 0.5 + (i % 4) * 0.25,
  }));

  return (
    <div className="relative w-full max-w-5xl rounded-[2rem] border border-border/80 bg-card/60 backdrop-blur-md p-6 sm:p-8 md:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden transition-all duration-300">
      {/* Decorative Glow elements */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Floating Sparkles/Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: "110%", opacity: 0 }}
            animate={{
              y: "-10%",
              opacity: [0, 0.6, 0.6, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: p.duration,
              delay: p.delay,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              left: p.left,
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(99,102,241,0.2) 70%)`,
              boxShadow: "0 0 10px rgba(99, 102, 241, 0.4)",
              scale: p.scale,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
        {/* Animated Science/Atom Loader */}
        <div className="relative flex items-center justify-center shrink-0 w-24 h-24 sm:w-28 sm:h-28">
          <div className="absolute inset-0 bg-primary/5 rounded-full blur-xl animate-pulse" />
          
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Orbit 1 */}
            <g transform="translate(50, 50) rotate(30) scale(1, 0.35)">
              <ellipse cx={0} cy={0} rx={40} ry={40} fill="none" className="stroke-primary/20 dark:stroke-primary/15" strokeWidth={1.5} />
              <motion.g
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
              >
                <circle cx={40} cy={0} r={3} className="fill-primary" style={{ filter: "drop-shadow(0 0 6px var(--color-primary))" }} />
              </motion.g>
            </g>

            {/* Orbit 2 */}
            <g transform="translate(50, 50) rotate(150) scale(1, 0.35)">
              <ellipse cx={0} cy={0} rx={40} ry={40} fill="none" className="stroke-purple-500/20 dark:stroke-purple-500/15" strokeWidth={1.5} />
              <motion.g
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 4.5, ease: "linear" }}
              >
                <circle cx={40} cy={0} r={3} className="fill-purple-500" style={{ filter: "drop-shadow(0 0 6px #a855f7)" }} />
              </motion.g>
            </g>

            {/* Orbit 3 */}
            <g transform="translate(50, 50) rotate(270) scale(1, 0.35)">
              <ellipse cx={0} cy={0} rx={40} ry={40} fill="none" className="stroke-emerald-500/20 dark:stroke-emerald-500/15" strokeWidth={1.5} />
              <motion.g
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 5.5, ease: "linear" }}
              >
                <circle cx={40} cy={0} r={3} className="fill-emerald-500" style={{ filter: "drop-shadow(0 0 6px #10b981)" }} />
              </motion.g>
            </g>

            {/* Glowing Nucleus */}
            <circle cx={50} cy={50} r={8} className="fill-primary/20" />
            <motion.circle
              cx={50}
              cy={50}
              r={5}
              className="fill-primary"
              style={{ filter: "drop-shadow(0 0 8px var(--color-primary))" }}
              animate={{
                scale: [0.9, 1.2, 0.9],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut",
              }}
            />
          </svg>
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-4 w-full">
          <div className="space-y-1.5 w-full">
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary/80">
              <Cpu className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
              <span>AI Tutor is Synthesizing</span>
            </div>
            
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              Formulating Explanation
            </h3>
          </div>

          {/* Dynamic Status Step Container */}
          <div className="h-14 flex items-center justify-center md:justify-start w-full overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -15, opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-secondary/30 border border-border/40 max-w-full"
              >
                <div className={`w-6 h-6 rounded-lg ${STEPS[currentStep].bg} ${STEPS[currentStep].color} flex items-center justify-center shrink-0`}>
                  <StepIcon className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-semibold text-muted-foreground truncate">
                  {STEPS[currentStep].text}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Indeterminate Sleek Progress Bar */}
          <div className="w-full bg-secondary/40 border border-border/30 h-1.5 rounded-full overflow-hidden relative">
            <motion.div
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-full"
              initial={{ left: "-30%", width: "30%" }}
              animate={{ left: ["-30%", "100%"] }}
              transition={{
                repeat: Infinity,
                duration: 2.2,
                ease: "easeInOut",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default GeneratingLoader;
