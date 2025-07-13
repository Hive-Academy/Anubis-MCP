import { WorkflowRole } from '../../../../../generated/prisma';
import {
  CreateWorkflowRoleData,
  UpdateWorkflowRoleData,
  WorkflowRoleWithRelations,
  WorkflowRoleIncludeOptions,
  WorkflowRoleFindManyOptions,
  PrismaTransaction,
} from '../types/workflow-role.types';

export interface IWorkflowRoleRepository {
  // Basic CRUD Operations
  findById(
    id: string,
    include?: WorkflowRoleIncludeOptions,
  ): Promise<WorkflowRoleWithRelations | null>;
  findByName(
    name: string,
    include?: WorkflowRoleIncludeOptions,
  ): Promise<WorkflowRoleWithRelations | null>;
  create(data: CreateWorkflowRoleData): Promise<WorkflowRoleWithRelations>;
  update(
    id: string,
    data: UpdateWorkflowRoleData,
  ): Promise<WorkflowRoleWithRelations>;
  delete(id: string): Promise<WorkflowRole>;

  // Query Operations
  findMany(
    options?: WorkflowRoleFindManyOptions,
  ): Promise<WorkflowRoleWithRelations[]>;
  findActiveRoles(
    include?: WorkflowRoleIncludeOptions,
  ): Promise<WorkflowRoleWithRelations[]>;
  findByPriority(
    priority: number,
    include?: WorkflowRoleIncludeOptions,
  ): Promise<WorkflowRoleWithRelations[]>;
  findByPriorityRange(
    minPriority: number,
    maxPriority: number,
    include?: WorkflowRoleIncludeOptions,
  ): Promise<WorkflowRoleWithRelations[]>;

  // Role Hierarchy & Delegation
  findRolesByHierarchy(
    orderBy?: 'asc' | 'desc',
    include?: WorkflowRoleIncludeOptions,
  ): Promise<WorkflowRoleWithRelations[]>;
  findDelegationCandidates(
    fromRoleId: string,
    include?: WorkflowRoleIncludeOptions,
  ): Promise<WorkflowRoleWithRelations[]>;
  findRolesWithTransitions(
    include?: WorkflowRoleIncludeOptions,
  ): Promise<WorkflowRoleWithRelations[]>;

  // Capability Management
  findRolesByCapability(
    capabilityKey: string,
    capabilityValue?: any,
    include?: WorkflowRoleIncludeOptions,
  ): Promise<WorkflowRoleWithRelations[]>;
  findRolesByResponsibility(
    responsibility: string,
    include?: WorkflowRoleIncludeOptions,
  ): Promise<WorkflowRoleWithRelations[]>;
  getRoleCapabilities(roleId: string): Promise<any>;

  updateRoleCapabilities(
    roleId: string,
    capabilities: any,
  ): Promise<WorkflowRoleWithRelations>;

  // Relationship Loading

  findWithTransitions(
    roleId: string,
    include?: WorkflowRoleIncludeOptions,
  ): Promise<WorkflowRoleWithRelations | null>;
  findWithActiveExecutions(
    roleId: string,
    include?: WorkflowRoleIncludeOptions,
  ): Promise<WorkflowRoleWithRelations | null>;
  findWithAllRelations(
    roleId: string,
  ): Promise<WorkflowRoleWithRelations | null>;

  // Utility Operations
  count(where?: any): Promise<number>;

  validateRoleExists(roleId: string): Promise<boolean>;

  // Transaction Support
  createWithTransaction(
    data: CreateWorkflowRoleData,
    tx?: PrismaTransaction,
  ): Promise<WorkflowRoleWithRelations>;
  updateWithTransaction(
    id: string,
    data: UpdateWorkflowRoleData,
    tx?: PrismaTransaction,
  ): Promise<WorkflowRoleWithRelations>;

  // Project-Specific Operations
  findRolesWithBehavioralProfiles(
    include?: WorkflowRoleIncludeOptions,
  ): Promise<WorkflowRoleWithRelations[]>;

  // Role Transition Operations
}
