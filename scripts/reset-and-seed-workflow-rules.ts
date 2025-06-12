#!/usr/bin/env tsx

import {
  PrismaClient,
  RoleType,
  StepType,
  ConditionType,
  ActionType,
} from '../generated/prisma';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface RoleDefinition {
  roleId: string;
  name: string;
  displayName: string;
  description: string;
  priority: number;
  isActive: boolean;
  roleType: string;
  capabilities: Record<string, boolean>;
  coreResponsibilities: string[];
  keyCapabilities: string[];
  executionProtocol: string;
  behavioralContext: {
    approachMethodology: string;
    decisionMakingPrinciples: string[];
    qualityStandards: string[];
    [key: string]: any;
  };
}

interface WorkflowStep {
  name: string;
  displayName: string;
  description: string;
  sequenceNumber: number;
  isRequired: boolean;
  estimatedTime: string;
  stepType: string;
  behavioralContext: Record<string, any>;
  approachGuidance: Record<string, any>;
  qualityChecklist: string[];
  conditions: any[];
  actions: any[];
  triggerReport: boolean;
  reportType?: string;
  reportTemplate?: string;
}

interface RoleTransition {
  fromRoleId: string;
  toRoleId: string;
  transitionName: string;
  conditions: Record<string, boolean>;
  requirements: Record<string, boolean>;
  validationRules: Record<string, string>;
  handoffGuidance: Record<string, string[]>;
  contextPreservation: Record<string, string>;
  isActive: boolean;
}

interface ServiceOrchestrationProtocols {
  serviceOrchestrationProtocols: {
    description: string;
    coreOrchestrator: string;
    supportedServices: Record<string, any>;
    orchestrationPatterns: Record<string, any>;
    actionTypeMapping: Record<string, any>;
    serviceCallProtocol: Record<string, any>;
    qualityStandards: Record<string, any>;
    [key: string]: any;
  };
}

const ROLES = [
  'boomerang',
  'researcher',
  'architect',
  'senior-developer',
  'code-review',
  'integration-engineer',
];
const JSON_BASE_PATH = path.join(
  process.cwd(),
  'enhanced-workflow-rules',
  'json',
);

// Helper function to convert string to enum
function parseRoleType(roleType: string): RoleType {
  switch (roleType.toUpperCase()) {
    case 'WORKFLOW':
      return RoleType.WORKFLOW;
    case 'SPECIALIST':
      return RoleType.SPECIALIST;
    case 'QUALITY_GATE':
      return RoleType.QUALITY_GATE;
    default:
      return RoleType.WORKFLOW;
  }
}

function parseStepType(stepType: string): StepType {
  switch (stepType.toUpperCase()) {
    case 'VALIDATION':
      return StepType.VALIDATION;
    case 'ACTION':
      return StepType.ACTION;
    case 'DECISION':
      return StepType.DECISION;
    case 'DELEGATION':
      return StepType.DELEGATION;
    case 'ANALYSIS':
      return StepType.ANALYSIS;
    case 'REPORTING':
      return StepType.REPORTING;
    default:
      return StepType.ACTION;
  }
}

function parseConditionType(conditionType: string): ConditionType {
  switch (conditionType.toUpperCase()) {
    case 'CONTEXT_CHECK':
      return ConditionType.CONTEXT_CHECK;
    case 'FILE_EXISTS':
      return ConditionType.FILE_EXISTS;
    case 'TASK_STATUS':
      return ConditionType.TASK_STATUS;
    case 'GIT_STATUS':
      return ConditionType.GIT_STATUS;
    case 'PREVIOUS_STEP_COMPLETED':
      return ConditionType.PREVIOUS_STEP_COMPLETED;
    case 'CUSTOM_LOGIC':
      return ConditionType.CUSTOM_LOGIC;
    default:
      return ConditionType.CONTEXT_CHECK;
  }
}

function parseActionType(actionType: string): ActionType {
  switch (actionType.toUpperCase()) {
    case 'COMMAND':
      return ActionType.COMMAND;
    case 'MCP_CALL':
      return ActionType.MCP_CALL;
    case 'VALIDATION':
      return ActionType.VALIDATION;
    case 'REMINDER':
      return ActionType.REMINDER;
    case 'FILE_OPERATION':
      return ActionType.FILE_OPERATION;
    case 'REPORT_GENERATION':
      return ActionType.REPORT_GENERATION;
    default:
      return ActionType.MCP_CALL;
  }
}

async function resetDatabase() {
  console.log('🗑️  Resetting database...');

  try {
    // Delete in correct order to handle foreign key constraints
    // First: Delete all records that reference WorkflowRole
    await prisma.workflowStepProgress.deleteMany();
    await prisma.workflowExecution.deleteMany();
    await prisma.projectBehavioralProfile.deleteMany();

    // Second: Delete step-related records
    await prisma.stepAction.deleteMany();
    await prisma.stepCondition.deleteMany();
    await prisma.workflowStep.deleteMany();

    // Third: Delete role transitions
    await prisma.roleTransition.deleteMany();

    // Finally: Delete workflow roles
    await prisma.workflowRole.deleteMany();

    console.log('✅ Database reset completed');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  }
}

async function loadJsonFile<T>(filePath: string): Promise<T> {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent) as T;
  } catch (error) {
    console.error(`❌ Error loading JSON file ${filePath}:`, error);
    throw error;
  }
}

async function seedWorkflowRoles() {
  console.log('👥 Seeding workflow roles...');

  for (const roleName of ROLES) {
    const roleDefPath = path.join(
      JSON_BASE_PATH,
      roleName,
      'role-definition.json',
    );
    const roleDefinition = await loadJsonFile<RoleDefinition>(roleDefPath);

    try {
      const createdRole = await prisma.workflowRole.create({
        data: {
          name: roleDefinition.name,
          displayName: roleDefinition.displayName,
          description: roleDefinition.description,
          priority: roleDefinition.priority,
          isActive: roleDefinition.isActive,
          roleType: parseRoleType(roleDefinition.roleType),
          capabilities: {
            ...roleDefinition.capabilities,
            coreResponsibilities: roleDefinition.coreResponsibilities,
            keyCapabilities: roleDefinition.keyCapabilities,
            executionProtocol: roleDefinition.executionProtocol,
            behavioralContext: roleDefinition.behavioralContext,
          },
        },
      });

      console.log(
        `✅ Created role: ${createdRole.name} (ID: ${createdRole.id})`,
      );
    } catch (error) {
      console.error(`❌ Error creating role ${roleName}:`, error);
      throw error;
    }
  }
}

async function seedWorkflowSteps() {
  console.log('📋 Seeding workflow steps...');

  for (const roleName of ROLES) {
    const role = await prisma.workflowRole.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    const stepsPath = path.join(
      JSON_BASE_PATH,
      roleName,
      'workflow-steps.json',
    );
    const stepsData = await loadJsonFile<{ workflowSteps: WorkflowStep[] }>(
      stepsPath,
    );

    for (const step of stepsData.workflowSteps) {
      try {
        const createdStep = await prisma.workflowStep.create({
          data: {
            roleId: role.id,
            name: step.name,
            displayName: step.displayName,
            description: step.description,
            sequenceNumber: step.sequenceNumber,
            isRequired: step.isRequired,
            estimatedTime: step.estimatedTime,
            stepType: parseStepType(step.stepType),
            behavioralContext: step.behavioralContext,
            approachGuidance: step.approachGuidance,
            qualityChecklist: step.qualityChecklist,
            triggerReport: step.triggerReport,
            reportType: step.reportType,
            reportTemplate: step.reportTemplate,
          },
        });

        // Create step conditions
        for (const condition of step.conditions) {
          await prisma.stepCondition.create({
            data: {
              stepId: createdStep.id,
              name: condition.name,
              conditionType: parseConditionType(condition.conditionType),
              logic: condition.logic,
            },
          });
        }

        // Create step actions
        if (step.actions && step.actions.length > 0)
          for (const action of step.actions) {
            await prisma.stepAction.create({
              data: {
                stepId: createdStep.id,
                name: action.name,
                actionType: parseActionType(action.actionType),
                actionData: action.actionData,
              },
            });
          }

        console.log(`✅ Created step: ${step.name} for role ${roleName}`);
      } catch (error) {
        console.error(
          `❌ Error creating step ${step.name} for role ${roleName}:`,
          error,
        );
        throw error;
      }
    }
  }
}

async function seedRoleTransitions() {
  console.log('🔄 Seeding role transitions...');

  for (const roleName of ROLES) {
    const transitionsPath = path.join(
      JSON_BASE_PATH,
      roleName,
      'role-transitions.json',
    );
    const transitionsData = await loadJsonFile<{
      roleTransitions: RoleTransition[];
    }>(transitionsPath);

    for (const transition of transitionsData.roleTransitions) {
      try {
        const fromRole = await prisma.workflowRole.findUnique({
          where: { name: transition.fromRoleId },
        });

        const toRole = await prisma.workflowRole.findUnique({
          where: { name: transition.toRoleId },
        });

        if (!fromRole || !toRole) {
          console.warn(
            `⚠️  Skipping transition ${transition.transitionName}: Role not found`,
          );
          continue;
        }

        const createdTransition = await prisma.roleTransition.create({
          data: {
            fromRoleId: fromRole.id,
            toRoleId: toRole.id,
            transitionName: transition.transitionName,
            conditions: transition.conditions,
            requirements: transition.requirements,
            validationRules: transition.validationRules,
            handoffGuidance: transition.handoffGuidance,
            contextPreservation: transition.contextPreservation,
            isActive: transition.isActive,
          },
        });

        console.log(`✅ Created transition: ${transition.transitionName}`);
      } catch (error) {
        console.error(
          `❌ Error creating transition ${transition.transitionName}:`,
          error,
        );
        throw error;
      }
    }
  }
}

async function validateSeeding() {
  console.log('🔍 Validating seeded data...');

  const roleCount = await prisma.workflowRole.count();
  const stepCount = await prisma.workflowStep.count();
  const transitionCount = await prisma.roleTransition.count();
  const conditionCount = await prisma.stepCondition.count();
  const actionCount = await prisma.stepAction.count();

  console.log(`📊 Seeding Summary:`);
  console.log(`   - Workflow Roles: ${roleCount}`);
  console.log(`   - Workflow Steps: ${stepCount}`);
  console.log(`   - Role Transitions: ${transitionCount}`);
  console.log(`   - Step Conditions: ${conditionCount}`);
  console.log(`   - Step Actions: ${actionCount}`);

  // Validate each role has all required data
  for (const roleName of ROLES) {
    const role = await prisma.workflowRole.findUnique({
      where: { name: roleName },
      include: {
        steps: true,
        fromTransitions: true,
        toTransitions: true,
      },
    });

    if (!role) {
      throw new Error(`Role ${roleName} not found after seeding`);
    }

    console.log(
      `✅ Role ${roleName}: ${role.steps.length} steps, ${role.fromTransitions.length + role.toTransitions.length} transitions`,
    );
  }
}

async function main() {
  try {
    console.log('🚀 Starting database reset and workflow rules seeding...\n');

    // Step 1: Reset database
    await resetDatabase();
    console.log('');

    // Step 2: Seed workflow roles
    await seedWorkflowRoles();
    console.log('');

    // Step 3: Seed workflow steps
    await seedWorkflowSteps();
    console.log('');

    // Step 4: Seed role transitions
    await seedRoleTransitions();
    console.log('');

    // Step 6: Validate seeding
    await validateSeeding();
    console.log('');

    console.log(
      '🎉 Database reset and workflow rules seeding completed successfully!',
    );
  } catch (error) {
    console.error('💥 Error during database reset and seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
