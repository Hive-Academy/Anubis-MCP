#!/usr/bin/env node

/**
 * Prisma Seed Script for MCP Workflow Manager
 *
 * This script seeds the database with essential workflow rules, roles, steps, and transitions.
 * It's designed to work in both development and production environments, including Docker.
 *
 * Usage:
 * - Development: npm run db:seed
 * - Production: npx prisma db seed
 * - Docker: Automatically run during build/startup
 */

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

const ROLES = [
  'boomerang',
  'researcher',
  'architect',
  'senior-developer',
  'code-review',
  'integration-engineer',
];

// Determine the correct path for JSON files based on environment
function getJsonBasePath(): string {
  const possiblePaths = [
    path.join(process.cwd(), 'enhanced-workflow-rules', 'json'),
    path.join(__dirname, '..', 'enhanced-workflow-rules', 'json'),
    path.join('/app', 'enhanced-workflow-rules', 'json'), // Docker path
  ];

  for (const basePath of possiblePaths) {
    if (fs.existsSync(basePath)) {
      console.log(`📁 Using JSON base path: ${basePath}`);
      return basePath;
    }
  }

  throw new Error(
    `❌ Could not find enhanced-workflow-rules/json directory in any of: ${possiblePaths.join(', ')}`,
  );
}

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

async function checkIfSeeded(): Promise<boolean> {
  try {
    const roleCount = await prisma.workflowRole.count();
    const stepCount = await prisma.workflowStep.count();

    // If we have roles and steps, consider it seeded
    return roleCount > 0 && stepCount > 0;
  } catch (error) {
    console.log('🔍 Database not yet initialized, proceeding with seeding...');
    return false;
  }
}

async function resetDatabase() {
  console.log('🗑️  Resetting database...');

  try {
    // Delete in correct order to handle foreign key constraints
    await prisma.workflowStepProgress.deleteMany();
    await prisma.workflowExecution.deleteMany();
    await prisma.projectBehavioralProfile.deleteMany();
    await prisma.stepAction.deleteMany();
    await prisma.stepCondition.deleteMany();
    await prisma.workflowStep.deleteMany();
    await prisma.roleTransition.deleteMany();
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

async function seedWorkflowRoles(jsonBasePath: string) {
  console.log('👥 Seeding workflow roles...');

  for (const roleName of ROLES) {
    const roleDefPath = path.join(
      jsonBasePath,
      roleName,
      'role-definition.json',
    );

    if (!fs.existsSync(roleDefPath)) {
      console.warn(`⚠️  Role definition file not found: ${roleDefPath}`);
      continue;
    }

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

async function seedWorkflowSteps(jsonBasePath: string) {
  console.log('📋 Seeding workflow steps...');

  for (const roleName of ROLES) {
    const role = await prisma.workflowRole.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      console.warn(`⚠️  Role ${roleName} not found, skipping steps`);
      continue;
    }

    const stepsPath = path.join(jsonBasePath, roleName, 'workflow-steps.json');

    if (!fs.existsSync(stepsPath)) {
      console.warn(`⚠️  Workflow steps file not found: ${stepsPath}`);
      continue;
    }

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
        if (step.conditions && step.conditions.length > 0) {
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
        }

        // Create step actions
        if (step.actions && step.actions.length > 0) {
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

async function seedRoleTransitions(jsonBasePath: string) {
  console.log('🔄 Seeding role transitions...');

  for (const roleName of ROLES) {
    const transitionsPath = path.join(
      jsonBasePath,
      roleName,
      'role-transitions.json',
    );

    if (!fs.existsSync(transitionsPath)) {
      console.warn(`⚠️  Role transitions file not found: ${transitionsPath}`);
      continue;
    }

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

        await prisma.roleTransition.create({
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

  if (roleCount === 0 || stepCount === 0) {
    throw new Error(
      '❌ Seeding validation failed: No roles or steps were created',
    );
  }

  console.log('✅ Seeding validation passed');
}

async function main() {
  try {
    console.log('🚀 Starting MCP Workflow Manager database seeding...\n');

    // Check if already seeded (for production environments)
    const isAlreadySeeded = await checkIfSeeded();
    if (isAlreadySeeded && process.env.NODE_ENV === 'production') {
      console.log('✅ Database already seeded, skipping...');
      return;
    }

    // Get the correct JSON base path
    const jsonBasePath = getJsonBasePath();

    // Reset database (only in development or when explicitly requested)
    if (
      process.env.NODE_ENV !== 'production' ||
      process.env.FORCE_RESET === 'true'
    ) {
      await resetDatabase();
      console.log('');
    }

    // Seed workflow roles
    await seedWorkflowRoles(jsonBasePath);
    console.log('');

    // Seed workflow steps
    await seedWorkflowSteps(jsonBasePath);
    console.log('');

    // Seed role transitions
    await seedRoleTransitions(jsonBasePath);
    console.log('');

    // Validate seeding
    await validateSeeding();
    console.log('');

    console.log(
      '🎉 MCP Workflow Manager database seeding completed successfully!',
    );
  } catch (error) {
    console.error('💥 Error during database seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { main as seed };
