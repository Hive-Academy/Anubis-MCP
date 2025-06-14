/**
 * 🚀 ConfigurableService Base Class
 *
 * TEMPLATE METHOD PATTERN IMPLEMENTATION:
 * - Consolidates identical configuration management patterns
 * - Addresses verified redundancy in workflow-guidance.service.ts, workflow-execution.service.ts,
 *   workflow-execution-operations.service.ts, execution-data-enricher.service.ts, execution-analytics.service.ts
 * - Provides type-safe configuration management with generic typing
 * - Includes optional configuration change hooks for reactive behavior
 *
 * SOLID PRINCIPLES APPLIED:
 * - Single Responsibility: Focused solely on configuration management
 * - Open/Closed: Extensible through inheritance and hooks, closed for modification
 * - Template Method: Defines configuration management algorithm, allows customization
 * - Dependency Inversion: Abstract configuration interface for concrete implementations
 */

/**
 * Base configuration interface that all service configurations must extend
 */
export interface BaseServiceConfig {
  [key: string]: unknown;
}

/**
 * Configuration change event details
 */
export interface ConfigurationChangeEvent<T extends BaseServiceConfig> {
  previousConfig: T;
  newConfig: T;
  changedKeys: (keyof T)[];
  timestamp: Date;
}

/**
 * Configuration validation result
 */
export interface ConfigurationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 🎯 ConfigurableService Abstract Base Class
 *
 * Template Method pattern implementation for configuration management.
 * Eliminates duplicate configuration management code across services.
 *
 * USAGE:
 * ```typescript
 * interface MyServiceConfig extends BaseServiceConfig {
 *   timeout: number;
 *   retries: number;
 *   enableDebug: boolean;
 * }
 *
 * @Injectable()
 * export class MyService extends ConfigurableService<MyServiceConfig> {
 *   protected readonly defaultConfig: MyServiceConfig = {
 *     timeout: 5000,
 *     retries: 3,
 *     enableDebug: false
 *   };
 *
 *   protected onConfigUpdate(): void {
 *     // Optional: React to configuration changes
 *     this.logger.log('Configuration updated');
 *   }
 *
 *   protected validateConfig(config: Partial<MyServiceConfig>): ConfigurationValidationResult {
 *     // Optional: Custom validation logic
 *     const errors: string[] = [];
 *     if (config.timeout && config.timeout < 1000) {
 *       errors.push('Timeout must be at least 1000ms');
 *     }
 *     return { isValid: errors.length === 0, errors, warnings: [] };
 *   }
 * }
 * ```
 */
export abstract class ConfigurableService<T extends BaseServiceConfig> {
  /**
   * Default configuration - must be implemented by concrete services
   * This defines the baseline configuration for the service
   */
  protected abstract readonly defaultConfig: T;

  /**
   * Current configuration state
   * Initialized with default configuration and updated through updateConfig
   */
  private config: T;

  /**
   * Configuration change history for debugging and auditing
   */
  private configHistory: ConfigurationChangeEvent<T>[] = [];

  /**
   * Maximum number of configuration changes to keep in history
   */
  private readonly maxHistorySize = 10;

  /**
   * Initialize the configurable service with default configuration
   * Note: Configuration is initialized in initializeConfig() which must be called by concrete classes
   */
  constructor() {
    // Configuration will be initialized by concrete classes calling initializeConfig()
  }

  /**
   * Initialize configuration with default values
   * Must be called by concrete classes in their constructor after super()
   */
  protected initializeConfig(): void {
    this.config = this.deepClone(this.defaultConfig);
  }

  /**
   * Update service configuration with partial configuration object
   *
   * Performs validation, applies changes, and triggers change hooks.
   * Maintains immutability by creating new configuration objects.
   *
   * @param configUpdate - Partial configuration object with updates
   * @throws Error if configuration validation fails
   */
  updateConfig(configUpdate: Partial<T>): void {
    // Validate configuration update
    const validationResult = this.validateConfig(configUpdate);
    if (!validationResult.isValid) {
      throw new Error(
        `Configuration validation failed: ${validationResult.errors.join(', ')}`,
      );
    }

    // Store previous configuration for change event
    const previousConfig = this.deepClone(this.config);

    // Apply configuration update (immutable merge)
    const newConfig = {
      ...this.config,
      ...configUpdate,
    };

    // Identify changed keys
    const changedKeys = Object.keys(configUpdate) as (keyof T)[];

    // Update current configuration
    this.config = newConfig;

    // Record configuration change
    const changeEvent: ConfigurationChangeEvent<T> = {
      previousConfig,
      newConfig: this.deepClone(newConfig),
      changedKeys,
      timestamp: new Date(),
    };

    this.addToHistory(changeEvent);

    // Trigger configuration change hook
    this.onConfigUpdate?.(changeEvent);
  }

  /**
   * Get current configuration (immutable copy)
   *
   * Returns a deep clone to prevent external mutations of configuration state.
   *
   * @returns Current configuration object (immutable)
   */
  getConfig(): T {
    return this.deepClone(this.config);
  }

  /**
   * Get specific configuration value by key
   *
   * Type-safe access to individual configuration properties.
   *
   * @param key - Configuration key
   * @returns Configuration value for the specified key
   */
  getConfigValue<K extends keyof T>(key: K): T[K] {
    return this.config[key];
  }

  /**
   * Reset configuration to default values
   *
   * Useful for testing or reverting problematic configuration changes.
   */
  resetConfig(): void {
    const previousConfig = this.deepClone(this.config);
    this.config = this.deepClone(this.defaultConfig);

    const changeEvent: ConfigurationChangeEvent<T> = {
      previousConfig,
      newConfig: this.deepClone(this.config),
      changedKeys: Object.keys(this.config) as (keyof T)[],
      timestamp: new Date(),
    };

    this.addToHistory(changeEvent);
    this.onConfigUpdate?.(changeEvent);
  }

  /**
   * Get configuration change history
   *
   * Useful for debugging configuration issues and auditing changes.
   *
   * @returns Array of configuration change events
   */
  getConfigHistory(): ConfigurationChangeEvent<T>[] {
    return [...this.configHistory]; // Return copy to prevent mutations
  }

  /**
   * Check if configuration has been modified from defaults
   *
   * @returns True if current configuration differs from default configuration
   */
  isConfigModified(): boolean {
    return !this.deepEqual(this.config, this.defaultConfig);
  }

  /**
   * Optional hook called when configuration is updated
   *
   * Override this method in concrete services to react to configuration changes.
   * Useful for invalidating caches, reconnecting services, etc.
   *
   * @param changeEvent - Details about the configuration change
   */
  protected onConfigUpdate?(changeEvent: ConfigurationChangeEvent<T>): void;

  /**
   * Optional configuration validation hook
   *
   * Override this method in concrete services to implement custom validation logic.
   * Called before applying configuration updates.
   *
   * @param configUpdate - Configuration update to validate
   * @returns Validation result with errors and warnings
   */
  protected validateConfig(
    configUpdate: Partial<T>,
  ): ConfigurationValidationResult {
    // Default implementation: no validation
    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  /**
   * Deep clone utility for immutable configuration management
   *
   * @param obj - Object to clone
   * @returns Deep clone of the object
   */
  private deepClone<U>(obj: U): U {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as U;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.deepClone(item)) as unknown as U;
    }

    const cloned = {} as U;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }

    return cloned;
  }

  /**
   * Deep equality check utility
   *
   * @param obj1 - First object to compare
   * @param obj2 - Second object to compare
   * @returns True if objects are deeply equal
   */
  private deepEqual<U>(obj1: U, obj2: U): boolean {
    if (obj1 === obj2) {
      return true;
    }

    if (
      obj1 === null ||
      obj2 === null ||
      typeof obj1 !== 'object' ||
      typeof obj2 !== 'object'
    ) {
      return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (!keys2.includes(key)) {
        return false;
      }

      if (!this.deepEqual((obj1 as any)[key], (obj2 as any)[key])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Add configuration change to history with size limit
   *
   * @param changeEvent - Configuration change event to add
   */
  private addToHistory(changeEvent: ConfigurationChangeEvent<T>): void {
    this.configHistory.push(changeEvent);

    // Maintain history size limit
    if (this.configHistory.length > this.maxHistorySize) {
      this.configHistory.shift(); // Remove oldest entry
    }
  }
}
