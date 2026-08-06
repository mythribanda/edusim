export function isMeaningfulChange(oldValue: any, newValue: any, property?: string): boolean {
  if (oldValue === undefined || newValue === undefined) return true;
  
  if (typeof oldValue === 'number' && typeof newValue === 'number') {
    const diff = Math.abs(newValue - oldValue);
    
    // Define thresholds per property to avoid micro-fluctuations spamming events
    switch (property) {
      case 'mass':
        return diff >= 0.5;
      case 'friction':
      case 'restitution':
      case 'frictionAir':
        return diff >= 0.05;
      case 'gravity':
        return diff >= 0.2;
      case 'velocity':
        return diff >= 1.0;
      default:
        // Default relative threshold of 5% or absolute of 0.1
        return diff > 0.1 || diff / (Math.abs(oldValue) || 1) > 0.05;
    }
  }

  return oldValue !== newValue;
}

export function isVectorMeaningfulChange(oldVec: {x: number, y: number}, newVec: {x: number, y: number}, threshold = 0.5): boolean {
  if (!oldVec || !newVec) return true;
  const dx = newVec.x - oldVec.x;
  const dy = newVec.y - oldVec.y;
  return Math.sqrt(dx * dx + dy * dy) >= threshold;
}
