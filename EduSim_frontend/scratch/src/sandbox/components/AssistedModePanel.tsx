import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, CheckCircle2, Circle, HelpCircle, 
  Compass, Award, Activity
} from 'lucide-react';
import { SandboxValidationState } from '../utils/guidedValidation';

interface AssistedModePanelProps {
  validationState: SandboxValidationState;
  onReset: () => void;
}

interface Objective {
  id: string;
  label: string;
  isCompleted: boolean;
  hint: string;
}

export const AssistedModePanel: React.FC<AssistedModePanelProps> = ({
  validationState,
  onReset
}) => {
  const [objectives, setObjectives] = useState<Objective[]>([
    {
      id: 'bodies',
      label: 'Introduce at least 2 dynamic physical bodies',
      isCompleted: false,
      hint: 'Spawn circles or rectangles into the sandbox using the Toolbox sidebar.'
    },
    {
      id: 'constraints',
      label: 'Connect the bodies with a constraint',
      isCompleted: false,
      hint: 'Apply a Spring, Rope, or Pivot connection to link physical masses.'
    },
    {
      id: 'gravity',
      label: 'Adjust gravity preset to Moon or Jupiter',
      isCompleted: false,
      hint: 'Switch the gravity system parameters under gravity presets.'
    },
    {
      id: 'running',
      label: 'Press Play and run the simulation',
      isCompleted: false,
      hint: 'Initiate physics clock calculations to inspect dynamic force motion.'
    }
  ]);

  // Dynamically evaluate quest items
  useEffect(() => {
    const hasBodies = validationState.bodies.length >= 2;
    const hasConstraints = validationState.constraints.length >= 1;
    const isCustomGravity = validationState.gravityPreset === 'moon' || validationState.gravityPreset === 'jupiter';
    const isClockActive = validationState.running;

    setObjectives(prev => prev.map(obj => {
      let isCompleted = false;
      if (obj.id === 'bodies') isCompleted = hasBodies;
      else if (obj.id === 'constraints') isCompleted = hasConstraints;
      else if (obj.id === 'gravity') isCompleted = isCustomGravity;
      else if (obj.id === 'running') isCompleted = isClockActive;

      return { ...obj, isCompleted };
    }));
  }, [validationState]);

  const completedCount = objectives.filter(o => o.isCompleted).length;
  const progressPercent = Math.round((completedCount / objectives.length) * 100);


  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        bottom: '124px', // Shifted ground base alignment
        right: '16px',
        width: '390px',
        background: 'rgba(7, 10, 22, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1.5px solid rgba(52, 211, 153, 0.15)`,
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.65), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
        color: '#f8fafc',
        zIndex: 100,
        overflow: 'hidden',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
      }}
    >
      {/* Top Emerald Glow Accent Bar */}
      <div style={{ height: '3px', background: 'linear-gradient(90deg, #10b981, #34d399)', width: '100%' }} />

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
          <Compass size={16} color="#34d399" style={{ filter: 'drop-shadow(0 0 6px rgba(52, 211, 153, 0.5))' }} />
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#34d399' }}>
            Level 2 — Exploration
          </span>
        </div>
        <div style={{
          background: 'rgba(52, 211, 153, 0.1)',
          border: '1px solid rgba(52, 211, 153, 0.2)',
          borderRadius: '8px',
          padding: '2px 8px',
          fontSize: '10px',
          color: '#34d399',
          fontWeight: 800
        }}>
          {progressPercent}% Complete
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', width: '100%', position: 'relative' }}>
        <div style={{ 
          height: '100%', 
          background: 'linear-gradient(90deg, #059669, #34d399)', 
          width: `${progressPercent}%`,
          boxShadow: '0 0 8px rgba(52, 211, 153, 0.4)',
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
        }} />
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Objectives Section */}
        <div>
          <h4 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '10px' }}>
            Simulation Quests
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {objectives.map((obj) => (
              <div 
                key={obj.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px',
                  borderRadius: '10px',
                  background: obj.isCompleted ? 'rgba(52, 211, 153, 0.04)' : 'rgba(255, 255, 255, 0.01)',
                  border: obj.isCompleted ? '1px solid rgba(52, 211, 153, 0.15)' : '1px solid rgba(255, 255, 255, 0.03)',
                  transition: 'all 0.3s ease'
                }}
                title={obj.hint}
              >
                {obj.isCompleted ? (
                  <CheckCircle2 size={15} color="#34d399" style={{ marginTop: 1, flexShrink: 0 }} />
                ) : (
                  <Circle size={15} color="#475569" style={{ marginTop: 1, flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    color: obj.isCompleted ? '#a7f3d0' : '#cbd5e1',
                    textDecoration: obj.isCompleted ? 'line-through' : 'none',
                    transition: 'all 0.3s'
                  }}>
                    {obj.label}
                  </div>
                  {!obj.isCompleted && (
                    <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px', lineHeight: 1.3 }}>
                      {obj.hint}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>


        {/* Reset Trigger */}
        <button
          onClick={onReset}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '10px',
            padding: '8px',
            color: '#cbd5e1',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            outline: 'none',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.color = '#cbd5e1';
          }}
        >
          Reset Scene ↺
        </button>

      </div>
    </motion.div>
  );
};

export default AssistedModePanel;
