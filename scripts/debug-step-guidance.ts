import { PrismaService } from '../src/prisma/prisma.service';
import { StepQueryService } from '../src/task-workflow/domains/workflow-rules/services/step-query.service';
import { StepGuidanceService } from '../src/task-workflow/domains/workflow-rules/services/step-guidance.service';
import { RequiredInputExtractorService } from '../src/task-workflow/domains/workflow-rules/services/required-input-extractor.service';
import { SchemaDefinitionGeneratorService } from '../src/task-workflow/domains/workflow-rules/services/schema-definition-generator.service';

async function debugStepGuidance() {
  // Initialize services
  const prisma = new PrismaService();
  const schemaGenerator = new SchemaDefinitionGeneratorService();
  const requiredInputExtractor = new RequiredInputExtractorService(
    schemaGenerator,
  );
  const stepQuery = new StepQueryService(prisma);
  const stepGuidance = new StepGuidanceService(
    stepQuery,
    requiredInputExtractor,
  );

  // Test data
  const context = {
    executionId: 'cmc1g6yfm0001mt6chazjso5x',
    roleId: 'cmc1eh6do0000mtdw4xwcws4u',
    stepId: 'cmc1eh6em0007mtdw54r0yeaz',
  };

  console.log('🔍 DEBUG: Testing step guidance with context:', context);

  try {
    // 1. Test direct database query
    console.log('\n📊 Testing direct step query...');
    const stepData = await stepQuery.getStepWithMcpActions(context.stepId);
    console.log('Step Data:', JSON.stringify(stepData, null, 2));

    // 2. Test step guidance service
    console.log('\n🎯 Testing step guidance service...');
    const guidance = await stepGuidance.getStepGuidance({
      taskId: 1, // Assuming this is required based on interface
      roleId: context.roleId,
      stepId: context.stepId,
    });
    console.log('Guidance Result:', JSON.stringify(guidance, null, 2));

    // 3. Check schema extraction for a known service
    console.log('\n📝 Testing schema extraction...');
    const schemaTest = requiredInputExtractor.extractFromServiceSchema(
      'TaskOperations',
      'create',
    );
    console.log('Schema Test Result:', JSON.stringify(schemaTest, null, 2));
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug script
debugStepGuidance().catch(console.error);
