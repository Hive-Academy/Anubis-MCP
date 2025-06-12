// ===== VALIDATION CONTEXT TYPES =====
export interface ValidationContext {
  qualityPatterns: QualityPattern[];
  validationChecks: ValidationCheck[];
  antiPatterns: AntiPattern[];
  roleSpecificStandards: string[];
  stepSpecificCriteria: string[];
  projectStandards: string[];
}

export interface QualityPattern {
  id: string;
  name: string;
  description: string;
  category: string;
  requirements: string[];
  examples: string[];
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ValidationCheck {
  id: string;
  name: string;
  description: string;
  checkType: 'AUTOMATED' | 'MANUAL' | 'HYBRID';
  criteria: string[];
  expectedOutcome: string;
  failureActions: string[];
}

export interface AntiPattern {
  id: string;
  name: string;
  description: string;
  category: string;
  indicators: string[];
  consequences: string[];
  remediation: string[];
}

// ===== VALIDATION RESULT TYPES =====
export interface ValidationContextResult {
  success: boolean;
  context?: ValidationContext;
  error?: string;
  metadata?: {
    taskId: number;
    roleName: string;
    stepId: string | null;
    patternsCount: number;
    checksCount: number;
    antiPatternsCount: number;
  };
}

export interface RoleStandards {
  qualityStandards: string[];
  behavioralPrinciples: string[];
  methodologyRequirements: string[];
  patternCompliance: string[];
}

export interface StepCriteria {
  completionCriteria: string[];
  qualityGates: string[];
  validationRules: string[];
  successMetrics: string[];
}

export interface ProjectStandards {
  codingStandards: string[];
  architecturalPrinciples: string[];
  qualityRequirements: string[];
  complianceRules: string[];
}

// ===== DATABASE RESULT TYPES =====
export interface WorkflowRoleWithBehavior {
  id: string;
  name: string;
  behavioralContext?: Record<string, unknown>;
  qualityStandards?: string[];
}

export interface WorkflowStepWithCriteria {
  id: string;
  name: string;
  completionCriteria?: string[];
  qualityChecklist?: Record<string, unknown>;
  patternEnforcement?: Record<string, unknown>;
}

export interface TaskWithProject {
  id: number;
  name: string;
  projectStandards?: string[];
  qualityRequirements?: string[];
}

// ===== TYPE GUARDS =====
export function isValidationContext(data: unknown): data is ValidationContext {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    Array.isArray(obj.qualityPatterns) &&
    Array.isArray(obj.validationChecks) &&
    Array.isArray(obj.antiPatterns) &&
    Array.isArray(obj.roleSpecificStandards) &&
    Array.isArray(obj.stepSpecificCriteria) &&
    Array.isArray(obj.projectStandards)
  );
}

export function isQualityPattern(data: unknown): data is QualityPattern {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.category === 'string' &&
    Array.isArray(obj.requirements) &&
    Array.isArray(obj.examples) &&
    (obj.priority === 'HIGH' ||
      obj.priority === 'MEDIUM' ||
      obj.priority === 'LOW')
  );
}

export function isValidationCheck(data: unknown): data is ValidationCheck {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.description === 'string' &&
    (obj.checkType === 'AUTOMATED' ||
      obj.checkType === 'MANUAL' ||
      obj.checkType === 'HYBRID') &&
    Array.isArray(obj.criteria) &&
    typeof obj.expectedOutcome === 'string' &&
    Array.isArray(obj.failureActions)
  );
}

export function isAntiPattern(data: unknown): data is AntiPattern {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.category === 'string' &&
    Array.isArray(obj.indicators) &&
    Array.isArray(obj.consequences) &&
    Array.isArray(obj.remediation)
  );
}

export function isRoleStandards(data: unknown): data is RoleStandards {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    Array.isArray(obj.qualityStandards) &&
    Array.isArray(obj.behavioralPrinciples) &&
    Array.isArray(obj.methodologyRequirements) &&
    Array.isArray(obj.patternCompliance)
  );
}

export function isStepCriteria(data: unknown): data is StepCriteria {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    Array.isArray(obj.completionCriteria) &&
    Array.isArray(obj.qualityGates) &&
    Array.isArray(obj.validationRules) &&
    Array.isArray(obj.successMetrics)
  );
}

export function isStringArray(data: unknown): data is string[] {
  return Array.isArray(data) && data.every((item) => typeof item === 'string');
}

// ===== UTILITY TYPES =====
export type ValidationPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type CheckType = 'AUTOMATED' | 'MANUAL' | 'HYBRID';
export type PatternCategory =
  | 'ARCHITECTURAL'
  | 'CODE_QUALITY'
  | 'SECURITY'
  | 'PERFORMANCE'
  | 'MAINTAINABILITY';

export interface ValidationContextMetadata {
  taskId: number;
  roleName: string;
  stepId: string | null;
  generatedAt: Date;
  validationScope: 'ROLE' | 'STEP' | 'PROJECT' | 'GLOBAL';
}
