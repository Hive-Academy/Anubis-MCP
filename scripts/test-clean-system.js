#!/usr/bin/env node

/**
 * ARCHITECTURAL CONTEXT: Clean system testing for NPX package validation
 * PATTERN FOLLOWED: Comprehensive testing with environment simulation
 * STRATEGIC PURPOSE: Validate self-contained package functionality
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  timeout: 60000, // 60 seconds
  testDir: path.join(__dirname, '..', 'test-clean-system'),
  packagePath: path.join(__dirname, '..'),
  verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
};

/**
 * Log message with timestamp
 */
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : '✅';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

/**
 * Execute command with timeout and error handling
 */
function execWithTimeout(command, options = {}) {
  const defaultOptions = {
    timeout: TEST_CONFIG.timeout,
    stdio: TEST_CONFIG.verbose ? 'inherit' : 'pipe',
    cwd: options.cwd || TEST_CONFIG.testDir,
    env: { ...process.env, ...options.env },
  };

  try {
    const result = execSync(command, { ...defaultOptions, ...options });
    return { success: true, output: result ? result.toString() : '' };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout ? error.stdout.toString() : '',
      stderr: error.stderr ? error.stderr.toString() : '',
    };
  }
}

/**
 * Setup clean test environment
 */
function setupTestEnvironment() {
  log('Setting up clean test environment...');

  // Remove existing test directory
  if (fs.existsSync(TEST_CONFIG.testDir)) {
    fs.rmSync(TEST_CONFIG.testDir, { recursive: true, force: true });
  }

  // Create fresh test directory
  fs.mkdirSync(TEST_CONFIG.testDir, { recursive: true });

  // Create minimal package.json for test environment
  const testPackageJson = {
    name: 'test-clean-system',
    version: '1.0.0',
    private: true,
    description: 'Clean system test environment',
  };

  fs.writeFileSync(
    path.join(TEST_CONFIG.testDir, 'package.json'),
    JSON.stringify(testPackageJson, null, 2),
  );

  log('Clean test environment created');
}

/**
 * Test package installation
 */
function testPackageInstallation() {
  log('Testing package installation...');

  const packageTarball = path.join(TEST_CONFIG.packagePath, 'package.tgz');

  // Create package tarball if it doesn't exist
  if (!fs.existsSync(packageTarball)) {
    log('Creating package tarball...');
    const packResult = execWithTimeout('npm pack', {
      cwd: TEST_CONFIG.packagePath,
    });
    if (!packResult.success) {
      throw new Error(`Failed to create package tarball: ${packResult.error}`);
    }

    // Move tarball to expected location
    const createdTarball = fs
      .readdirSync(TEST_CONFIG.packagePath)
      .find((file) => file.endsWith('.tgz'));
    if (createdTarball) {
      fs.renameSync(
        path.join(TEST_CONFIG.packagePath, createdTarball),
        packageTarball,
      );
    }
  }

  // Install package in test environment
  const installResult = execWithTimeout(`npm install ${packageTarball}`);
  if (!installResult.success) {
    throw new Error(`Package installation failed: ${installResult.error}`);
  }

  log('Package installation successful');
}

/**
 * Test CLI help command
 */
function testCliHelp() {
  log('Testing CLI help command...');

  const helpResult = execWithTimeout(
    'npx @hive-academy/mcp-workflow-manager --help',
    {
      timeout: 30000,
    },
  );

  if (!helpResult.success) {
    throw new Error(`CLI help command failed: ${helpResult.error}`);
  }

  log('CLI help command successful');
  return helpResult.output;
}

/**
 * Test CLI with skip-playwright flag
 */
function testCliSkipPlaywright() {
  log('Testing CLI with --skip-playwright flag...');

  return new Promise((resolve, reject) => {
    const child = spawn(
      'npx',
      ['@hive-academy/mcp-workflow-manager', '--skip-playwright'],
      {
        cwd: TEST_CONFIG.testDir,
        stdio: TEST_CONFIG.verbose ? 'inherit' : 'pipe',
        env: { ...process.env, DATABASE_URL: 'file:./test-workflow.db' },
      },
    );

    let output = '';
    let errorOutput = '';

    if (child.stdout) {
      child.stdout.on('data', (data) => {
        output += data.toString();
        if (TEST_CONFIG.verbose) {
          process.stdout.write(data);
        }
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
        if (TEST_CONFIG.verbose) {
          process.stderr.write(data);
        }
      });
    }

    // Set timeout
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      log('CLI started successfully and was terminated after timeout');
      resolve({ success: true, output, errorOutput });
    }, 15000); // 15 seconds should be enough to start

    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`CLI execution failed: ${error.message}`));
    });

    child.on('exit', (code, signal) => {
      clearTimeout(timeout);
      if (signal === 'SIGTERM') {
        // Expected termination
        resolve({ success: true, output, errorOutput });
      } else if (code === 0) {
        resolve({ success: true, output, errorOutput });
      } else {
        reject(
          new Error(
            `CLI exited with code ${code}. Output: ${output}. Error: ${errorOutput}`,
          ),
        );
      }
    });
  });
}

/**
 * Test dependency detection
 */
function testDependencyDetection() {
  log('Testing dependency detection...');

  // Check if Prisma client was generated
  const prismaClientPath = path.join(
    TEST_CONFIG.testDir,
    'node_modules',
    '.prisma',
    'client',
  );
  const prismaClientExists = fs.existsSync(prismaClientPath);

  log(`Prisma client detection: ${prismaClientExists ? 'FOUND' : 'NOT FOUND'}`);

  // Check if database was created
  const dbPath = path.join(TEST_CONFIG.testDir, 'test-workflow.db');
  const dbExists = fs.existsSync(dbPath);

  log(`Database creation: ${dbExists ? 'CREATED' : 'NOT CREATED'}`);

  return {
    prismaClientExists,
    databaseExists: dbExists,
  };
}

/**
 * Cleanup test environment
 */
function cleanupTestEnvironment() {
  log('Cleaning up test environment...');

  if (fs.existsSync(TEST_CONFIG.testDir)) {
    fs.rmSync(TEST_CONFIG.testDir, { recursive: true, force: true });
  }

  // Remove package tarball
  const packageTarball = path.join(TEST_CONFIG.packagePath, 'package.tgz');
  if (fs.existsSync(packageTarball)) {
    fs.unlinkSync(packageTarball);
  }

  log('Test environment cleaned up');
}

/**
 * Main test execution
 */
async function runCleanSystemTest() {
  const startTime = Date.now();

  try {
    log('🧪 Starting clean system test for NPX package...');

    // Setup
    setupTestEnvironment();

    // Test package installation
    testPackageInstallation();

    // Test CLI help
    const helpOutput = testCliHelp();
    if (TEST_CONFIG.verbose) {
      log('Help output received');
    }

    // Test CLI execution with skip-playwright
    const cliResult = await testCliSkipPlaywright();
    if (!cliResult.success) {
      throw new Error('CLI execution test failed');
    }

    // Test dependency detection
    const dependencyStatus = testDependencyDetection();

    // Validate results
    const testResults = {
      packageInstallation: true,
      cliHelp: true,
      cliExecution: cliResult.success,
      prismaClientGeneration: dependencyStatus.prismaClientExists,
      databaseCreation: dependencyStatus.databaseExists,
    };

    const allTestsPassed = Object.values(testResults).every(
      (result) => result === true,
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    log('🎯 Clean System Test Results:');
    log(
      `   Package Installation: ${testResults.packageInstallation ? '✅ PASS' : '❌ FAIL'}`,
    );
    log(`   CLI Help Command: ${testResults.cliHelp ? '✅ PASS' : '❌ FAIL'}`);
    log(
      `   CLI Execution: ${testResults.cliExecution ? '✅ PASS' : '❌ FAIL'}`,
    );
    log(
      `   Prisma Client Generation: ${testResults.prismaClientGeneration ? '✅ PASS' : '❌ FAIL'}`,
    );
    log(
      `   Database Creation: ${testResults.databaseCreation ? '✅ PASS' : '❌ FAIL'}`,
    );
    log(`   Total Duration: ${duration}s`);

    if (allTestsPassed) {
      log(
        '🎉 All clean system tests PASSED! NPX package is self-contained.',
        'INFO',
      );
      return true;
    } else {
      log('❌ Some clean system tests FAILED. Package needs fixes.', 'ERROR');
      return false;
    }
  } catch (error) {
    log(`Clean system test failed: ${error.message}`, 'ERROR');
    return false;
  } finally {
    // Always cleanup
    cleanupTestEnvironment();
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  runCleanSystemTest()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      log(`Test execution failed: ${error.message}`, 'ERROR');
      process.exit(1);
    });
}

module.exports = { runCleanSystemTest, TEST_CONFIG };
