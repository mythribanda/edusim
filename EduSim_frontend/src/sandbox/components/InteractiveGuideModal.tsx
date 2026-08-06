import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Sparkles, Lightbulb, Zap, HelpCircle, GraduationCap, Play, 
  ChevronLeft, ChevronRight, ArrowRight, MousePointerClick
} from 'lucide-react';
import { SimulationGuide } from '../../store/guidedModeStore';

export interface OnboardingStep {
  step_number: number;
  title: string;
  description: string;
  icon: string;
}

export const DEFAULT_STEPS: OnboardingStep[] = [
  {
    step_number: 1,
    title: 'Add Objects',
    description: 'Drag circles or rectangles into the sandbox to add physical masses to the canvas.',
    icon: '🔵'
  },
  {
    step_number: 2,
    title: 'Add Constraints',
    description: 'Select ropes, springs, or pivot tools from the sidebar to connect physical shapes.',
    icon: '🟢'
  },
  {
    step_number: 3,
    title: 'Apply Forces',
    description: 'Use the force X/Y sliders or dynamic impulse buttons to push and pull bodies.',
    icon: '🟠'
  },
  {
    step_number: 4,
    title: 'Choose Gravity',
    description: 'Switch between Earth, Moon, Jupiter linear presets, or activate planetary radial gravity.',
    icon: '🟣'
  },
  {
    step_number: 5,
    title: 'Press Play',
    description: 'Run the simulation to observe energy conservation, swings, and collisions.',
    icon: '🔴'
  },
  {
    step_number: 6,
    title: 'Open AI Explanation',
    description: 'Consult the live AI Explanation tab to view physical formulas and step-by-step causes.',
    icon: '✨'
  }
];

export const DEFAULT_TIPS = [
  { id: 'tip1', text: 'Try changing mass and gravity to see different physical results.', icon: '⚖️' },
  { id: 'tip2', text: 'Connect objects with ropes to create pendulums or swinging systems.', icon: '🔗' },
  { id: 'tip3', text: 'Use spring joints for simple harmonic oscillation experiments.', icon: '➰' },
  { id: 'tip4', text: 'Compare different force vectors and impulse magnitudes.', icon: '🏹' }
];

interface InteractiveGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStep: number;
  setActiveStep: (step: number) => void;
  onLoadTemplate: (templateId: string) => void;
  aiGuideData?: SimulationGuide | null;
  onAutoBuild?: (config: any) => void;
}

export const InteractiveGuideModal: React.FC<InteractiveGuideModalProps> = ({
  isOpen,
  onClose,
  activeStep,
  setActiveStep,
  onLoadTemplate,
  aiGuideData,
  onAutoBuild
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const isCustomAi = !!(aiGuideData && aiGuideData.is_buildable);
  const steps = isCustomAi && aiGuideData && Array.isArray(aiGuideData.steps) ? aiGuideData.steps : DEFAULT_STEPS;
  const title = isCustomAi && aiGuideData ? (aiGuideData.title || 'How to Build a Simulation') : 'How to Build a Simulation';
  
  const tips = isCustomAi && aiGuideData && Array.isArray(aiGuideData.tips)
    ? aiGuideData.tips.map((text, i) => ({ id: `ai-tip-${i}`, text: text || '', icon: '💡' }))
    : DEFAULT_TIPS;

  const handleNext = () => {
    if (activeStep < steps.length) {
      setActiveStep(activeStep + 1);
    }
  };

  const handlePrev = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  const STEP_COLORS: Record<number, string> = {
    1: '#38bdf8',
    2: '#34d399',
    3: '#f59e0b',
    4: '#a78bfa',
    5: '#22d3ee',
    6: '#ec4899'
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 7, 15, 0.65)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 500
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{
          width: 900,
          height: 700,
          background: 'linear-gradient(135deg, #070a13 0%, #0c1224 100%)',
          border: '1px solid rgba(120, 120, 255, 0.16)',
          borderRadius: 24,
          boxShadow: '0 20px 50px rgba(0,0,0,0.55), inset 0 1px 2px rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f8fafc',
          position: 'relative'
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: '25%',
          width: '50%',
          height: 120,
          background: 'radial-gradient(ellipse at top, rgba(91, 95, 255, 0.15), transparent 60%)',
          pointerEvents: 'none',
          zIndex: 1
        }} />

        {/* HEADER SECTION */}
        <div style={{
          padding: '24px 30px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 2
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(123, 97, 255, 0.15)',
              border: '1px solid rgba(123, 97, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <GraduationCap size={20} color="#7B61FF" />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '0.01em', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
                {title}
                {isCustomAi && (
                  <span style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: '#fbbf24',
                    background: 'rgba(251, 191, 36, 0.15)',
                    border: '1px solid rgba(251, 191, 36, 0.25)',
                    padding: '2px 6px',
                    borderRadius: 6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    AI Dynamic Guide
                  </span>
                )}
              </h2>
              <p style={{ fontSize: 11.5, color: '#94a3b8', margin: '2px 0 0 0' }}>
                {isCustomAi ? 'Custom-generated tutorial plan tailored to your physical query.' : 'Follow these simple steps to create your own physics simulations.'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
              transition: 'all 0.2s'
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* CONTENT ROW */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', zIndex: 2 }}>
          <div style={{
            flex: 1.6,
            padding: '24px 30px',
            overflowY: 'auto',
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            {steps.map((step) => {
              const isActive = activeStep === step.step_number;
              const stepColor = STEP_COLORS[step.step_number] || '#7B61FF';
              
              return (
                <motion.div
                  key={step.step_number}
                  onClick={() => setActiveStep(step.step_number)}
                  whileHover={{ x: 4, scale: isActive ? 1.0 : 1.01 }}
                  style={{
                    background: isActive ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.01)',
                    border: isActive ? `1.5px solid ${stepColor}` : '1.5px solid rgba(255, 255, 255, 0.04)',
                    boxShadow: isActive ? `0 0 16px rgba(123, 97, 255, 0.15)` : 'none',
                    borderRadius: 16,
                    padding: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    transition: 'border 0.2s, background 0.2s',
                    position: 'relative'
                  }}
                >
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 4,
                      background: stepColor,
                      borderTopLeftRadius: 16,
                      borderBottomLeftRadius: 16
                    }} />
                  )}

                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: isActive ? stepColor : 'rgba(255, 255, 255, 0.04)',
                    color: isActive ? '#0f172a' : '#94a3b8',
                    fontSize: 13,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}>
                    {step.step_number}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: isActive ? '#ffffff' : '#cbd5e1' }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: 11, color: isActive ? '#e2e8f0' : '#64748b', lineHeight: 1.4, marginTop: 3 }}>
                      {step.description}
                    </div>
                  </div>

                  <div style={{
                    width: 130,
                    height: 60,
                    borderRadius: 8,
                    background: 'rgba(0, 0, 0, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.03)',
                    overflow: 'hidden',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {step.step_number === 1 && (
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 24, height: 24, borderRadius: 4, background: '#38bdf8', opacity: 0.8 }} />
                        <span style={{ fontSize: 12 }}>👉</span>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#34d399', opacity: 0.8 }} />
                      </div>
                    )}
                    {step.step_number === 2 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '85%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, color: '#64748b' }}>
                          <span>Rope</span>
                          <span>Spring</span>
                          <span>Pivot</span>
                        </div>
                        <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', position: 'relative' }}>
                          <div style={{ position: 'absolute', top: -3, left: '25%', width: 8, height: 8, borderRadius: '50%', background: '#38bdf8' }} />
                          <div style={{ position: 'absolute', top: -3, left: '60%', width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />
                        </div>
                      </div>
                    )}
                    {step.step_number === 3 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '80%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 8, color: '#f59e0b' }}>Force X</span>
                          <div style={{ width: 50, height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, position: 'relative' }}>
                            <div style={{ position: 'absolute', top: -2.5, left: '65%', width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    {step.step_number === 4 && (
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
                        <span style={{ filter: 'drop-shadow(0 0 4px rgba(56, 189, 248, 0.4))' }}>🌍</span>
                        <span style={{ opacity: 0.4 }}>🌕</span>
                        <span style={{ opacity: 0.4 }}>🪐</span>
                      </div>
                    )}
                    {step.step_number === 5 && (
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #22d3ee, #0891b2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 10px rgba(34, 211, 238, 0.4)',
                        cursor: 'pointer'
                      }}>
                        <Play size={11} fill="#ffffff" color="#ffffff" style={{ marginLeft: 1 }} />
                      </div>
                    )}
                    {step.step_number === 6 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '80%' }}>
                        <div style={{ height: 4, width: '40%', background: 'rgba(255,255,255,0.3)', borderRadius: 2 }} />
                        <div style={{ height: 4, width: '90%', background: 'rgba(255,255,255,0.15)', borderRadius: 2 }} />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* RIGHT COLUMN: TIPS & PRESSETS */}
          <div style={{
            flex: 1,
            padding: '24px 30px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fbbf24' }}>
                <Lightbulb size={16} />
                <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
                  Tutor Tips
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tips.map((tip) => (
                  <div 
                    key={tip.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.01)',
                      border: '1px solid rgba(255, 255, 255, 0.03)',
                      borderRadius: 12,
                      padding: 10,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{tip.icon}</span>
                    <span style={{ fontSize: 10.5, color: '#94a3b8', lineHeight: 1.4 }}>
                      {tip.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fb7185' }}>
                <Zap size={16} />
                <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
                  Quick Start Ideas
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { id: 'pendulum', title: 'Simple Pendulum', emoji: '🏮' },
                  { id: 'freefall', title: 'Falling Ball', emoji: '🔴' },
                  { id: 'spring', title: 'Spring Oscillator', emoji: '➰' },
                  { id: 'collision', title: 'Collision Demo', emoji: '🤼' },
                  { id: 'orbital', title: 'Orbital Motion', emoji: '🪐' }
                ].map((idea) => (
                  <button
                    key={idea.id}
                    onClick={() => {
                      onLoadTemplate(idea.id);
                      onClose();
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: 10,
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      color: '#cbd5e1',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'all 0.2s',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12 }}>{idea.emoji}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 700 }}>{idea.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM CONTROLS FOOTER */}
        <div style={{
          padding: '16px 30px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'rgba(0, 0, 0, 0.12)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 2
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#64748b', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              style={{ accentColor: '#7B61FF', cursor: 'pointer' }}
            />
            Don't show again
          </label>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {isCustomAi && onAutoBuild && aiGuideData?.spawn_config && (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onAutoBuild(aiGuideData.spawn_config);
                  onClose();
                }}
                style={{
                  background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                  border: 'none',
                  borderRadius: 10,
                  padding: '7px 14px',
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#0f172a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  boxShadow: '0 0 15px rgba(251, 191, 36, 0.35)',
                  outline: 'none',
                  marginRight: 6
                }}
              >
                <MousePointerClick size={12.5} /> Auto-Build Simulation 🚀
              </motion.button>
            )}

            {activeStep > 1 && (
              <button
                onClick={handlePrev}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 10,
                  padding: '7px 14px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                Back
              </button>
            )}

            <button
              onClick={activeStep === steps.length ? onClose : handleNext}
              style={{
                background: 'linear-gradient(90deg, #38bdf8, #5B5FFF)',
                border: 'none',
                borderRadius: 10,
                padding: '7px 16px',
                fontSize: 11,
                fontWeight: 800,
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                boxShadow: '0 4px 14px rgba(91, 95, 255, 0.3)',
                outline: 'none'
              }}
            >
              {activeStep === steps.length ? 'Get Started' : 'Next Step'} <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InteractiveGuideModal;
