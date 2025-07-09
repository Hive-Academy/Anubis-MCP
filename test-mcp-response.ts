import { PrismaClient } from './generated/prisma';
import {
  BaseMcpService,
  optimizeJson,
} from './src/domains/workflow-rules/utils/mcp-response.utils';

/**
 * Test script to debug MCP response formatting issues
 * Tests the buildResponse function with real Prisma data
 */
class TestMcpService extends BaseMcpService {
  public testBuildResponse(data: unknown) {
    return this.buildResponse(data);
  }

  public testBuildErrorResponse(
    message: string,
    details: string,
    code: string,
  ) {
    return this.buildErrorResponse(message, details, code);
  }
}

async function testMcpResponseUtils() {
  const prisma = new PrismaClient();
  const testService = new TestMcpService();

  try {
    console.log('🔍 Testing MCP Response Utils with Prisma Data');
    console.log('='.repeat(60));

    // Test 1: Get active executions from database
    console.log('\n📊 Test 1: Fetching active workflow executions...');
    const activeExecutions = await prisma.workflowExecution.findMany({
      where: {
        completedAt: null,
      },
      include: {
        task: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        currentRole: {
          select: {
            id: true,
            name: true,
          },
        },
        currentStep: {
          select: {
            id: true,
            name: true,
            sequenceNumber: true,
          },
        },
      },
    });

    console.log(`Found ${activeExecutions.length} active executions`);

    if (activeExecutions.length === 0) {
      console.log('⚠️  No active executions found. Creating test data...');

      // Get any execution for testing
      const anyExecution = await prisma.workflowExecution.findFirst({
        include: {
          task: true,
          currentRole: true,
          currentStep: true,
        },
      });

      if (anyExecution) {
        activeExecutions.push(anyExecution);
        console.log('✅ Using existing execution for testing');
      } else {
        console.log('❌ No executions found in database');
        return;
      }
    }

    // Test 2: Test buildResponse with raw data
    console.log(
      '\n🧪 Test 2: Testing buildResponse with raw execution data...',
    );
    const rawResponse = testService.testBuildResponse(activeExecutions);
    console.log('Raw response structure:');
    console.log(JSON.stringify(rawResponse, null, 2));

    // Check if response content is properly formatted
    const isValidMcpResponse =
      rawResponse.content &&
      Array.isArray(rawResponse.content) &&
      rawResponse.content.length > 0 &&
      rawResponse.content[0].type === 'text' &&
      typeof rawResponse.content[0].text === 'string';

    console.log(`\n✅ Valid MCP Response Format: ${isValidMcpResponse}`);

    if (!isValidMcpResponse) {
      console.log('❌ Invalid MCP response format detected!');
      console.log('Expected: { content: [{ type: "text", text: string }] }');
      console.log('Actual:', rawResponse);
    }

    // Test 3: Test optimizeJson directly
    console.log('\n🔧 Test 3: Testing optimizeJson optimization...');
    const optimizationResult = optimizeJson(activeExecutions, {
      removeNulls: true,
      removeEmptyStrings: true,
      removeEmptyArrays: false,
      removeEmptyObjects: false,
      flattenLevel: 2,
      cleanMarkdown: true,
    });

    console.log(`Original size: ${optimizationResult.originalSize} chars`);
    console.log(`Optimized size: ${optimizationResult.optimizedSize} chars`);
    console.log(
      `Savings: ${optimizationResult.savings} chars (${optimizationResult.savingsPercent}%)`,
    );

    // Test 4: Test with null/undefined data
    console.log('\n🔍 Test 4: Testing with null/undefined data...');
    const nullResponse = testService.testBuildResponse(null);
    const undefinedResponse = testService.testBuildResponse(undefined);
    const emptyResponse = testService.testBuildResponse({});

    console.log('Null response:', JSON.stringify(nullResponse, null, 2));
    console.log(
      'Undefined response:',
      JSON.stringify(undefinedResponse, null, 2),
    );
    console.log(
      'Empty object response:',
      JSON.stringify(emptyResponse, null, 2),
    );

    // Test 5: Test error response
    console.log('\n❌ Test 5: Testing error response...');
    const errorResponse = testService.testBuildErrorResponse(
      'Test error message',
      'Detailed error information',
      'TEST_ERROR',
    );
    console.log('Error response:', JSON.stringify(errorResponse, null, 2));

    // Test 6: Simulate the exact workflow_execution_operations call
    console.log('\n🎯 Test 6: Simulating get_active_executions operation...');
    const operationResult = {
      success: true,
      data: activeExecutions,
      message: 'Active executions retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    const operationResponse = testService.testBuildResponse(operationResult);
    console.log('Operation response structure:');
    console.log(JSON.stringify(operationResponse, null, 2));

    // Validate the response text can be parsed back to JSON
    try {
      const parsedBack = JSON.parse(operationResponse.content[0].text);
      console.log('✅ Response text is valid JSON');
      console.log('Parsed data keys:', Object.keys(parsedBack));
    } catch (parseError) {
      console.log('❌ Response text is not valid JSON:', parseError);
    }

    console.log('\n🎉 All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);

    // Test error response formatting
    const errorResponse = testService.testBuildErrorResponse(
      'Test execution failed',
      error instanceof Error ? error.message : String(error),
      'TEST_EXECUTION_ERROR',
    );
    console.log('\nError response for this failure:');
    console.log(JSON.stringify(errorResponse, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testMcpResponseUtils()
    .then(() => {
      console.log('\n✅ Test script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test script failed:', error);
      process.exit(1);
    });
}

export { testMcpResponseUtils };
