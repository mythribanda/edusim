import React from "react";
import { FormulaDefinition } from "@/data/formulaRegistry";
import { motion } from "framer-motion";

interface Props {
  formulaDef?: FormulaDefinition;
}

export default function FormulaSimulation({ formulaDef }: Props) {
  if (!formulaDef) {
    return (
      <div className="text-muted-foreground text-sm">
        No interactive simulation available.
      </div>
    );
  }

  // Very basic Framer Motion based simulations for MVP
  const renderSimulation = () => {
    switch (formulaDef.simulation) {
      case "force-motion":
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <div className="absolute bottom-10 w-3/4 h-1 bg-white/20 rounded-full" />
            <motion.div
              animate={{ x: [-100, 100] }}
              transition={{ repeat: Infinity, duration: 2, repeatType: "reverse", ease: "easeInOut" }}
              className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl shadow-lg border border-white/20 flex items-center justify-center font-bold text-white mb-10"
            >
              m
            </motion.div>
            <motion.div
              animate={{ x: [-50, 150], opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 2, repeatType: "reverse", ease: "easeInOut" }}
              className="absolute mb-10 text-violet-300 font-bold text-lg"
            >
              → F
            </motion.div>
          </div>
        );
      
      case "circuit-flow":
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="w-48 h-32 border-4 border-violet-500/30 rounded-lg flex items-center justify-between p-2">
              <div className="w-4 h-16 bg-white/20 flex items-center justify-center text-xs -ml-2 rounded-sm relative z-10">
                <span className="absolute -left-6">V</span>
              </div>
              <div className="w-16 h-4 bg-violet-400/50 rounded-full relative z-10 flex items-center justify-center">
                <span className="absolute -top-6 text-sm">R</span>
              </div>
            </div>
            {/* Animated electrons */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              className="absolute w-48 h-32 border border-transparent"
            >
              <div className="w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.8)] -top-1 left-24 absolute" />
              <div className="w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.8)] -bottom-1 left-24 absolute" />
            </motion.div>
          </div>
        );

      case "rolling-ball":
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <div className="absolute bottom-10 w-3/4 h-1 bg-white/20 rounded-full" />
            <motion.div
              animate={{ x: [-150, 150], rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse", ease: "linear" }}
              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full shadow-lg border-2 border-white/20 flex items-center justify-center font-bold text-white mb-10 relative"
            >
              <div className="w-2 h-2 bg-white rounded-full absolute top-2 right-2" />
            </motion.div>
            <div className="absolute bottom-4 text-sm text-cyan-300">
              v = velocity
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center gap-4">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="w-20 h-20 rounded-full bg-violet-500/20 flex items-center justify-center"
            >
              <div className="w-10 h-10 rounded-full bg-violet-500/50" />
            </motion.div>
            <p className="text-muted-foreground text-sm">Generic variable relationship</p>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full overflow-hidden">
      {renderSimulation()}
    </div>
  );
}
