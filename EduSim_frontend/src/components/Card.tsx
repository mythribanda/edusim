import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function Card({
  children,
  onClick,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: delay * 0.5 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`bg-card border border-border rounded-3xl p-6 cursor-pointer shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300 group ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
