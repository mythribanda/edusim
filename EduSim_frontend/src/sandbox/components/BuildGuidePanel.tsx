import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, 
  Play, RotateCcw, Sparkles, HelpCircle, Lightbulb, Info, X
} from 'lucide-react';
import { useGuidedModeStore, BuildStep } from '../../store/guidedModeStore';
import { validateStep, SandboxValidationState } from '../utils/guidedValidation';

interface BuildGuidePanelProps {
  validationState: SandboxValidationState;
  onAutoBuild: (config: any) => void;
  onReset: () => void;
}

const renderHighlightedText = (text: string) => {
  if (!text) return null;

  // Keywords regular expression (case-insensitive) to match objects and controllers
  const regex = /\b(circle|rectangle|rope|spring|pivot|sun|planet|play button|gravity presets|simulation speed slider|reset button|upward blast|linear presets|orbital presets|play|pause|reset)\b/gi;

  const parts = text.split(regex);
  if (parts.length === 1) return text;

  return parts.map((part, index) => {
    const lower = part.toLowerCase();
    
    // Check if it is a shape asset (Green glowing badge)
    if (['circle', 'rectangle', 'sun', 'planet'].includes(lower)) {
      return (
        <span 
          key={index} 
          style={{
            background: 'rgba(52, 211, 153, 0.12)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            borderRadius: '6px',
            padding: '2px 5px',
            margin: '0 2px',
            color: '#34d399',
            fontWeight: 800,
            fontSize: '92%',
            boxShadow: '0 0 6px rgba(52, 211, 153, 0.25)',
            display: 'inline-block',
            lineHeight: 1.1
          }}
        >
          {part}
        </span>
      );
    }
    
    // Check if it is a constraint joint (Gold glowing badge)
    if (['rope', 'spring', 'pivot'].includes(lower)) {
      return (
        <span 
          key={index} 
          style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '6px',
            padding: '2px 5px',
            margin: '0 2px',
            color: '#fbbf24',
            fontWeight: 800,
            fontSize: '92%',
            boxShadow: '0 0 6px rgba(245, 158, 11, 0.25)',
            display: 'inline-block',
            lineHeight: 1.1
          }}
        >
          {part}
        </span>
      );
    }

    // Check if it is a sandbox controller button or presets (Cyan/Blue glowing badge)
    if (['play button', 'gravity presets', 'simulation speed slider', 'reset button', 'upward blast', 'linear presets', 'orbital presets', 'play', 'pause', 'reset'].includes(lower)) {
      return (
        <span 
          key={index} 
          style={{
            background: 'rgba(34, 211, 238, 0.12)',
            border: '1px solid rgba(34, 211, 238, 0.3)',
            borderRadius: '6px',
            padding: '2px 5px',
            margin: '0 2px',
            color: '#22d3ee',
            fontWeight: 800,
            fontSize: '92%',
            boxShadow: '0 0 6px rgba(34, 211, 238, 0.25)',
            display: 'inline-block',
            lineHeight: 1.1
          }}
        >
          {part}
        </span>
      );
    }

    return part;
  });
};

export const BuildGuidePanel: React.FC<BuildGuidePanelProps> = ({
  validationState,
  onAutoBuild,
  onReset
}) => {
  const { 
    guideData, 
    activeStep, 
    setActiveStep, 
    completedSteps, 
    markStepComplete,
    setHighlightedAsset,
    setIsOpen
  } = useGuidedModeStore();

  const [isValid, setIsValid] = useState(false);

  // Validate the current step continuously when validationState or activeStep changes
  useEffect(() => {
    if (!guideData) return;
    const result = validateStep(activeStep, guideData, validationState);
    setIsValid(result);
    if (result) {
      markStepComplete(activeStep);
    }
  }, [activeStep, guideData, validationState, markStepComplete]);

  // Set the highlighted asset dynamically based on the current step
  useEffect(() => {
    if (!guideData || !guideData.steps || !Array.isArray(guideData.steps) || activeStep < 1 || activeStep > guideData.steps.length) {
      setHighlightedAsset(null);
      return;
    }
    const currentStep = guideData.steps[activeStep - 1];
    if (!currentStep) {
      setHighlightedAsset(null);
      return;
    }
    const desc = (currentStep.description || '').toLowerCase();
    const title = (currentStep.title || '').toLowerCase();

    // Determine what to highlight
    if (activeStep === 2 || desc.includes('circle') || desc.includes('rectangle') || desc.includes('spawn shape') || title.includes('mass setup')) {
      if (desc.includes('circle')) setHighlightedAsset('circle');
      else if (desc.includes('rectangle')) setHighlightedAsset('rectangle');
      else setHighlightedAsset('shape-toolbox');
    } else if (activeStep === 3 || desc.includes('rope') || desc.includes('spring') || desc.includes('pivot') || title.includes('joints')) {
      if (desc.includes('rope')) setHighlightedAsset('rope');
      else if (desc.includes('spring')) setHighlightedAsset('spring');
      else if (desc.includes('pivot')) setHighlightedAsset('pivot');
      else setHighlightedAsset('constraints-toolbox');
    } else if (activeStep === 4 || desc.includes('gravity') || desc.includes('mass value') || desc.includes('stiffness')) {
      setHighlightedAsset('gravity-toolbox');
    } else if (activeStep === 5 || title.includes('run') || title.includes('play')) {
      setHighlightedAsset('play-btn');
    } else {
      setHighlightedAsset(null);
    }

    return () => setHighlightedAsset(null);
  }, [activeStep, guideData, setHighlightedAsset]);

  if (!guideData || !guideData.steps || !Array.isArray(guideData.steps) || guideData.steps.length === 0) return null;

  const steps = guideData.steps;
  const safeIndex = Math.min(Math.max(1, activeStep), steps.length) - 1;
  const currentStep = steps[safeIndex];
  if (!currentStep) return null;

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

  // HSL tailored color palette based on step number for gorgeous aesthetics
  const STEP_COLORS: Record<number, string> = {
    1: 'rgb(56, 189, 248)',  // Concept (Blue)
    2: 'rgb(52, 211, 153)',  // Mass Setup (Emerald)
    3: 'rgb(245, 158, 11)',   // Joint (Amber)
    4: 'rgb(167, 139, 250)', // Parameter (Purple)
    5: 'rgb(34, 211, 238)',  // Play (Cyan)
    6: 'rgb(236, 72, 153)'   // Conclusion (Pink)
  };

  const currentColor = STEP_COLORS[activeStep] || 'rgb(99, 102, 241)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        bottom: '124px', // Touch lower boundary precisely above the bottom telemetry deck
        right: '16px',
        width: '390px',
        background: 'rgba(7, 10, 22, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1.5px solid rgba(255, 255, 255, 0.08)`,
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.65), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
        color: '#f8fafc',
        zIndex: 100,
        overflow: 'hidden',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
      }}
    >
      {/* Top HSL Glowing Accent Bar */}
      <div style={{ height: '3px', background: currentColor, width: '100%', transition: 'background 0.3s ease' }} />

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
          <Sparkles size={16} color={currentColor} style={{ filter: `drop-shadow(0 0 6px ${currentColor})`, transition: 'color 0.3s ease' }} />
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8' }}>
            Guided Builder
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsOpen(true)}
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '8px',
              padding: '4px 8px',
              fontSize: '10px',
              color: '#a5b4fc',
              cursor: 'pointer',
              fontWeight: 700,
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
              e.currentTarget.style.border = '1px solid rgba(99, 102, 241, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
              e.currentTarget.style.border = '1px solid rgba(99, 102, 241, 0.2)';
            }}
          >
            View Path 📋
          </button>
          <button
            onClick={() => {
              const store = useGuidedModeStore.getState();
              store.reset();
            }}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              padding: '4px',
              color: '#fca5a5',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.2)';
            }}
            title="Close Guided Builder"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Steps Progress Mini-dots */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px 24px',
        background: 'rgba(0, 0, 0, 0.2)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.03)'
      }}>
        {steps.map((s) => {
          const isActive = s.step_number === activeStep;
          const isDone = completedSteps.includes(s.step_number);
          const color = STEP_COLORS[s.step_number] || '#6366f1';
          return (
            <div 
              key={s.step_number}
              onClick={() => setActiveStep(s.step_number)}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: isActive 
                  ? color 
                  : (isDone ? 'rgba(52, 211, 153, 0.4)' : 'rgba(255, 255, 255, 0.1)'),
                border: isActive 
                  ? `2px solid #fff` 
                  : `1px solid rgba(255, 255, 255, ${isDone ? 0.3 : 0.05})`,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isActive ? `0 0 10px ${color}` : 'none'
              }}
              title={`Step ${s.step_number}: ${s.title}`}
            />
          );
        })}
      </div>

      {/* Main Instruction Display */}
      <div style={{ padding: '20px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.2 }}
          >
            {/* Title & Emoji */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' }}>
                {currentStep.icon || '💡'}
              </span>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 800, color: currentColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  STEP {activeStep} OF 6
                </span>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  {currentStep.title}
                </h3>
              </div>
            </div>

            {/* Description Card with highlights */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '14px',
              fontSize: '11.5px',
              lineHeight: '1.6',
              color: '#cbd5e1',
              marginBottom: '16px',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.15)'
            }}>
              {renderHighlightedText(currentStep.description)}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Validation Status Deck */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 12px',
          background: isValid ? 'rgba(52, 211, 153, 0.08)' : 'rgba(245, 158, 11, 0.06)',
          border: isValid ? '1px solid rgba(52, 211, 153, 0.2)' : '1px solid rgba(245, 158, 11, 0.15)',
          borderRadius: '10px',
          marginBottom: '20px',
          transition: 'all 0.3s ease'
        }}>
          {isValid ? (
            <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0 }} />
          ) : (
            <AlertCircle size={16} color="#fbbf24" style={{ flexShrink: 0 }} />
          )}
          <span style={{ 
            fontSize: '10.5px', 
            fontWeight: 600, 
            color: isValid ? '#a7f3d0' : '#fde68a',
            lineHeight: 1.3
          }}>
            {isValid 
              ? 'Excellent! Step conditions satisfied on canvas.' 
              : 'Add objects or adjust settings as instructed above to verify step.'}
          </span>
        </div>

        {/* Actions & Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Quick builder panel triggers */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {guideData.spawn_config && (
              <button
                onClick={() => onAutoBuild(guideData.spawn_config)}
                style={{
                  background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '7px 12px',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  color: '#0f172a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 4px 10px rgba(251, 191, 36, 0.25)',
                  outline: 'none',
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
                title="Procedural-build this step layout instantly!"
              >
                Auto-Build 🚀
              </button>
            )}
            <button
              onClick={onReset}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '7px',
                cursor: 'pointer',
                color: '#94a3b8',
                outline: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
              title="Reset Sandbox Scene"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          {/* Forward/Backward step navigation */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handlePrev}
              disabled={activeStep === 1}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '7px 12px',
                fontSize: '10.5px',
                color: activeStep === 1 ? '#475569' : '#cbd5e1',
                cursor: activeStep === 1 ? 'not-allowed' : 'pointer',
                outline: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              <ChevronLeft size={13} /> Back
            </button>

            <button
              onClick={handleNext}
              disabled={activeStep === steps.length}
              style={{
                background: activeStep === steps.length ? 'rgba(255, 255, 255, 0.03)' : 'linear-gradient(135deg, #4f46e5, #6366f1)',
                border: 'none',
                borderRadius: '10px',
                padding: '7px 14px',
                fontSize: '10.5px',
                fontWeight: 700,
                color: activeStep === steps.length ? '#475569' : '#ffffff',
                cursor: activeStep === steps.length ? 'not-allowed' : 'pointer',
                outline: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                boxShadow: activeStep === steps.length ? 'none' : '0 4px 10px rgba(79, 70, 229, 0.25)'
              }}
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BuildGuidePanel;
