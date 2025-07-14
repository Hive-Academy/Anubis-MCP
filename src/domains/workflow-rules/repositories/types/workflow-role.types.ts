import { Prisma, WorkflowRole } from '../../../../../generated/prisma';

// Transaction type
export type PrismaTransaction = Prisma.TransactionClient;

// Input types
export type WorkflowRoleWhereInput = Prisma.WorkflowRoleWhereInput;
export type WorkflowRoleOrderByInput =
  Prisma.WorkflowRoleOrderByWithRelationInput;

// Comprehensive WorkflowRole with all relations
export interface WorkflowRoleWithRelations extends WorkflowRole {
  steps?: Prisma.WorkflowStepGetPayload<{
    include: {
      stepGuidance?: boolean;
      qualityChecks?: boolean;
      stepDependencies?: boolean;
    };
  }>[];
  fromTransitions?: Prisma.RoleTransitionGetPayload<{
    include: {
      toRole?: boolean;
    };
  }>[];
  toTransitions?: Prisma.RoleTransitionGetPayload<{
    include: {
      fromRole?: boolean;
    };
  }>[];
  stepProgress?: Prisma.WorkflowStepProgressGetPayload<{
    include: {
      execution?: boolean;
      step?: boolean;
    };
  }>[];
  activeExecutions?: Prisma.WorkflowExecutionGetPayload<{
    include: {
      task?: boolean;
      currentStep?: boolean;
    };
  }>[];
}

// Create and Update data types
export interface CreateWorkflowRoleData {
  name: string;
  description: string;
  priority?: number;
  isActive?: boolean;
  capabilities?: any;
  coreResponsibilities?: any;
  keyCapabilities?: any;
}

export interface UpdateWorkflowRoleData {
  name?: string;
  description?: string;
  priority?: number;
  isActive?: boolean;
  capabilities?: any;
  coreResponsibilities?: any;
  keyCapabilities?: any;
}

// Include options for flexible relation loading
export interface WorkflowRoleIncludeOptions {
  steps?:
    | boolean
    | {
        stepGuidance?: boolean;
        qualityChecks?: boolean;
        stepDependencies?: boolean;
        stepProgress?: boolean;
      };
  fromTransitions?:
    | boolean
    | {
        toRole?: boolean;
      };
  toTransitions?:
    | boolean
    | {
        fromRole?: boolean;
      };
  stepProgress?:
    | boolean
    | {
        execution?: boolean;
        step?: boolean;
      };
  activeExecutions?:
    | boolean
    | {
        task?: boolean;
        currentStep?: boolean;
        stepProgress?: boolean;
      };
  behavioralProfiles?: boolean;
}

// Find many options
export interface WorkflowRoleFindManyOptions {
  where?: WorkflowRoleWhereInput;
  include?: WorkflowRoleIncludeOptions;
  orderBy?: WorkflowRoleOrderByInput;
  skip?: number;
  take?: number;
}

// Role capability and responsibility types
export interface RoleCapability {
  [key: string]: boolean | string | number;
}

export interface RoleResponsibility {
  responsibility: string;
  description?: string;
  priority?: number;
}

// Role hierarchy types
export interface RoleHierarchyNode {
  role: WorkflowRoleWithRelations;
  children?: RoleHierarchyNode[];
  parent?: RoleHierarchyNode;
  level: number;
}

// Delegation candidate result
export interface DelegationCandidate {
  role: WorkflowRoleWithRelations;
  score: number;
  reasons: string[];
  availableTransitions: string[];
}
