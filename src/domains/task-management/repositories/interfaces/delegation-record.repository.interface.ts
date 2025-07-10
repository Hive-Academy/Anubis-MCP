/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import { DelegationRecord } from '../../../../../generated/prisma';
import {
  CreateDelegationRecordData,
  DelegationRecordOrderByInput,
  DelegationRecordWhereInput,
  DelegationRecordWithRelations,
  PrismaTransaction,
  UpdateDelegationRecordData,
} from '../types/delegation-record.types';

export interface IDelegationRecordRepository {
  // Basic CRUD Operations
  findById(
    id: number,
    include?: DelegationRecordIncludeOptions,
  ): Promise<DelegationRecordWithRelations | null>;
  findByTaskId(
    taskId: number,
    include?: DelegationRecordIncludeOptions,
  ): Promise<DelegationRecordWithRelations[]>;
  create(
    data: CreateDelegationRecordData,
  ): Promise<DelegationRecordWithRelations>;
  update(
    id: number,
    data: UpdateDelegationRecordData,
  ): Promise<DelegationRecordWithRelations>;
  delete(id: number): Promise<DelegationRecord>;

  // Query Operations
  findMany(
    options?: DelegationRecordFindManyOptions,
  ): Promise<DelegationRecordWithRelations[]>;

  // Transaction Support
  createWithTransaction(
    data: CreateDelegationRecordData,
    tx?: PrismaTransaction,
  ): Promise<DelegationRecordWithRelations>;
  updateWithTransaction(
    id: number,
    data: UpdateDelegationRecordData,
    tx?: PrismaTransaction,
  ): Promise<DelegationRecordWithRelations>;
}

export interface DelegationRecordIncludeOptions {
  task?: boolean;
}

export interface DelegationRecordFindManyOptions {
  where?: DelegationRecordWhereInput;
  include?: DelegationRecordIncludeOptions;
  orderBy?: DelegationRecordOrderByInput;
  skip?: number;
  take?: number;
}

export interface RoleTransition {
  fromRole: string;
  toRole: string;
  transitionDate: Date;
  duration: number | null;
  handoffMessage: string | null;
  success: boolean;
}

export interface RolePerformanceMetrics {
  role: string;
  totalDelegations: number;
  averageHandoffTime: number | null;
  successRate: number;
  commonTransitions: string[];
  performanceScore: number | null;
}

export interface DelegationPattern {
  fromRole: string;
  toRole: string;
  frequency: number;
  averageDuration: number | null;
  successRate: number;
  commonReasons: string[];
}

export interface DelegationStatistics {
  totalDelegations: number;
  uniqueRoles: number;
  averageChainLength: number;
  mostActiveRole: string | null;
  delegationTrends: DelegationTrend[];
}

export interface DelegationTrend {
  date: Date;
  delegationCount: number;
  uniqueRoles: number;
  averageHandoffTime: number | null;
}

export interface DelegationEfficiency {
  totalHandoffs: number;
  averageHandoffTime: number | null;
  fastestHandoff: number | null;
  slowestHandoff: number | null;
  efficiencyScore: number;
  bottlenecks: string[];
}

export interface BottleneckAnalysis {
  role: string;
  averageProcessingTime: number;
  queueLength: number;
  delayFactor: number;
  recommendations: string[];
}

export interface DelegationValidationResult {
  isValid: boolean;
  chainLength: number;
  missingHandoffs: string[];
  duplicateRoles: string[];
  recommendations: string[];
}

export interface DelegationConflict {
  taskId: number;
  conflictType: string;
  description: string;
  affectedRoles: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolution: string | null;
}
