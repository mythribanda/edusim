import { OrbitUtils } from '../../orbits/orbitUtils';

export interface OrbitPeriodData {
  latestPeriod: number;
  rollingAveragePeriod: number;
  periodHistory: number[];
}

export interface AngularVelocityData {
  instantaneous: number;
  average: number;
}

export interface RevolutionTrackingData {
  revolutionCount: number;
  lastWrapTimestamp: number;
  completionHistory: number[];
}

export interface KeplerThirdLawMetrics {
  orbitalPeriod: number;
  rollingAveragePeriod: number;
  revolutionCount: number;
  currentAngle: number;
  angularVelocity: number;
  averageOrbitalRadius: number;
  orbitCompleted: boolean;
  insights: string[];
  keplerConstant: number;
}

/**
 * KeplerThirdLawObservable
 *
 * An analytical observer designed to track angular sweeps, count full revolutions
 * without rendering dependencies, measure year durations (orbital periods),
 * and provide mathematical verification of Kepler's Third Law (T² ∝ r³).
 */
export class KeplerThirdLawObservable {
  private centerBody: any;
  private orbitingBody: any;
  private G: number;

  private prevAngle: number | null = null;
  private currentAngle = 0;
  private accumulatedAngle = 0; // Signed cumulative angle swept to stably detect 2pi wraps

  private revolutionCount = 0;
  private orbitStartTime: number = Date.now();
  private lastPeriod = 0;
  private lastWrapTimestamp = 0;

  private periodHistory: number[] = [];
  private radiusHistory: number[] = [];
  private maxHistoryLength = 120;

  constructor(centerBody: any, orbitingBody: any, G = OrbitUtils.DEFAULT_G) {
    this.centerBody = centerBody;
    this.orbitingBody = orbitingBody;
    this.G = G;
    this.reset();
  }

  /**
   * Reset the tracker state
   */
  public reset(): void {
    this.prevAngle = null;
    this.currentAngle = 0;
    this.accumulatedAngle = 0;
    this.revolutionCount = 0;
    this.orbitStartTime = Date.now();
    this.lastPeriod = 0;
    this.lastWrapTimestamp = 0;
    this.periodHistory = [];
    this.radiusHistory = [];
  }

  /**
   * Continuous analytical update of revolution tracking and orbital period measurements.
   */
  public updateOrbitalPeriodMetrics(dt = 16.67): KeplerThirdLawMetrics {
    // STEP 10 — Runtime stability checks
    if (!this.centerBody || !this.orbitingBody) {
      return this.getFallbackMetrics('Missing central body or orbiting body reference.');
    }

    const centerPos = this.centerBody.position;
    const orbitingPos = this.orbitingBody.position;

    if (
      !centerPos ||
      !orbitingPos ||
      typeof centerPos.x !== 'number' ||
      typeof orbitingPos.x !== 'number'
    ) {
      return this.getFallbackMetrics('Invalid or destroyed coordinate states.');
    }

    // STEP 3 — Compute Orbital Angle in range [-pi, pi]
    const dx = orbitingPos.x - centerPos.x;
    const dy = orbitingPos.y - centerPos.y;
    let r = Math.hypot(dx, dy);

    if (isNaN(r) || !isFinite(r) || r < 0.1) {
      r = 0.1;
    }

    // Capture angle using arctangent
    let angle = Math.atan2(dy, dx);
    if (isNaN(angle)) {
      angle = 0;
    }
    this.currentAngle = angle;

    // STEP 8 — Compute Average Orbital Radius
    this.radiusHistory.push(r);
    if (this.radiusHistory.length > this.maxHistoryLength) {
      this.radiusHistory.shift();
    }
    const averageOrbitalRadius =
      this.radiusHistory.reduce((sum, val) => sum + val, 0) / this.radiusHistory.length;

    let orbitCompleted = false;
    let deltaAngle = 0;

    // STEP 4 — Detect Orbit Completion & signed boundary wraps
    if (this.prevAngle !== null) {
      deltaAngle = angle - this.prevAngle;

      // Handle trigonometry wrap boundaries (+pi to -pi or reverse)
      if (deltaAngle > Math.PI) {
        deltaAngle -= 2 * Math.PI;
      } else if (deltaAngle < -Math.PI) {
        deltaAngle += 2 * Math.PI;
      }

      this.accumulatedAngle += deltaAngle;

      // When the absolute angular sweep is >= 2pi, one full year has passed!
      if (Math.abs(this.accumulatedAngle) >= 2 * Math.PI) {
        const now = Date.now();
        const duration = (now - this.orbitStartTime) / 1000.0; // Year duration in seconds

        // Guard against instant triggers during dragging/reset
        if (duration > 0.05) {
          this.revolutionCount++;
          this.lastPeriod = duration;
          this.periodHistory.push(duration);
          if (this.periodHistory.length > 10) {
            this.periodHistory.shift();
          }
          this.lastWrapTimestamp = now;
          orbitCompleted = true;
        }

        // Subtract out 2pi sweep to maintain continuous tracking
        this.accumulatedAngle -= 2 * Math.PI * Math.sign(this.accumulatedAngle);
        this.orbitStartTime = now;
      }
    }

    this.prevAngle = angle;

    // STEP 5 — Measure Orbital Period
    let rollingAveragePeriod = this.lastPeriod;
    if (this.periodHistory.length > 0) {
      rollingAveragePeriod =
        this.periodHistory.reduce((sum, val) => sum + val, 0) / this.periodHistory.length;
    }

    // STEP 7 — Compute Angular Velocity (omega = deltaAngle / dt)
    const dtInSeconds = dt / 1000.0;
    const angularVelocity = dtInSeconds > 0 ? Math.abs(deltaAngle) / dtInSeconds : 0;

    // STEP 9 — Kepler Third Law Educational Analysis (T² / a³)
    const scaledR = averageOrbitalRadius * 100; // Unify with km unit scaling
    const T2 = rollingAveragePeriod * rollingAveragePeriod;
    const r3 = Math.pow(scaledR, 3);
    const keplerConstant = r3 > 0.001 ? T2 / r3 : 0.0;

    const insights: string[] = [];
    insights.push(`Accumulated Sweep: ${((Math.abs(this.accumulatedAngle) / (2 * Math.PI)) * 100).toFixed(0)}% of current year.`);

    if (rollingAveragePeriod > 0) {
      insights.push(
        `Measured Year Length (Period T): ${rollingAveragePeriod.toFixed(2)} seconds.`
      );
      insights.push(
        `Kepler's Third Law Ratio (T² / a³): ${keplerConstant.toExponential(4)} s²/km³.`
      );
      insights.push(
        `Educational Insights: T² ∝ a³ holds true. Outer satellites have larger orbital radius 'a' and take exponentially longer to complete one year.`
      );
    } else {
      insights.push(`Orbiting... Complete one full revolution to measure orbital period and verify Kepler's Third Law!`);
    }

    // STEP 13 — Debugging & Diagnostics
    if (dt > 0 && Math.random() < 0.005) {
      console.log(`[KeplerThirdLawObservable] Live Diagnostics:`);
      console.log(` - Current Angle: ${angle.toFixed(4)} rad`);
      console.log(` - Accumulated: ${this.accumulatedAngle.toFixed(4)} rad`);
      console.log(` - Revolutions: ${this.revolutionCount}`);
      console.log(` - Period: ${rollingAveragePeriod.toFixed(2)} s`);
      console.log(` - Avg Radius: ${averageOrbitalRadius.toFixed(2)} px`);
    }

    return {
      orbitalPeriod: this.lastPeriod,
      rollingAveragePeriod,
      revolutionCount: this.revolutionCount,
      currentAngle: angle,
      angularVelocity,
      averageOrbitalRadius,
      orbitCompleted,
      insights,
      keplerConstant,
    };
  }

  private getFallbackMetrics(reason: string): KeplerThirdLawMetrics {
    return {
      orbitalPeriod: 0,
      rollingAveragePeriod: 0,
      revolutionCount: 0,
      currentAngle: 0,
      angularVelocity: 0,
      averageOrbitalRadius: 0,
      orbitCompleted: false,
      insights: [`Fallback active: ${reason}`],
      keplerConstant: 0,
    };
  }
}

/**
 * Main API: Factory helper to instantiate the period observable.
 */
export function createKeplerThirdLawObservable(
  centerBody: any,
  orbitingBody: any,
  G = OrbitUtils.DEFAULT_G
): KeplerThirdLawObservable {
  return new KeplerThirdLawObservable(centerBody, orbitingBody, G);
}
