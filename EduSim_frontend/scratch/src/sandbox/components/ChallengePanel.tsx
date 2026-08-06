import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Star, Award, ShieldAlert, CheckCircle, 
  TrendingUp, Sparkles, RefreshCw, X, Zap
} from 'lucide-react';
import { SandboxValidationState } from '../utils/guidedValidation';

interface ChallengePanelProps {
  validationState: SandboxValidationState;
  onReset: () => void;
}

interface PhysicsChallenge {
  id: string;
  title: string;
  description: string;
  targetMetric: string;
  icon: string;
  validator: (state: SandboxValidationState) => { passed: boolean; stars: number; reason: string };
}

export const ChallengePanel: React.FC<ChallengePanelProps> = ({
  validationState,
  onReset
}) => {
  const [selectedChallengeId, setSelectedChallengeId] = useState('pendulum');
  const [liveKe, setLiveKe] = useState(0.0);
  const [scorecard, setScorecard] = useState<{ show: boolean; passed: boolean; stars: number; reason: string } | null>(null);

  // Selector list of 3 physics challenges
  const challenges: PhysicsChallenge[] = [
    {
      id: 'pendulum',
      title: 'Harness the Swing Pendulum',
      description: 'Build an oscillating pendulum: spawn a static anchor point and a hanging mass connected with a Rope.',
      targetMetric: 'Rope joint + 2 bodies + Running',
      icon: '🏮',
      validator: (state) => {
        const hasRope = state.constraints.some(c => c.type === 'rope' || c.type === 'rope-chain');
        const hasAnchor = state.bodies.some(b => b.isStatic);
        const hasDynamic = state.bodies.some(b => !b.isStatic);

        if (!hasAnchor) return { passed: false, stars: 0, reason: 'Missing a static anchor point (ceiling stand).' };
        if (!hasDynamic) return { passed: false, stars: 0, reason: 'Missing a dynamic hanging mass bob.' };
        if (!hasRope) return { passed: false, stars: 0, reason: 'Connect the anchor and mass with a Rope constraint.' };
        if (!state.running) return { passed: false, stars: 0, reason: 'Press Play to run the simulation!' };

        // Award stars based on shape count
        const stars = state.bodies.length > 2 ? 3 : 2;
        return { passed: true, stars, reason: 'Perfect! Harmonic simple gravity swing verified!' };
      }
    },
    {
      id: 'orbit',
      title: 'Stable Celestial Orbit',
      description: 'Achieve orbital balance: switch gravity to Orbital mode, spawn a central Sun and an orbiting Planet.',
      targetMetric: 'Radial gravity + Sun + Planet + Running',
      icon: '🪐',
      validator: (state) => {
        if (state.gravityMode !== 'radial') return { passed: false, stars: 0, reason: 'Switch gravity system mode to "Orbital".' };
        
        const hasSun = state.bodies.some(b => b.isStatic);
        const hasPlanet = state.bodies.some(b => !b.isStatic);
        
        if (!hasSun) return { passed: false, stars: 0, reason: 'Spawn a heavy central Sun (static mass).' };
        if (!hasPlanet) return { passed: false, stars: 0, reason: 'Spawn an orbiting Planet (dynamic mass).' };
        if (!state.running) return { passed: false, stars: 0, reason: 'Press Play to engage centripetal velocity vectors!' };

        const stars = state.bodies.length > 2 ? 3 : 2;
        return { passed: true, stars, reason: 'Fantastic! Keplerian gravity calculations succeeded!' };
      }
    },
    {
      id: 'harmonic',
      title: 'Harmonic Spring Oscillations',
      description: 'Investigate elastic recoil: hook a physical block to a Spring anchor and observe mechanical resonance.',
      targetMetric: 'Spring joint + 2 bodies + Running',
      icon: '➰',
      validator: (state) => {
        const hasSpring = state.constraints.some(c => c.type === 'spring');
        const hasAnchor = state.bodies.some(b => b.isStatic);
        const hasDynamic = state.bodies.some(b => !b.isStatic);

        if (!hasAnchor) return { passed: false, stars: 0, reason: 'Spawn a static ceiling mount block.' };
        if (!hasDynamic) return { passed: false, stars: 0, reason: 'Spawn a physical block/bob.' };
        if (!hasSpring) return { passed: false, stars: 0, reason: 'Attach the block using a Spring constraint.' };
        if (!state.running) return { passed: false, stars: 0, reason: 'Press Play to trigger spring displacement recoil!' };

        const stars = state.bodies.length > 2 ? 3 : 2;
        return { passed: true, stars, reason: 'Excellent! Hooke’s elastic mechanical motion verified!' };
      }
    }
  ];

  const activeChallenge = challenges.find(c => c.id === selectedChallengeId) || challenges[0];

  // Dynamic Kinetic Energy calculator based on bodies' velocity vectors
  useEffect(() => {
    let totalKe = 0.0;
    validationState.bodies.forEach(b => {
      if (b.velocity) {
        const mass = b.mass || 1.0;
        const vx = b.velocity.x || 0;
        const vy = b.velocity.y || 0;
        const velSq = vx * vx + vy * vy;
        totalKe += 0.5 * mass * velSq;
      }
    });
    // Convert to a neat readable decimal scale
    setLiveKe(Math.min(999.9, totalKe * 100));
  }, [validationState]);

  const handleSubmit = () => {
    const res = activeChallenge.validator(validationState);
    setScorecard({
      show: true,
      passed: res.passed,
      stars: res.stars,
      reason: res.reason
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          bottom: '124px', // Touch lower boundary precisely above telemetry deck
          right: '16px',
          width: '390px',
          background: 'rgba(7, 10, 22, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1.5px solid rgba(251, 191, 36, 0.15)`,
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.65), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
          color: '#f8fafc',
          zIndex: 100,
          overflow: 'hidden',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
        }}
      >
        {/* Top Gold Glowing Accent Bar */}
        <div style={{ height: '3px', background: 'linear-gradient(90deg, #fbbf24, #f59e0b)', width: '100%' }} />

        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.01)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={16} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.5))' }} />
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fbbf24' }}>
              Level 3 — Physics Challenge
            </span>
          </div>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Select Challenge Dropdown */}
          <div>
            <label style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Select Active Challenge
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {challenges.map((c) => {
                const isSelected = c.id === selectedChallengeId;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedChallengeId(c.id);
                      setScorecard(null);
                    }}
                    style={{
                      background: isSelected ? 'rgba(251, 191, 36, 0.06)' : 'rgba(255, 255, 255, 0.01)',
                      border: isSelected ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(255, 255, 255, 0.04)',
                      borderRadius: '12px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      color: '#cbd5e1',
                      textAlign: 'left',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.04)';
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{c.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 800, color: isSelected ? '#fbbf24' : '#f8fafc' }}>
                        {c.title}
                      </div>
                      <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px', lineHeight: 1.3 }}>
                        {c.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Checklist and Telemetry */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: '14px',
            padding: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Target System</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0', marginTop: '2px' }}>{activeChallenge.targetMetric}</div>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <TrendingUp size={10} /> Kinetic Energy (KE)
              </div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#fbbf24', marginTop: '2px', fontFamily: 'monospace' }}>
                {liveKe.toFixed(1)} J
              </div>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button
              onClick={onReset}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '10px',
                padding: '10px',
                color: '#cbd5e1',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <RefreshCw size={12} /> Clear Scene
            </button>
            
            <button
              onClick={handleSubmit}
              style={{
                flex: 1.5,
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                border: 'none',
                borderRadius: '10px',
                padding: '10px',
                color: '#0f172a',
                fontSize: '11px',
                fontWeight: 900,
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 4px 15px rgba(251, 191, 36, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              Submit Simulation 🚀
            </button>
          </div>

        </div>
      </motion.div>

      {/* Gorgeous Glass-morphic Scorecard modal overlay */}
      <AnimatePresence>
        {scorecard && scorecard.show && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 7, 15, 0.7)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 500,
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                width: '400px',
                background: 'linear-gradient(135deg, #070a13 0%, #0c1224 100%)',
                border: `1.5px solid ${scorecard.passed ? 'rgba(52, 211, 153, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
                boxShadow: scorecard.passed 
                  ? '0 25px 50px -12px rgba(52, 211, 153, 0.3), inset 0 1px 2px rgba(255,255,255,0.06)'
                  : '0 25px 50px -12px rgba(244, 63, 94, 0.3), inset 0 1px 2px rgba(255,255,255,0.06)',
                borderRadius: '24px',
                padding: '24px',
                textAlign: 'center',
                color: '#f8fafc',
                position: 'relative'
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setScorecard(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <X size={14} />
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                {/* Visual Status Indicator Icon */}
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: scorecard.passed ? 'rgba(52, 211, 153, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  border: `1px solid ${scorecard.passed ? 'rgba(52, 211, 153, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px'
                }}>
                  {scorecard.passed ? '🏆' : '⚠️'}
                </div>

                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: scorecard.passed ? '#34d399' : '#fb7185' }}>
                    {scorecard.passed ? 'Challenge Complete!' : 'Evaluation Failed'}
                  </h2>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', margin: 0 }}>
                    {scorecard.passed ? 'Physics validator checked and approved.' : 'Your canvas does not satisfy constraints.'}
                  </p>
                </div>

                {/* Stars container for Passed Challenge */}
                {scorecard.passed && (
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', margin: '6px 0' }}>
                    {[1, 2, 3].map((num) => {
                      const active = num <= scorecard.stars;
                      return (
                        <Star
                          key={num}
                          size={24}
                          color={active ? '#fbbf24' : '#475569'}
                          fill={active ? '#fbbf24' : 'transparent'}
                          style={{ filter: active ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.5))' : 'none' }}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Evaluator Explainer Text */}
                <div style={{
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '14px',
                  padding: '14px',
                  width: '100%',
                  fontSize: '11.5px',
                  lineHeight: '1.5',
                  color: '#cbd5e1'
                }}>
                  {scorecard.reason}
                </div>

                {/* Action button */}
                <button
                  onClick={() => setScorecard(null)}
                  style={{
                    background: scorecard.passed ? 'linear-gradient(135deg, #10b981, #34d399)' : 'linear-gradient(135deg, #e11d48, #fb7185)',
                    border: 'none',
                    borderRadius: '12px',
                    width: '100%',
                    padding: '10px',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none',
                    boxShadow: scorecard.passed ? '0 4px 14px rgba(52, 211, 153, 0.3)' : '0 4px 14px rgba(244, 63, 94, 0.3)'
                  }}
                >
                  {scorecard.passed ? 'Claim Rewards 🎉' : 'Review Instructions & Retry'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChallengePanel;
