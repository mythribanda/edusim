import assetSemanticIndex from '../data/assetSemanticIndex.json';
import categories from '../data/categories.json';
import objectData from '../data/objectData.js'; // Fallback if needed

// Normalize prompt keywords
export const normalizePrompt = (prompt) => {
  if (!prompt) return "generic_sandbox";
  const p = prompt.toLowerCase();
  
  if (p.includes("rocket") || p.includes("launch") || p.includes("spacecraft") || p.includes("missile")) return "rocket_launch";
  if (p.includes("launch") || p.includes("upward") || p.includes("projectile") || p.includes("arc")) return "projectile_motion";
  if (p.includes("revolving") || p.includes("orbit") || p.includes("circular")) return "circular_motion";
  if (p.includes("blood flow") || p.includes("heart") || p.includes("circulatory")) return "biology_circulatory";
  if (p.includes("collide") || p.includes("collision") || p.includes("crash")) return "collision";
  if (p.includes("water cycle") || p.includes("rain") || p.includes("evaporation")) return "water_cycle";
  if (p.includes("cell") || p.includes("mitochondria")) return "biology_cell";
  if (p.includes("reaction") || p.includes("molecule") || p.includes("atom")) return "chemistry_reaction";

  return p;
};

// Explicit Keyword Mapping
export const objectKeywords = {
  rocket: ["rocket", "missile", "spacecraft", "launch vehicle", "launch"],
  truck: ["truck", "lorry", "heavy vehicle"],
  car: ["car", "vehicle", "automobile"],
  ball: ["ball", "football", "sphere", "soccer"],
  planet: ["planet", "earth", "mars", "jupiter", "saturn", "moon"],
  satellite: ["satellite"],
  pendulum: ["pendulum", "swinging weight"],
  box: ["box", "cube", "block", "crate"]
};

// Explicit Asset Mapping
export const explicitAssetMap = {
  rocket: "/assets/vehicles/rocket.png",
  truck: "/assets/vehicles/truck.png",
  car: "/assets/vehicles/car.png",
  ball: "/assets/items/sports/ball.png",
  planet: "/assets/space/planet.png",
  satellite: "/assets/space/satellite.png",
  box: "/assets/items/generic/box.png"
};

// Robust semantic fallback map for missing assets
export const fallbackObjectMap = {
  rocket: {
    shape: "rectangle",
    color: "#facc15",
    label: "Rocket",
    fallbackAsset: "/assets/vehicles/rocket.png",
    emoji: "🚀",
    width: 0.8,
    height: 2.4
  },
  missile: {
    shape: "rectangle",
    color: "#ef4444",
    label: "Missile",
    emoji: "🚀",
    width: 0.5,
    height: 1.8
  },
  spaceship: {
    shape: "rectangle",
    color: "#60a5fa",
    label: "Spaceship",
    emoji: "🛸",
    width: 1.5,
    height: 1.0
  },
  satellite: {
    shape: "rectangle",
    color: "#a78bfa",
    label: "Satellite",
    emoji: "🛰️",
    width: 1.2,
    height: 0.8
  },
  ball: {
    shape: "circle",
    color: "#22c55e",
    label: "Ball",
    emoji: "⚽",
    radius: 0.4
  },
  planet: {
    shape: "circle",
    color: "#3b82f6",
    label: "Planet",
    emoji: "🌍",
    radius: 1.0
  }
};

// Main Asset Resolver with Fallback Hierarchy
export const resolveAssetByKeywords = (prompt = "", objectType = "", subject = "physics") => {
  const query = (objectType || prompt || "").toLowerCase();
  const lowerPrompt = prompt.toLowerCase();
  const index = assetSemanticIndex || {};
  
  console.log(`[AssetResolver] Resolving for: "${query}" (Prompt: "${lowerPrompt}")`);

  // 1. Explicit Keyword Detection
  let detectedObject = null;
  for (const [type, keywords] of Object.entries(objectKeywords)) {
    if (keywords.some(keyword => query.includes(keyword) || lowerPrompt.includes(keyword))) {
      detectedObject = type;
      break;
    }
  }

  if (detectedObject) {
    console.log("Detected object type:", detectedObject);
    if (explicitAssetMap[detectedObject]) {
      const path = explicitAssetMap[detectedObject];
      console.log("Resolved via explicit map:", path);
      return path;
    }
  }

  // 2. Exact match in index keys (semantic index)
  if (index[query]?.path) {
    console.log("Resolved via semantic index exact match:", index[query].path);
    return index[query].path;
  }

  // 3. Alias or Substring match in index
  for (const [key, data] of Object.entries(index)) {
    if (key.includes(query) || (data.aliases && data.aliases.includes(query))) {
      console.log("Resolved via semantic index alias match:", data.path);
      return data.path;
    }
  }

  // 4. objectData.js search
  for (const [key, data] of Object.entries(objectData)) {
    const normKey = key.toLowerCase();
    if (normKey.includes(query) && data.file) {
      const path = `/assets/${data.file}`;
      console.log("Resolved via objectData search:", path);
      return path;
    }
  }

  // 5. Subject-based fallback
  const subjLower = subject.toLowerCase();
  console.log("Attempting subject-based fallback for:", subjLower);
  
  if (detectedObject && fallbackObjectMap[detectedObject]) {
    const path = fallbackObjectMap[detectedObject].fallbackAsset || "";
    if (path) {
      console.log("Resolved via fallbackObjectMap:", path);
      return path;
    }
  }

  if (subjLower === "physics") {
    // Check if we can find ANY physics item before defaulting to box
    const categoryAssets = categories[subjLower] || [];
    if (categoryAssets.length > 0) {
      const first = categoryAssets[0];
      if (index[first]?.path) {
        console.log("Resolved via subject category fallback:", index[first].path);
        return index[first].path;
      }
    }
    console.log("Final Physics Fallback: generic box");
    return "/assets/items/generic/box.png";
  }

  if (subjLower === "biology") return "/assets/biology/generic_cell.png";
  if (subjLower === "chemistry") return "/assets/chemistry/molecule_generic.png";
  if (subjLower === "math") return "/assets/math/point.png";

  // 6. Minimal vector renderer fallback
  console.log("No asset resolved, returning empty for primitive render");
  return ""; 
};
