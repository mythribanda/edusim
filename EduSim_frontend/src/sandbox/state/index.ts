/**
 * EduSim Runtime State Management
 *
 * Centralized state management system for the physics sandbox runtime.
 * Provides:
 *   - Object lifecycle tracking
 *   - Selection management
 *   - Runtime state synchronization
 *   - Event subscriptions
 *   - Constraint and observable registration
 */

export { ObjectRegistry } from './objectRegistry';
export { RuntimeStore, type RuntimeState, type EventType, type RuntimeMetadata } from './runtimeStore';
export { createIntegrationHooks, getStateDebugInfo, type StateIntegrationHooks } from './stateIntegration';
