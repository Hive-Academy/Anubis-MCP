// Codebase Analysis Validation Script
// Following architect's strategic guidance for technical accuracy verification

const fs = require('fs');
const path = require('path');

// Load package.json for dependency verification
const packageJson = require('./package.json');

// Expected dependencies from codebase analysis
const expectedDeps = [
  '@nestjs/common',
  '@prisma/client',
  '@rekog/mcp-nest',
  '@modelcontextprotocol/sdk',
  'fastmcp',
  'express',
  'uuid',
  'zod',
];

// Expected dev dependencies
const expectedDevDeps = [
  '@nestjs/cli',
  '@nestjs/testing',
  'prisma',
  'typescript',
  'jest',
  'eslint',
  'prettier',
];

// Validation results
const validationResults = {
  dependencies: {},
  devDependencies: {},
  versions: {},
  architecture: {},
  configuration: {},
  discrepancies: [],
};

console.log('🔍 Starting Codebase Analysis Validation...\n');

// 1. Verify package.json dependencies
console.log('📦 Verifying Dependencies:');
expectedDeps.forEach((dep) => {
  if (packageJson.dependencies[dep]) {
    validationResults.dependencies[dep] = {
      status: 'verified',
      version: packageJson.dependencies[dep],
    };
    console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
  } else {
    validationResults.dependencies[dep] = {
      status: 'missing',
      version: null,
    };
    validationResults.discrepancies.push(`Missing dependency: ${dep}`);
    console.log(`❌ Missing dependency: ${dep}`);
  }
});

// 2. Verify dev dependencies
console.log('\n🛠️ Verifying Dev Dependencies:');
expectedDevDeps.forEach((dep) => {
  if (packageJson.devDependencies[dep]) {
    validationResults.devDependencies[dep] = {
      status: 'verified',
      version: packageJson.devDependencies[dep],
    };
    console.log(`✅ ${dep}: ${packageJson.devDependencies[dep]}`);
  } else {
    validationResults.devDependencies[dep] = {
      status: 'missing',
      version: null,
    };
    validationResults.discrepancies.push(`Missing dev dependency: ${dep}`);
    console.log(`❌ Missing dev dependency: ${dep}`);
  }
});

// 3. Verify specific version claims from codebase analysis
console.log('\n🔢 Verifying Version Claims:');
const versionClaims = {
  '@nestjs/common': '^11.0.1',
  '@prisma/client': '^6.9.0',
  '@rekog/mcp-nest': '^1.5.2',
  zod: '^3.24.4',
};

Object.entries(versionClaims).forEach(([dep, expectedVersion]) => {
  const actualVersion = packageJson.dependencies[dep];
  if (actualVersion === expectedVersion) {
    validationResults.versions[dep] = {
      status: 'exact_match',
      expected: expectedVersion,
      actual: actualVersion,
    };
    console.log(`✅ ${dep}: ${actualVersion} (exact match)`);
  } else if (actualVersion) {
    validationResults.versions[dep] = {
      status: 'version_mismatch',
      expected: expectedVersion,
      actual: actualVersion,
    };
    validationResults.discrepancies.push(
      `Version mismatch for ${dep}: expected ${expectedVersion}, got ${actualVersion}`,
    );
    console.log(`⚠️ ${dep}: expected ${expectedVersion}, got ${actualVersion}`);
  }
});

// 4. Verify TypeScript configuration
console.log('\n⚙️ Verifying TypeScript Configuration:');
try {
  const tsConfig = JSON.parse(fs.readFileSync('./tsconfig.json', 'utf8'));

  const expectedTsConfig = {
    strictNullChecks: true,
    noImplicitAny: true,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
    target: 'ES2023',
  };

  Object.entries(expectedTsConfig).forEach(([key, expectedValue]) => {
    const actualValue = tsConfig.compilerOptions[key];
    if (actualValue === expectedValue) {
      validationResults.configuration[key] = {
        status: 'verified',
        expected: expectedValue,
        actual: actualValue,
      };
      console.log(`✅ ${key}: ${actualValue}`);
    } else {
      validationResults.configuration[key] = {
        status: 'mismatch',
        expected: expectedValue,
        actual: actualValue,
      };
      validationResults.discrepancies.push(
        `TypeScript config mismatch for ${key}: expected ${expectedValue}, got ${actualValue}`,
      );
      console.log(`❌ ${key}: expected ${expectedValue}, got ${actualValue}`);
    }
  });
} catch (error) {
  validationResults.discrepancies.push(
    `Failed to read tsconfig.json: ${error.message}`,
  );
  console.log(`❌ Failed to read tsconfig.json: ${error.message}`);
}

// 5. Verify directory structure
console.log('\n📁 Verifying Directory Structure:');
const expectedDirectories = [
  'src/task-workflow/domains/workflow-rules',
  'src/task-workflow/domains/core-workflow',
  'src/task-workflow/domains/reporting',
  'src/prisma',
  'memory-bank',
  'prisma',
];

expectedDirectories.forEach((dir) => {
  if (fs.existsSync(dir)) {
    validationResults.architecture[dir] = {
      status: 'verified',
      exists: true,
    };
    console.log(`✅ ${dir}: exists`);
  } else {
    validationResults.architecture[dir] = {
      status: 'missing',
      exists: false,
    };
    validationResults.discrepancies.push(`Missing directory: ${dir}`);
    console.log(`❌ Missing directory: ${dir}`);
  }
});

// 6. Verify MCP tool implementations
console.log('\n🔧 Verifying MCP Tool Implementations:');
const mcpToolFiles = [
  'src/task-workflow/domains/workflow-rules/mcp-operations/workflow-guidance-mcp.service.ts',
  'src/task-workflow/domains/workflow-rules/mcp-operations/mcp-operation-execution-mcp.service.ts',
  'src/task-workflow/domains/workflow-rules/mcp-operations/step-execution-mcp.service.ts',
];

mcpToolFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    validationResults.architecture[file] = {
      status: 'verified',
      exists: true,
    };
    console.log(`✅ ${file}: exists`);
  } else {
    validationResults.architecture[file] = {
      status: 'missing',
      exists: false,
    };
    validationResults.discrepancies.push(`Missing MCP tool file: ${file}`);
    console.log(`❌ Missing MCP tool file: ${file}`);
  }
});

// 7. Generate summary report
console.log('\n📊 Validation Summary:');
console.log(
  `Total Dependencies Verified: ${Object.keys(validationResults.dependencies).filter((k) => validationResults.dependencies[k].status === 'verified').length}/${expectedDeps.length}`,
);
console.log(
  `Total Dev Dependencies Verified: ${Object.keys(validationResults.devDependencies).filter((k) => validationResults.devDependencies[k].status === 'verified').length}/${expectedDevDeps.length}`,
);
console.log(
  `Total Discrepancies Found: ${validationResults.discrepancies.length}`,
);

if (validationResults.discrepancies.length === 0) {
  console.log(
    '\n🎉 All technical claims verified successfully! No discrepancies found.',
  );
} else {
  console.log('\n⚠️ Discrepancies found:');
  validationResults.discrepancies.forEach((discrepancy, index) => {
    console.log(`${index + 1}. ${discrepancy}`);
  });
}

// Save detailed results to file
fs.writeFileSync(
  'validation-results.json',
  JSON.stringify(validationResults, null, 2),
);
console.log(
  '\n💾 Detailed validation results saved to validation-results.json',
);

console.log('\n✅ Codebase Analysis Validation Complete!');
