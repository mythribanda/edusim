import React from "react";
import { motion } from "framer-motion";
import { LucideIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  actionLink?: string;
}

export function EmptyState({ title, description, icon: Icon, actionLabel, actionLink }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center glass-strong rounded-3xl border border-dashed border-border"
    >
      <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6 border border-border">
        <Icon className="w-10 h-10 text-muted-foreground/30" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
        {description}
      </p>
      {actionLabel && actionLink && (
        <Link to={actionLink}>
          <Button className="rounded-2xl bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-blue)] shadow-glow px-8 py-6 text-base font-bold">
            <Sparkles className="w-5 h-5 mr-2" />
            {actionLabel}
          </Button>
        </Link>
      )}
    </motion.div>
  );
}
