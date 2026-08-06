export type SimulationIntentKind =
  | "collision"
  | "projectile_motion"
  | "gravity"
  | "newtons_third_law"
  | "newtons_second_law"
  | "friction"
  | "pendulum"
  | "circular_motion"
  | "generic";

export interface PromptIntelligenceResult {
  kind: SimulationIntentKind;
  title: string;
  educationalIntent: string;
  objects: string[];
  actions: string[];
  directions: string[];
  forces: string[];
  velocities: Array<{ value: number; unit: string; label: string }>;
  gravity?: number;
  angle?: number;
  confidence: number;
  annotations: string[];
}

function normalize(prompt: string) {
  return prompt.toLowerCase();
}

function extractFirstNumber(prompt: string) {
  const match = prompt.match(/(-?\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function extractAngle(prompt: string) {
  const angleMatch = prompt.match(/(\d+(?:\.\d+)?)\s*(?:deg|degree|degrees|°)/i);
  if (angleMatch) return Number(angleMatch[1]);
  if (normalize(prompt).includes("45 degrees")) return 45;
  return null;
}

function extractVelocity(prompt: string) {
  const velocityMatch = prompt.match(/(\d+(?:\.\d+)?)\s*(?:m\/s|meter\/s|meters per second|speed)/i);
  return velocityMatch ? Number(velocityMatch[1]) : null;
}

function keywordMatch(prompt: string, keywords: string[]) {
  return keywords.some((keyword) => prompt.includes(keyword));
}

export function analyzeSimulationPrompt(prompt: string): PromptIntelligenceResult {
  const lower = normalize(prompt);
  const angle = extractAngle(prompt);
  const velocity = extractVelocity(prompt);
  const gravity = lower.includes("moon") || lower.includes("lunar") ? 1.62 : lower.includes("earth") ? 9.81 : null;

  if (keywordMatch(lower, ["collision", "crash", "impact", "truck", "car"])) {
    const intent: PromptIntelligenceResult = {
      kind: "collision",
      title: "Collision Dynamics",
      educationalIntent: "Conservation of momentum and collision impulse",
      objects: ["truck", "vehicle", "obstacle"],
      actions: ["collide", "impact", "bounce"],
      directions: ["left", "right", "head-on"],
      forces: ["impulse", "normal force", "friction"],
      velocities: [
        { value: velocity || 18, unit: "m/s", label: "Approach speed" },
        { value: Math.max(8, (velocity || 18) * 0.65), unit: "m/s", label: "Post-impact speed" },
      ],
      confidence: 0.96,
      annotations: ["Use opposing velocities", "Highlight momentum transfer", "Show collision force spike"],
    };
    return intent;
  }

  if (keywordMatch(lower, ["projectile", "launch", "arc", "trajectory", "thrown"])) {
    return {
      kind: "projectile_motion",
      title: "Projectile Motion",
      educationalIntent: "Horizontal and vertical motion under constant acceleration due to gravity",
      objects: ["projectile", "sphere", "launcher"],
      actions: ["launch", "arc", "trajectory"],
      directions: ["upward", "forward", "downward"],
      forces: ["gravity", "air resistance"],
      velocities: [{ value: velocity || 20, unit: "m/s", label: "Launch speed" }],
      gravity: gravity || 9.81,
      angle: angle || 45,
      confidence: 0.98,
      annotations: ["Show parabolic path", "Annotate launch angle", "Display apex and range"],
    };
  }

  if (keywordMatch(lower, ["moon gravity", "low gravity", "simulate gravity", "gravity"])) {
    return {
      kind: "gravity",
      title: "Gravity Field",
      educationalIntent: "Compare motion under different gravitational fields",
      objects: ["sphere", "block", "plane"],
      actions: ["fall", "drop", "accelerate"],
      directions: ["downward"],
      forces: ["gravity"],
      velocities: [{ value: velocity || 0, unit: "m/s", label: "Initial speed" }],
      gravity: gravity || 1.62,
      confidence: 0.9,
      annotations: ["Use low gravity for lunar scenes", "Show gravity vector", "Measure distance traveled"],
    };
  }

  if (keywordMatch(lower, ["newton", "third law", "action reaction", "equal and opposite"])) {
    return {
      kind: "newtons_third_law",
      title: "Action-Reaction Pair",
      educationalIntent: "For every action force there is an equal and opposite reaction",
      objects: ["block", "truck", "sphere"],
      actions: ["push", "pull", "rebound"],
      directions: ["left", "right"],
      forces: ["action force", "reaction force"],
      velocities: [{ value: velocity || 8, unit: "m/s", label: "Interaction speed" }],
      confidence: 0.92,
      annotations: ["Highlight equal and opposite impulses", "Show force arrows in pairs"],
    };
  }

  if (keywordMatch(lower, ["newton", "second law", "f=ma", "force and acceleration"])) {
    return {
      kind: "newtons_second_law",
      title: "Force and Acceleration",
      educationalIntent: "Net force changes acceleration according to F = ma",
      objects: ["block", "sphere", "truck"],
      actions: ["push", "accelerate"],
      directions: ["forward"],
      forces: ["net force"],
      velocities: [{ value: velocity || 6, unit: "m/s", label: "Applied speed" }],
      confidence: 0.9,
      annotations: ["Show acceleration arrow", "Track momentum changes"],
    };
  }

  if (keywordMatch(lower, ["friction", "rough surface", "sliding"])) {
    return {
      kind: "friction",
      title: "Friction and Motion",
      educationalIntent: "Compare applied force and frictional resistance",
      objects: ["block", "plane", "sphere"],
      actions: ["slide", "slow", "stop"],
      directions: ["left", "right"],
      forces: ["friction", "normal force"],
      velocities: [{ value: velocity || 5, unit: "m/s", label: "Initial speed" }],
      confidence: 0.88,
      annotations: ["Expose friction coefficients", "Show energy dissipation"],
    };
  }

  if (keywordMatch(lower, ["pendulum", "swing", "oscillation", "pendular"])) {
    return {
      kind: "pendulum",
      title: "Pendulum Motion",
      educationalIntent: "Periodic oscillation caused by gravity and restoring force",
      objects: ["pendulum", "bob", "string"],
      actions: ["swing", "oscillate"],
      directions: ["left", "right"],
      forces: ["gravity", "tension"],
      velocities: [{ value: velocity || 0, unit: "m/s", label: "Release speed" }],
      gravity: gravity || 9.81,
      confidence: 0.9,
      annotations: ["Show arc path", "Measure period", "Display potential and kinetic energy"],
    };
  }

  if (keywordMatch(lower, ["circular", "orbit", "centripetal"])) {
    return {
      kind: "circular_motion",
      title: "Circular Motion",
      educationalIntent: "A body moving in a circle requires inward centripetal force",
      objects: ["sphere", "particle", "vehicle"],
      actions: ["orbit", "spin"],
      directions: ["inward", "tangent"],
      forces: ["centripetal force"],
      velocities: [{ value: velocity || 10, unit: "m/s", label: "Tangential speed" }],
      confidence: 0.84,
      annotations: ["Show inward force vector", "Track angular change"],
    };
  }

  return {
    kind: "generic",
    title: "Interactive Physics Scene",
    educationalIntent: "General purpose educational physics visualization",
    objects: ["block", "sphere", "vehicle", "character"],
    actions: ["move", "observe", "compare"],
    directions: ["left", "right", "up", "down"],
    forces: ["gravity", "friction"],
    velocities: velocity != null ? [{ value: velocity, unit: "m/s", label: "Estimated speed" }] : [],
    confidence: 0.55,
    annotations: ["Let the user refine the scene", "Use educational overlays to explain motion"],
  };
}

export function buildEnhancedPrompt(prompt: string, topic?: string) {
  const analysis = analyzeSimulationPrompt(prompt);
  const lines = [
    prompt.trim(),
    `Topic context: ${topic || analysis.title}`,
    `Intent: ${analysis.kind}`,
    `Educational goal: ${analysis.educationalIntent}`,
    `Extracted objects: ${analysis.objects.join(", ")}`,
    `Extracted actions: ${analysis.actions.join(", ")}`,
    `Extracted directions: ${analysis.directions.join(", ")}`,
    `Extracted forces: ${analysis.forces.join(", ")}`,
    analysis.gravity ? `Gravity hint: ${analysis.gravity} m/s^2` : null,
    analysis.angle != null ? `Angle hint: ${analysis.angle} degrees` : null,
    analysis.velocities.length ? `Velocity hints: ${analysis.velocities.map((v) => `${v.label}=${v.value}${v.unit}`).join(", ")}` : null,
    `Annotations: ${analysis.annotations.join("; ")}`,
  ].filter(Boolean);

  return {
    analysis,
    enhancedPrompt: lines.join("\n"),
  };
}

export function extractPromptKeywords(prompt: string) {
  const tokens = prompt
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  return Array.from(new Set(tokens));
}