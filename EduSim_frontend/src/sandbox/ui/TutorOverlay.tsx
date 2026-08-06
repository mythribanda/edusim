import React, { useState, useEffect, useRef } from 'react';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export type TutorMessageType = 'insight' | 'hint' | 'warning' | 'concept' | 'misconception';

export interface TutorMessage {
  id: string;
  type: TutorMessageType;
  title: string;
  message: string;
  formula?: string;
  targetObjectId?: string;
  duration?: number; // Auto-dismiss timeout in ms
}

// Global hook/window register for loose-coupling
declare global {
  interface Window {
    showTutorMessage?: (msg: Omit<TutorMessage, 'id'>) => void;
  }
}

// ─── Type Visual Configs ──────────────────────────────────────────────────────

const TYPE_CONFIGS: Record<TutorMessageType, {
  color: string;
  glow: string;
  icon: string;
  label: string;
  bg: string;
}> = {
  insight: {
    color: '#38bdf8', // Light Cyan/Blue
    glow: 'rgba(56, 189, 248, 0.4)',
    icon: '💡',
    label: 'INSIGHT',
    bg: 'rgba(15, 23, 42, 0.85)',
  },
  hint: {
    color: '#34d399', // Emerald Green
    glow: 'rgba(52, 211, 153, 0.4)',
    icon: '🧠',
    label: 'HINT',
    bg: 'rgba(15, 23, 42, 0.85)',
  },
  warning: {
    color: '#fbbf24', // Amber Yellow
    glow: 'rgba(251, 191, 36, 0.4)',
    icon: '⚠️',
    label: 'WARNING',
    bg: 'rgba(15, 23, 42, 0.85)',
  },
  concept: {
    color: '#a78bfa', // Purple
    glow: 'rgba(167, 139, 250, 0.4)',
    icon: '🎓',
    label: 'CONCEPT',
    bg: 'rgba(15, 23, 42, 0.85)',
  },
  misconception: {
    color: '#f43f5e', // Rose Red
    glow: 'rgba(244, 63, 94, 0.4)',
    icon: '❌',
    label: 'COMMON MISCONCEPTION',
    bg: 'rgba(15, 23, 42, 0.85)',
  },
};

// ─── TutorOverlay Component ───────────────────────────────────────────────────

export const TutorOverlay: React.FC = () => {
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [current, setCurrent] = useState<TutorMessage | null>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [progress, setProgress] = useState(100);
  const [isVisible, setIsVisible] = useState(false);

  const typingTimerRef = useRef<number | null>(null);
  const progressTimerRef = useRef<number | null>(null);

  // Expose showTutorMessage globally for loose coupling
  useEffect(() => {
    window.showTutorMessage = (msg: Omit<TutorMessage, 'id'>) => {
      const newMsg: TutorMessage = {
        ...msg,
        id: `tmsg-${Math.random().toString(36).substr(2, 9)}`,
      };
      setMessages((prev) => [...prev, newMsg]);
    };

    return () => {
      window.showTutorMessage = undefined;
    };
  }, []);

  // Process the message queue
  useEffect(() => {
    if (!current && messages.length > 0) {
      const next = messages[0];
      setMessages((prev) => prev.slice(1));
      setCurrent(next);
      setIsVisible(true);
    }
  }, [messages, current]);

  // Handle typing animation & progress timeouts
  useEffect(() => {
    if (!current) {
      setDisplayedText('');
      setIsVisible(false);
      return;
    }

    // Reset typist
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    setDisplayedText('');

    let charIdx = 0;
    const msgText = current.message;
    typingTimerRef.current = window.setInterval(() => {
      setDisplayedText((prev) => prev + msgText.charAt(charIdx));
      charIdx++;
      if (charIdx >= msgText.length) {
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      }
    }, 15);

    // Reset progress bar & start countdown
    const duration = current.duration ?? 6500;
    const intervalMs = 30;
    let elapsed = 0;
    setProgress(100);

    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = window.setInterval(() => {
      elapsed += intervalMs;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);

      if (elapsed >= duration) {
        handleDismiss();
      }
    }, intervalMs);

    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [current]);

  const handleDismiss = () => {
    setIsVisible(false);
    // Smooth out animation transitions before popping next
    setTimeout(() => {
      setCurrent(null);
    }, 300);
  };

  if (!current) return null;

  const cfg = TYPE_CONFIGS[current.type];

  // ── Styles ──────────────────────────────────────────────────────────────────

  const S = {
    overlay: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      width: '360px',
      borderRadius: '16px',
      background: cfg.bg,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: `1.5px solid ${cfg.color}`,
      boxShadow: `0 10px 30px -10px rgba(0, 0, 0, 0.7), 0 0 20px 2px ${cfg.glow}`,
      color: '#f8fafc',
      zIndex: 50,
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.96)',
    } as React.CSSProperties,

    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      background: 'rgba(255, 255, 255, 0.02)',
    } as React.CSSProperties,

    tag: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '10px',
      fontWeight: 800,
      letterSpacing: '1.5px',
      color: cfg.color,
      textShadow: `0 0 10px ${cfg.glow}`,
    } as React.CSSProperties,

    closeBtn: {
      background: 'none',
      border: 'none',
      color: '#94a3b8',
      fontSize: '18px',
      lineHeight: '1',
      cursor: 'pointer',
      padding: '4px',
      margin: '-4px',
      transition: 'color 0.2s',
    } as React.CSSProperties,

    body: {
      padding: '16px',
    } as React.CSSProperties,

    title: {
      fontSize: '15px',
      fontWeight: 700,
      marginBottom: '8px',
      color: '#f8fafc',
    } as React.CSSProperties,

    message: {
      fontSize: '13px',
      lineHeight: '1.6',
      color: '#cbd5e1',
      minHeight: '40px',
    } as React.CSSProperties,

    formulaBox: {
      marginTop: '12px',
      padding: '10px 14px',
      borderRadius: '8px',
      background: 'rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      textAlign: 'center',
      fontFamily: 'monospace',
      fontWeight: 'bold',
      fontSize: '16px',
      color: '#f59e0b', // High-contrast amber
      textShadow: '0 0 8px rgba(245, 158, 11, 0.25)',
      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
    } as React.CSSProperties,

    progressBar: {
      height: '3px',
      background: cfg.color,
      width: `${progress}%`,
      boxShadow: `0 0 6px ${cfg.color}`,
      transition: 'width 0.03s linear',
    } as React.CSSProperties,
  };

  return (
    <div style={S.overlay} className="tutor-overlay-card">
      <div style={S.header}>
        <div style={S.tag}>
          <span>{cfg.icon}</span>
          <span>{cfg.label}</span>
        </div>
        <button
          onClick={handleDismiss}
          style={S.closeBtn}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#f1f5f9')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          &times;
        </button>
      </div>

      <div style={S.body}>
        <h3 style={S.title}>{current.title}</h3>
        <p style={S.message}>{displayedText}</p>
        
        {current.formula && (
          <div style={S.formulaBox} className="tutor-formula-emphasis">
            {current.formula}
          </div>
        )}
      </div>

      {/* Progress countdown footer */}
      <div style={S.progressBar} />
    </div>
  );
};
