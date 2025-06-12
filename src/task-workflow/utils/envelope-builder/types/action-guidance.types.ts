import { StepAction, WorkflowStep } from 'generated/prisma';
import { WorkflowGuidance } from '../../../domains/workflow-rules/services/workflow-guidance.service';

// Define our own JSON type to avoid 'any' types
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray;

export interface JsonObject {
  [key: string]: JsonValue;
}

export type JsonArray = Array<JsonValue>;

// ===== BEHAVIORAL CONTEXT TYPES =====

export interface BehavioralContext {
  approach?: string;
  principles?: string[];
  methodology?: string;
  approachMethodology?: string;
  decisionMakingPrinciples?: string[];
  qualityStandards?: string[];
  actionGuidance?: Record<string, string>;
}

export interface ApproachGuidance {
  stepByStep?: string[];
  protocol?: string[];
  methodology?: string;
  requirements?: string[];
}

export interface QualityChecklist {
  requirements?: string[];
  standards?: string[];
  validationCriteria?: string[];
}

// ===== ACTION TYPES =====

export interface ActionData {
  serviceName?: string;
  operation?: string;
  parameters?: Record<string, unknown>;
  requiredContext?: string;
  expectedOutcome?: string;
  validationCriteria?: string;
  validationScope?: string;
  analysisScope?: string;
  analysisContext?: string;
  evidenceBase?: string;
  decisionContext?: string;
  availableOptions?: string[];
  decisionCriteria?: string;
  filePath?: string;
  operationContext?: string;
  command?: string;
  environmentVariables?: Record<string, string>;
  targetRole?: string;
  handoffContext?: string;
  delegationReason?: string;
}

export interface WorkflowAction {
  actionType: string;
  actionData: ActionData;
  name?: string;
}

// ===== DATABASE RESULT TYPES =====

export interface WorkflowStepWithActions {
  id: string;
  name: string;
  displayName: string;
  description: string;
  behavioralContext: JsonValue | null;
  approachGuidance: JsonValue | null;
  qualityChecklist: JsonValue | null;
  actions: Array<{
    id: string;
    name: string;
    actionType: string;
    actionData: JsonValue;
  }>;
}

export interface WorkflowStepWithRole {
  id: string;
  name: string;
  displayName: string;
  description: string;
  behavioralContext: JsonValue | null;
  approachGuidance: JsonValue | null;
  qualityChecklist: JsonValue | null;
  role: {
    id: string;
    name: string;
  };
}

// ===== GUIDANCE GENERATION TYPES =====

export interface GuidanceContext {
  action: WorkflowAction;
  guidance: WorkflowGuidance;
  stepId: string | null;
  actionData: ActionData;
}

export interface TemplateInterpolationContext {
  action: WorkflowAction;
  guidance: WorkflowGuidance;
  stepId: string | null;
  actionData: ActionData;
}

// ===== QUALITY PATTERN TYPES =====

export interface QualityPattern {
  id: string;
  name: string;
  requirements: string[];
  standards: string[];
  validationRules: string[];
}

// ===== ROLE CONTEXT TYPES =====

export interface RoleContextData {
  approachMethodology?: string;
  decisionMakingPrinciples?: string[];
  qualityStandards?: string[];
  principles?: string[];
  methodology?: string;
  actionGuidance?: Record<string, string>;
}

// ===== SERVICE RESULT TYPES =====

export interface ActionGuidanceResult {
  success: boolean;
  guidance?: string;
  error?: string;
  context?: {
    actionType: string;
    roleName: string;
    stepId: string | null;
  };
}

// ===== EXTENDED PRISMA TYPES =====

export interface WorkflowStepWithActionsExtended extends WorkflowStep {
  actions: StepAction[];
}

// ===== TYPE GUARDS =====

export function isBehavioralContext(data: unknown): data is BehavioralContext {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.approach === 'string' ||
    Array.isArray(obj.principles) ||
    typeof obj.methodology === 'string' ||
    typeof obj.approachMethodology === 'string' ||
    Array.isArray(obj.decisionMakingPrinciples) ||
    Array.isArray(obj.qualityStandards)
  );
}

export function isApproachGuidance(data: unknown): data is ApproachGuidance {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const obj = data as Record<string, unknown>;
  return (
    Array.isArray(obj.stepByStep) ||
    Array.isArray(obj.protocol) ||
    typeof obj.methodology === 'string' ||
    Array.isArray(obj.requirements)
  );
}

export function isQualityChecklist(data: unknown): data is string[] {
  return Array.isArray(data) && data.every((item) => typeof item === 'string');
}

export function isActionData(data: unknown): data is ActionData {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  // ActionData can have various optional properties, so we just check it's an object
  return true;
}

export function isStringArray(data: unknown): data is string[] {
  return Array.isArray(data) && data.every((item) => typeof item === 'string');
}

// ===== UTILITY TYPES =====

export type ActionType =
  | 'MCP_CALL'
  | 'VALIDATION'
  | 'ANALYSIS'
  | 'DECISION'
  | 'FILE_OPERATION'
  | 'COMMAND'
  | 'DELEGATION'
  | 'TESTING_IMPLEMENTATION'
  | 'QUALITY_VALIDATION'
  | 'REMINDER';

export type RoleName =
  | 'boomerang'
  | 'researcher'
  | 'architect'
  | 'senior-developer'
  | 'code-review'
  | 'integration-engineer';
