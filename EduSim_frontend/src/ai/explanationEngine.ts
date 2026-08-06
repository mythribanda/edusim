import { useEffect, useState, useRef } from 'react';
import { physicsEventBus, PhysicsEvent } from './physicsEventBus';
import { generateInsight, ExplanationInsight } from './insightGenerator';
import { getApiUrl } from '../config/api';
import { useAuthStore } from '../store/useAuthStore';

export interface ExplanationQueueItem {
  id: string;
  insight: ExplanationInsight;
  timestamp: number;
  loading?: boolean;
}

// ─── Event-to-Prompt Mapping Helper ──────────────────────────────────────────
function getDynamicPromptAndPlaceholder(event: PhysicsEvent, gravityMode: 'linear' | 'radial') {
  const isRadial = gravityMode === 'radial';

  switch (event.type) {
    case 'OBJECT_SPAWNED': {
      if (event.metadata?.isExample) {
        const title = event.metadata.title || 'Textbook Example';
        return {
          query: `An active textbook simulation titled "${title}" has just been loaded onto the canvas. Explain the overall physical concepts, orbital mechanics, system setup, and learning goals of this laboratory scenario.`,
          placeholderTitle: `Lesson Loaded: ${title}`,
          placeholderEffects: ['Initializing physics environment...', 'Setting target orbital vectors...', 'Loading textbook variables...']
        };
      }

      const mass = event.metadata?.mass ? `${event.metadata.mass.toFixed(1)} kg` : 'unknown mass';
      const shape = event.metadata?.shape ?? 'object';
      const name = event.metadata?.name ?? shape;
      
      if (isRadial) {
        return {
          query: `Explain the physics of the action: releasing/spawning a celestial body named "${name}" into a space orbit. How does the initial velocity vector at the moment of launch determine whether the orbit will be circular, elliptical, or decay into the star under radial gravity?`,
          placeholderTitle: `${name} launched in space orbit`,
          placeholderEffects: ['Calculating orbital trajectory...', 'Measuring radial gravity field...', 'Checking centripetal balance...']
        };
      } else {
        const gVal = typeof event.metadata?.gravity === 'number' ? event.metadata.gravity : 1.0;
        const gMs = (gVal * 9.8).toFixed(1);
        return {
          query: `Explain the physics of the action: spawning/releasing an object named "${name}" (mass ${mass}) into downward gravity. What happens immediately to its potential and kinetic energy transition at the moment of release under Earth gravity of ${gMs} m/s²?`,
          placeholderTitle: `${name} released — free-fall begins`,
          placeholderEffects: ['Calculating free-fall dynamics...', 'Simulating weight force...', 'Preparing formulas...']
        };
      }
    }
    case 'GRAVITY_CHANGED': {
      if (isRadial) {
        return {
          query: `Explain the dynamic physics of the action: altering the gravitational constant (G) of the universe from ${event.oldValue.toFixed(4)} to ${event.newValue.toFixed(4)} in real-time. How does modifying gravity instantly affect the orbital velocities ($v = \\sqrt{\\frac{GM}{r}}$), centripetal acceleration, and trajectory stability of all active planets?`,
          placeholderTitle: 'Radial Gravity adjusted (Live AI)',
          placeholderEffects: ['Recalculating orbital vectors...', 'Recalibrating radial field lines...', 'Checking trajectory stability...']
        };
      } else {
        const gOld = (event.oldValue * 9.8).toFixed(1);
        const gNew = (event.newValue * 9.8).toFixed(1);
        return {
          query: `Explain the dynamic physics of the action: changing downward linear gravity from ${gOld} m/s² to ${gNew} m/s² in real-time. How does altering linear gravity dynamically scale the weight force, acceleration, and falling velocity of all active objects?`,
          placeholderTitle: 'Linear Gravity adjusted (Live AI)',
          placeholderEffects: ['Recalculating weight vectors...', 'Updating acceleration values...', 'Recalibrating physics engine...']
        };
      }
    }
    case 'MASS_CHANGED': {
      const mOld = event.oldValue.toFixed(1);
      const mNew = event.newValue.toFixed(1);
      const diff = Math.abs(event.newValue - event.oldValue).toFixed(1);
      
      if (isRadial) {
        return {
          query: `Explain the dynamic physics of the action: altering the mass of an active celestial body from ${mOld} kg to ${mNew} kg (a change of ${diff} kg) in real-time. How does changing mass affect its orbital inertia and its mutual gravitational attraction ($F = G \\frac{m_1 m_2}{r^2}$) with other planets?`,
          placeholderTitle: 'Celestial Mass adjusted (Live AI)',
          placeholderEffects: ['Recalculating orbital gravitational pull...', 'Adjusting centripetal parameters...', 'Checking Keplerian variables...']
        };
      } else {
        return {
          query: `Explain the dynamic physics of the action: changing the mass of a physical body from ${mOld} kg to ${mNew} kg (a change of ${diff} kg) in real-time. Discuss how altering mass dynamically affects its inertia, its resistance to acceleration ($F = ma$), and its weight.`,
          placeholderTitle: 'Object Mass adjusted (Live AI)',
          placeholderEffects: ['Recalculating inertia tensors...', 'Adjusting force requirements...', 'Recalibrating weight force...']
        };
      }
    }
    case 'FRICTION_CHANGED': {
      const fOld = event.oldValue.toFixed(2);
      const fNew = event.newValue.toFixed(2);
      return {
        query: `Explain the physics of the action: adjusting the sliding friction coefficient (μ) dynamically from ${fOld} to ${fNew}. How does altering friction affect the sliding resistance, motion retardation, and rate of kinetic energy loss for active objects?`,
        placeholderTitle: 'Friction adjusted (Live AI)',
        placeholderEffects: ['Adjusting normal force vectors...', 'Recalculating sliding resistance...', 'Recalibrating energy dissipation...']
      };
    }
    case 'RESTITUTION_CHANGED': {
      const rOld = event.oldValue.toFixed(2);
      const rNew = event.newValue.toFixed(2);
      return {
        query: `Explain the physics of the action: altering the restitution (bounciness) of objects dynamically from ${rOld} to ${rNew} in real-time. How does this action affect collision elasticity, kinetic energy conservation, and subsequent rebound height during impacts?`,
        placeholderTitle: 'Restitution adjusted (Live AI)',
        placeholderEffects: ['Recalculating coefficient of restitution...', 'Adjusting kinetic energy retention...', 'Simulating impact dynamics...']
      };
    }
    case 'SPRING_CREATED': {
      const k = event.metadata?.stiffness ?? 0.02;
      return {
        query: `Explain the physics of the action: attaching an elastic spring constraint with stiffness constant k = ${k.toFixed(3)}. Discuss Hooke's Law (F = -kx), potential energy storage, and how this action initiates simple harmonic oscillations.`,
        placeholderTitle: 'Spring attached (Live AI)',
        placeholderEffects: ['Calculating Hooke\'s Law restoring force...', 'Simulating elastic potential energy...', 'Estimating oscillation periods...']
      };
    }
    case 'ROPE_CREATED': {
      return {
        query: `Explain the physics of the action: linking bodies with a flexible rope constraint. Discuss tension forces, constraint boundaries, and the transition between taut tension and slack freedom.`,
        placeholderTitle: 'Rope constraint added (Live AI)',
        placeholderEffects: ['Calculating tension vectors...', 'Determining separation thresholds...', 'Simulating pendulum arcs...']
      };
    }
    case 'PIVOT_CREATED': {
      return {
        query: `Explain the physics of the action: pinning an object to a fixed pivot anchor constraint. How does this action restrict translational motion and convert linear forces into rotational pendulum swings?`,
        placeholderTitle: 'Pivot attached (Live AI)',
        placeholderEffects: ['Determining rotational coordinates...', 'Calculating centripetal forces...', 'Mapping pendulum arcs...']
      };
    }
    case 'COLLISION_DETECTED': {
      const speed = event.metadata?.relativeSpeed ? `${event.metadata.relativeSpeed.toFixed(1)} m/s` : 'unknown speed';
      const impulse = event.metadata?.impulse ? `${event.metadata.impulse.toFixed(2)} N·s` : 'unknown impulse';
      
      if (isRadial) {
        return {
          query: `Explain the physics of the action: two celestial bodies colliding in space at a relative speed of ${speed} with an impulse of ${impulse}. Discuss the transfer of momentum, Newton's Third Law (equal and opposite reaction forces), and orbital trajectory alterations during impact.`,
          placeholderTitle: 'Celestial Collision (Live AI)',
          placeholderEffects: ['Checking momentum vectors...', 'Calculating trajectory alterations...', 'Determining kinetic energy loss...']
        };
      } else {
        return {
          query: `Explain the physics of the action: two physical bodies colliding in real-time at a relative speed of ${speed} with an impulse of ${impulse}. Discuss the transfer of momentum, Newton's Third Law (equal and opposite reaction forces), and kinetic energy dissipation during impact.`,
          placeholderTitle: 'Collision detected (Live AI)',
          placeholderEffects: ['Verifying momentum conservation...', 'Calculating impulse transfer...', 'Determining kinetic energy loss...']
        };
      }
    }
    case 'FORCE_APPLIED': {
      const fx = event.newValue?.x ?? 0;
      const fy = event.newValue?.y ?? 0;
      const fMag = (Math.hypot(fx, fy) * 1000).toFixed(1);
      const mass = event.metadata?.mass;
      const accStr = mass ? `resulting in an acceleration of ${((Math.hypot(fx, fy) * 1000) / mass).toFixed(1)} m/s²` : '';
      return {
        query: `Explain the physics of the action: applying a dynamic external force blast of magnitude ${fMag} N to an object of mass ${mass?.toFixed(1) ?? 'unknown'} kg ${accStr}. How does this impulse instantly inject kinetic energy, change momentum, and accelerate the body according to F = ma?`,
        placeholderTitle: 'Force applied (Live AI)',
        placeholderEffects: ['Summing force vectors...', 'Calculating F = ma acceleration...', 'Mapping momentum accumulation...']
      };
    }
    case 'OBJECT_AT_REST': {
      const friction = event.metadata?.friction ?? 0.3;
      const rest = event.metadata?.restitution ?? 0.5;
      return {
        query: `Explain the physics of the action: an object coming to complete rest through friction (μ = ${friction.toFixed(2)}) and low restitution (e = ${rest.toFixed(2)}). Discuss the complete dissipation of kinetic energy into thermal energy and the achievement of balanced static equilibrium.`,
        placeholderTitle: 'Object came to rest (Live AI)',
        placeholderEffects: ['Summing net forces to zero...', 'Verifying kinetic energy dissipation...', 'Confirming system static state...']
      };
    }
    default:
      return {
        query: `Explain the physics of the action: performing simulator event ${event.type}.`,
        placeholderTitle: 'Analyzing Physics Event...',
        placeholderEffects: ['Updating state variables...', 'Calculating force equations...']
      };
  }
}

export function useExplanationEngine(
  dynamicEnabled: boolean = false,
  gravityMode: 'linear' | 'radial' = 'linear',
  activeExampleName?: string,
  activeExampleDescription?: string
) {
  const [queue, setQueue] = useState<ExplanationQueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentExplanation = queue[currentIndex] || null;

  // Process incoming events from the bus
  useEffect(() => {
    const handleEvent = async (event: PhysicsEvent) => {
      if (dynamicEnabled) {
        let { query, placeholderTitle, placeholderEffects } = getDynamicPromptAndPlaceholder(event, gravityMode);
        
        if (activeExampleName) {
          query = `[Context: Active Sandbox Lesson - "${activeExampleName}" (${activeExampleDescription || "demonstration"})]\n${query}`;
        }
        
        const tempId = Math.random().toString(36).substr(2, 9);
        
        // 1. Avoid exact duplicate titles in queue
        let isDup = false;
        setQueue(prev => {
          if (prev.some(item => item.insight.title === placeholderTitle)) {
            isDup = true;
            return prev;
          }
          return [...prev, {
            id: tempId,
            loading: true,
            insight: {
              title: placeholderTitle,
              explanation: '✨ AI is formulating an in-depth physics explanation dynamically...',
              effects: placeholderEffects,
              formula: 'Generating...',
              suggestions: []
            },
            timestamp: Date.now()
          }];
        });

        if (isDup) return;

        // 2. Query FastAPI backend tutor endpoint
        try {
          const token = useAuthStore.getState().token;
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const resp = await fetch(getApiUrl('/api/tutor/explain-sim'), {
            method: 'POST',
            headers,
            body: JSON.stringify({ query })
          });
          if (!resp.ok) throw new Error(`Backend response error: ${resp.status}`);
          const json = await resp.json();
          if (json.success && json.data) {
            const d = json.data;
            setQueue(prev => prev.map(item => {
              if (item.id === tempId) {
                return {
                  ...item,
                  loading: false,
                  insight: {
                    title: d.title || placeholderTitle,
                    explanation: d.ai_explanation || d.explanation || 'No response details.',
                    effects: d.related_concepts?.map((c: string) => `📌 ${c}`) || placeholderEffects,
                    formula: d.formula || '',
                    suggestions: d.concepts || []
                  }
                };
              }
              return item;
            }));
          } else {
            throw new Error('Data format incorrect');
          }
        } catch (e) {
          console.warn('[LiveAI] Failed to fetch dynamic explanation:', e);
          setQueue(prev => prev.map(item => {
            if (item.id === tempId) {
              return {
                ...item,
                loading: false,
                insight: {
                  title: 'AI Explanation offline',
                  explanation: `Could not reach live tutor: ${(e as Error).message}. Verify that the FastAPI backend is running.`,
                  effects: ['Check if "uvicorn main:app --reload" is active.'],
                  formula: '',
                  suggestions: []
                }
              };
            }
            return item;
          }));
        }
      } else {
        const insight = generateInsight(event);
        if (insight) {
          setQueue(prev => {
            // Avoid exact duplicates in the queue
            if (prev.some(item => item.insight.title === insight.title)) {
              return prev;
            }
            return [...prev, {
              id: Math.random().toString(36).substr(2, 9),
              insight,
              timestamp: Date.now()
            }];
          });
        }
      }
    };

    const unsub  = physicsEventBus.subscribe('MASS_CHANGED',        handleEvent);
    const unsub2 = physicsEventBus.subscribe('GRAVITY_CHANGED',      handleEvent);
    const unsub3 = physicsEventBus.subscribe('FRICTION_CHANGED',     handleEvent);
    const unsub4 = physicsEventBus.subscribe('RESTITUTION_CHANGED',  handleEvent);
    const unsub5 = physicsEventBus.subscribe('SPRING_CREATED',       handleEvent);
    const unsub6 = physicsEventBus.subscribe('COLLISION_DETECTED',   handleEvent);
    const unsub7 = physicsEventBus.subscribe('FORCE_APPLIED',        handleEvent);
    const unsub8 = physicsEventBus.subscribe('OBJECT_SPAWNED',       handleEvent);
    const unsub9 = physicsEventBus.subscribe('OBJECT_AT_REST',       handleEvent);
    const unsubA = physicsEventBus.subscribe('PIVOT_CREATED',        handleEvent);
    const unsubB = physicsEventBus.subscribe('ROPE_CREATED',         handleEvent);

    return () => {
      unsub(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); unsub7();
      unsub8(); unsub9(); unsubA(); unsubB();
    };
  }, [dynamicEnabled, gravityMode, activeExampleName, activeExampleDescription]);

  // Auto-dismiss logic (disabled when loading to allow reading once resolved)
  useEffect(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }

    if (currentExplanation && !isHovered && !currentExplanation.loading) {
      dismissTimerRef.current = setTimeout(() => {
        handleDismiss();
      }, 9000); // 9 seconds
    }

    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [currentExplanation, isHovered]);

  const handleDismiss = () => {
    if (currentIndex < queue.length - 1) {
      // Move to next explanation in queue
      setCurrentIndex(prev => prev + 1);
    } else {
      // Clear queue if we're at the end
      setQueue([]);
      setCurrentIndex(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleClear = () => {
    setQueue([]);
    setCurrentIndex(0);
  };

  const pushExplanation = (insight: ExplanationInsight) => {
    setQueue(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      insight,
      timestamp: Date.now()
    }]);
  };

  return {
    currentExplanation,
    queueCount: queue.length - currentIndex - 1,
    handleDismiss,
    setIsHovered,
    pushExplanation,
    handleNext,
    handleClear
  };
}
