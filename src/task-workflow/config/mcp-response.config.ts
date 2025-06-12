/**
 * 🎯 MCP RESPONSE CONFIGURATION
 *
 * Optimized for clear, focused responses without overwhelming verbosity
 */

export interface McpResponseConfig {
  includeDebugInfo: boolean;
  maxResponseSize: number;
  maxEssentialInputs: number; // NEW: Cap on input count
  enablePerformanceOptimizations: boolean; // NEW: Performance flags
}

export const MCP_RESPONSE_CONFIG: McpResponseConfig = {
  includeDebugInfo: false, // DISABLED: Debug logs were overwhelming MCP responses
  maxResponseSize: 50000, // 50KB limit

  // 🎯 OPTIMIZATION SETTINGS
  maxEssentialInputs: 5, // LIMIT: Maximum essential inputs per operation
  enablePerformanceOptimizations: true, // ENABLED: Use lightweight operations
};

// Helper function to check if debug info should be included
export function shouldIncludeDebugInfo(): boolean {
  return MCP_RESPONSE_CONFIG.includeDebugInfo;
}

// 🎯 Helper function to get max essential inputs
export function getMaxEssentialInputs(): number {
  return MCP_RESPONSE_CONFIG.maxEssentialInputs;
}

// 🎯 Helper function to check if performance optimizations are enabled
export function shouldEnablePerformanceOptimizations(): boolean {
  return MCP_RESPONSE_CONFIG.enablePerformanceOptimizations;
}

/**
 * 🎯 RESPONSE SIZE ESTIMATION
 *
 * Helps monitor and optimize response sizes
 */
export function estimateResponseSize(data: any): number {
  try {
    return JSON.stringify(data).length;
  } catch {
    return 0;
  }
}

/**
 * 🎯 INPUT COUNT TRACKING
 *
 * Helps monitor input extraction improvements
 */
export function logInputReduction(
  before: number,
  after: number,
  context: string,
): void {
  if (shouldIncludeDebugInfo()) {
    console.log(
      `[MCP Optimization] ${context}: Reduced inputs from ${before} to ${after} (${Math.round((1 - after / before) * 100)}% reduction)`,
    );
  }
}
