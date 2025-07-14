import { Prisma } from '../../../../../generated/prisma';

// Transaction type
export type PrismaTransaction = Prisma.TransactionClient;

// Simplified types for progress calculation operations
export interface TaskBasicInfo {
  id: number;
  name: string;
  status: string;
  createdAt: Date;
}

export interface RoleWithSteps {
  id: string;
  name: string;
  steps: {
    id: string;
    name: string;
    sequenceNumber: number;
    description: string;
    approach: string;
    roleId: string;
    isRequired: boolean;
    stepType: string;
  }[];
}

export interface StepProgressWithRelations {
  id: string;
  taskId: string | null;
  stepId: string;
  roleId: string;
  status: string;
  result: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  step: {
    id: string;
    name: string;
    sequenceNumber: number;
    description: string;
    approach: string;
    roleId: string;
    isRequired: boolean;
    stepType: string;
  };
  role: {
    id: string;
    name: string;
    description: string;
    priority: number;
    isActive: boolean;
    capabilities: Prisma.JsonValue;
    coreResponsibilities: Prisma.JsonValue;
    keyCapabilities: Prisma.JsonValue;
  };
}

// Result wrapper type
export interface ProgressCalculationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
