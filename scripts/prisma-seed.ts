#!/usr/bin/env node

/**
 * Prisma Seed Script for Anubis - Updated for Streamlined Schema
 *
 * This script seeds the database with essential workflow rules, roles, steps, and transitions.
 * It's designed to work with the new streamlined schema structure.
 *
 * Usage:
 * - Development: npm run db:seed
 * - Production: npx prisma db seed
 * - Docker: Automatically run during build/startup
 */

import { PrismaClient, StepType } from '../generated/prisma';
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
}

interface WorkflowStep {
  name: string;
  description: string;
  sequenceNumber: number;
  isRequired: boolean;
  stepType: string;
  approach: string;
  approachGuidance: {
    stepByStep: string[];
  };
  qualityChecklist: string[];
  conditions: Array<{
    name: string;
    conditionType: string;
    logic: any;
    isRequired: boolean;
  }>;
  actions: Array<{
    name: string;
    actionType: string;
    actionData: {
      serviceName: string;
      operation: string;
      requiredParameters?: string[];
    };
    sequenceOrder: number;
  }>;
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

function parseStepType(stepType: string): StepType {
  switch (stepType.toUpperCase()) {
    case 'ACTION':
      return StepType.ACTION;
    case 'ANALYSIS':
      return StepType.ANALYSIS;
    case 'DECISION':
      return StepType.ACTION; // Map DECISION to ACTION for streamlined schema
    case 'DELEGATION':
      return StepType.ACTION; // Map DELEGATION to ACTION for streamlined schema
    default:
      return StepType.ACTION;
  }
}

async function checkIfSeeded(): Promise<boolean> {
  try {
    const roleCount = await prisma.workflowRole.count();
    const stepCount = await prisma.workflowStep.count();

    // Even if we have roles and steps, we should still run seed for production
    // to ensure the latest workflow rules are applied
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Production mode: Running seed to ensure latest workflow rules...');
      return false; // Always run seed in production
    }

    // In development, only skip if already seeded
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

    // Delete structured workflow data
    await prisma.stepDependency.deleteMany();
    await prisma.qualityCheck.deleteMany();
    await prisma.stepGuidance.deleteMany();

    await prisma.workflowStep.deleteMany();
    await prisma.roleTransition.deleteMany();
    await prisma.workflowRole.deleteMany();

    console.log('✅ Database reset completed');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  }
}

async function resetSystemDataOnly(): Promise<{
  roleMappings: Map<string, string>;
  stepMappings: Map<string, string>;
  activeExecutions: any[];
} | null> {
  console.log('🔄 Resetting system data only (preserving user data)...');

  try {
    // CRITICAL: Check for active user executions before proceeding
    const activeExecutions = await prisma.workflowExecution.findMany({
      where: {
        completedAt: null, // Active executions
      },
      include: {
        currentRole: true,
        currentStep: true,
      },
    });

    if (activeExecutions.length > 0) {
      console.log(`⚠️  Found ${activeExecutions.length} active executions. Updating carefully...`);
      
      // Store current role/step mappings to preserve relationships
      const roleMappings = new Map<string, string>(); // old roleId -> role name
      const stepMappings = new Map<string, string>(); // old stepId -> step name
      
      for (const execution of activeExecutions) {
        if (execution.currentRole) {
          roleMappings.set(execution.currentRoleId, execution.currentRole.name);
        }
        if (execution.currentStep) {
          stepMappings.set(execution.currentStepId!, execution.currentStep.name);
        }
      }

      console.log(`📝 Stored ${roleMappings.size} role mappings and ${stepMappings.size} step mappings`);

      // Delete workflow system data (preserving mapping info)
      await prisma.stepDependency.deleteMany();
      await prisma.qualityCheck.deleteMany();
      await prisma.stepGuidance.deleteMany();
      await prisma.workflowStep.deleteMany();
      await prisma.roleTransition.deleteMany();
      await prisma.workflowRole.deleteMany();

      console.log('✅ System data reset completed with active execution protection');
      
      // Return mappings for relationship restoration
      return { roleMappings, stepMappings, activeExecutions };
    } else {
      // No active executions - safe to do simple reset
      await prisma.stepDependency.deleteMany();
      await prisma.qualityCheck.deleteMany();
      await prisma.stepGuidance.deleteMany();
      await prisma.workflowStep.deleteMany();
      await prisma.roleTransition.deleteMany();
      await prisma.workflowRole.deleteMany();

      console.log('✅ System data reset completed (no active executions)');
      return null;
    }
  } catch (error) {
    console.error('❌ Error resetting system data:', error);
    throw error;
  }
}

async function restoreActiveExecutionRelationships(
  roleMappings: Map<string, string>,
  stepMappings: Map<string, string>,
  activeExecutions: any[]
) {
  console.log('🔗 Restoring active execution relationships...');

  try {
    for (const execution of activeExecutions) {
      const updates: any = {};
      
      // Restore role relationship
      if (execution.currentRoleId && roleMappings.has(execution.currentRoleId)) {
        const roleName = roleMappings.get(execution.currentRoleId)!;
        const newRole = await prisma.workflowRole.findUnique({
          where: { name: roleName },
        });
        
        if (newRole) {
          updates.currentRoleId = newRole.id;
          console.log(`  ✅ Updated role for execution ${execution.id}: ${roleName}`);
        }
      }
      
      // Restore step relationship
      if (execution.currentStepId && stepMappings.has(execution.currentStepId)) {
        const stepName = stepMappings.get(execution.currentStepId)!;
        const newStep = await prisma.workflowStep.findFirst({
          where: { name: stepName },
        });
        
        if (newStep) {
          updates.currentStepId = newStep.id;
          console.log(`  ✅ Updated step for execution ${execution.id}: ${stepName}`);
        }
      }
      
      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: updates,
        });
      }
    }
    
    console.log('✅ Active execution relationships restored');
  } catch (error) {
    console.error('❌ Error restoring execution relationships:', error);
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
      // Use upsert to handle existing roles
      const upsertedRole = await prisma.workflowRole.upsert({
        where: { name: roleDefinition.name },
        update: {
          description: roleDefinition.description,
          priority: roleDefinition.priority,
          isActive: roleDefinition.isActive,
          capabilities: roleDefinition.capabilities,
          coreResponsibilities: roleDefinition.coreResponsibilities,
          keyCapabilities: roleDefinition.keyCapabilities,
        },
        create: {
          name: roleDefinition.name,
          description: roleDefinition.description,
          priority: roleDefinition.priority,
          isActive: roleDefinition.isActive,
          capabilities: roleDefinition.capabilities,
          coreResponsibilities: roleDefinition.coreResponsibilities,
          keyCapabilities: roleDefinition.keyCapabilities,
        },
      });

      console.log(
        `✅ Upserted role: ${upsertedRole.name} (ID: ${upsertedRole.id})`,
      );
    } catch (error) {
      console.error(`❌ Error upserting role ${roleName}:`, error);
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
        // Create the main workflow step
        const createdStep = await prisma.workflowStep.create({
          data: {
            roleId: role.id,
            name: step.name,
            description: step.description,
            sequenceNumber: step.sequenceNumber,
            isRequired: step.isRequired,
            stepType: parseStepType(step.stepType),
            approach: step.approach || 'Execute step according to guidance',
          },
        });

        // Create step guidance
        if (
          step.approachGuidance?.stepByStep &&
          step.approachGuidance.stepByStep.length > 0
        ) {
          await prisma.stepGuidance.create({
            data: {
              stepId: createdStep.id,
              stepByStep: step.approachGuidance.stepByStep,
            },
          });
        }

        // Create quality checks
        if (step.qualityChecklist && step.qualityChecklist.length > 0) {
          for (let i = 0; i < step.qualityChecklist.length; i++) {
            await prisma.qualityCheck.create({
              data: {
                stepId: createdStep.id,
                criterion: step.qualityChecklist[i],
                sequenceOrder: i + 1,
              },
            });
          }
        }

        // Create step dependencies
        if (step.conditions && step.conditions.length > 0) {
          for (const condition of step.conditions) {
            if (condition.conditionType === 'PREVIOUS_STEP_COMPLETED') {
              const dependsOnStep =
                condition.logic?.parameters?.stepName || 'previous_step';
              await prisma.stepDependency.create({
                data: {
                  stepId: createdStep.id,
                  dependsOnStep: dependsOnStep,
                  isRequired: condition.isRequired || true,
                },
              });
            }
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

        // Create the main role transition
        const createdTransition = await prisma.roleTransition.create({
          data: {
            fromRoleId: fromRole.id,
            toRoleId: toRole.id,
            transitionName: transition.transitionName,
            description: 'Role transition',
            handoffMessage: 'Transitioning to next role',
            isActive: transition.isActive,
          },
        });

        // Prepare JSON data for transition fields
        const conditionsArray = transition.conditions
          ? Object.entries(transition.conditions).map(([name, value]) => ({
              name,
              value: Boolean(value),
            }))
          : undefined;

        const requirementsArray = transition.requirements
          ? transition.requirements
          : undefined;

        const contextArray = transition.handoffGuidance?.contextToPreserve
          ? transition.handoffGuidance.contextToPreserve
          : undefined;

        const deliverablesArray = transition.handoffGuidance
          ?.expectedDeliverables
          ? transition.handoffGuidance.expectedDeliverables
          : undefined;

        // Update the transition with JSON data
        await prisma.roleTransition.update({
          where: { id: createdTransition.id },
          data: {
            conditions: conditionsArray || undefined,
            requirements: requirementsArray || undefined,
            contextElements: contextArray || undefined,
            deliverables: deliverablesArray || undefined,
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
  const guidanceCount = await prisma.stepGuidance.count();
  const qualityCheckCount = await prisma.qualityCheck.count();
  const dependencyCount = await prisma.stepDependency.count();

  console.log(`📊 Seeding Summary:`);
  console.log(`   - Workflow Roles: ${roleCount}`);
  console.log(`   - Workflow Steps: ${stepCount}`);
  console.log(`   - Role Transitions: ${transitionCount}`);
  console.log(`   - Step Guidance: ${guidanceCount}`);
  console.log(`   - Quality Checks: ${qualityCheckCount}`);
  console.log(`   - Step Dependencies: ${dependencyCount}`);

  if (roleCount === 0 || stepCount === 0) {
    throw new Error(
      '❌ Seeding validation failed: No roles or steps were created',
    );
  }

  console.log('✅ Seeding validation passed');
}

async function main() {
  try {
    console.log(
      '🚀 Starting Anubis database seeding (Streamlined Schema)...\n',
    );

    // Check if already seeded (for development environments only)
    const isAlreadySeeded = await checkIfSeeded();
    if (isAlreadySeeded) {
      console.log('✅ Database already seeded (development mode), skipping...');
      return;
    }

    // Get the correct JSON base path
    const jsonBasePath = getJsonBasePath();

    // In production, we run a selective reset to preserve user data
    // but update system data (roles, steps, transitions)
    let executionMappings: {
      roleMappings: Map<string, string>;
      stepMappings: Map<string, string>;
      activeExecutions: any[];
    } | null = null;
    
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Production mode: Updating system data while preserving user data...');
      executionMappings = await resetSystemDataOnly();
    } else {
      // Development: Full reset
      await resetDatabase();
    }
    console.log('');

    // Seed workflow roles (with upsert)
    await seedWorkflowRoles(jsonBasePath);
    console.log('');

    // Seed workflow steps
    await seedWorkflowSteps(jsonBasePath);
    console.log('');

    // Seed role transitions
    await seedRoleTransitions(jsonBasePath);
    console.log('');

    // CRITICAL: Restore active execution relationships in production
    if (executionMappings && process.env.NODE_ENV === 'production') {
      await restoreActiveExecutionRelationships(
        executionMappings.roleMappings,
        executionMappings.stepMappings,
        executionMappings.activeExecutions
      );
      console.log('');
    }

    // Validate seeding
    await validateSeeding();
    console.log('');

    console.log('🎉 Anubis database seeding completed successfully!');
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
