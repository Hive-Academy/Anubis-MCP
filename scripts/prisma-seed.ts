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
  'researcher',
  'architect',
  'senior-developer',
  'code-review',
  'integration-engineer',
  'turbo-dev',
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

    // Delete structured workflow data
    await prisma.transitionDeliverable.deleteMany();
    await prisma.transitionContext.deleteMany();
    await prisma.transitionValidation.deleteMany();
    await prisma.transitionRequirement.deleteMany();
    await prisma.transitionCondition.deleteMany();
    await prisma.stepDependency.deleteMany();
    await prisma.mcpAction.deleteMany();
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
          description: roleDefinition.description,
          priority: roleDefinition.priority,
          isActive: roleDefinition.isActive,
          capabilities: roleDefinition.capabilities,
          coreResponsibilities: roleDefinition.coreResponsibilities,
          keyCapabilities: roleDefinition.keyCapabilities,
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

        // Create MCP actions
        if (step.actions && step.actions.length > 0) {
          for (const action of step.actions) {
            if (action.actionType === 'MCP_CALL') {
              await prisma.mcpAction.create({
                data: {
                  stepId: createdStep.id,
                  name: action.name,
                  serviceName: action.actionData.serviceName,
                  operation: action.actionData.operation,
                  parameters: {
                    requiredParameters:
                      action.actionData.requiredParameters || [],
                  },
                  sequenceOrder: action.sequenceOrder || 1,
                },
              });
            }
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

        // Create transition conditions
        if (transition.conditions) {
          for (const [name, value] of Object.entries(transition.conditions)) {
            await prisma.transitionCondition.create({
              data: {
                transitionId: createdTransition.id,
                name: name,
                value: Boolean(value),
              },
            });
          }
        }

        // Create transition requirements
        if (transition.requirements) {
          for (const [requirement] of Object.entries(transition.requirements)) {
            await prisma.transitionRequirement.create({
              data: {
                transitionId: createdTransition.id,
                requirement: requirement,
              },
            });
          }
        }

        // Create validation criteria
        if (transition.validationRules) {
          for (const [criterion] of Object.entries(
            transition.validationRules,
          )) {
            await prisma.transitionValidation.create({
              data: {
                transitionId: createdTransition.id,
                criterion: criterion,
              },
            });
          }
        }

        // Create context elements
        if (transition.contextPreservation) {
          for (const [contextKey] of Object.entries(
            transition.contextPreservation,
          )) {
            await prisma.transitionContext.create({
              data: {
                transitionId: createdTransition.id,
                contextKey: contextKey,
              },
            });
          }
        }

        // Create deliverables
        if (transition.handoffGuidance?.expectedDeliverables) {
          for (const deliverable of transition.handoffGuidance
            .expectedDeliverables) {
            await prisma.transitionDeliverable.create({
              data: {
                transitionId: createdTransition.id,
                deliverable: deliverable,
              },
            });
          }
        }

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
  const mcpActionCount = await prisma.mcpAction.count();
  const dependencyCount = await prisma.stepDependency.count();

  console.log(`📊 Seeding Summary:`);
  console.log(`   - Workflow Roles: ${roleCount}`);
  console.log(`   - Workflow Steps: ${stepCount}`);
  console.log(`   - Role Transitions: ${transitionCount}`);
  console.log(`   - Step Guidance: ${guidanceCount}`);
  console.log(`   - Quality Checks: ${qualityCheckCount}`);
  console.log(`   - MCP Actions: ${mcpActionCount}`);
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
