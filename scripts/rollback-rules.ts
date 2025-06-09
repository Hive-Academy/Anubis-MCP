#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { RuleMigrationService } from '../src/task-workflow/domains/workflow-rules/services/rule-migration.service';

interface ScriptOptions {
  version?: string;
  help?: boolean;
}

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '-v':
      case '--version':
        options.version = args[++i];
        break;
      case '-h':
      case '--help':
        options.help = true;
        break;
      default:
        console.error(`❌ Unknown option: ${arg}`);
        process.exit(1);
    }
  }

  return options;
}

function showHelp() {
  console.log(`
🔄 Rule Rollback Script

Rollback to a previous rule version or list available versions.

Usage:
  npm run rollback-rules [options]

Options:
  -v, --version <version>        Version to rollback to
  -h, --help                     Show this help message

Examples:
  npm run rollback-rules                    # List available versions
  npm run rollback-rules --version v1.0.0  # Rollback to specific version
  `);
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  try {
    console.log('🚀 Starting rule rollback...');

    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    const migrationService = app.get(RuleMigrationService);

    if (!options.version) {
      // Show available versions
      console.log('📋 Available rule versions:\n');

      const history = await migrationService.getMigrationHistory();

      if (history.length === 0) {
        console.log('   No rule versions found.');
        console.log('   💡 Run migration script first to create versions.');
      } else {
        history.forEach((version, index) => {
          const status = version.isActive
            ? '🟢 ACTIVE'
            : version.isDefault
              ? '🔵 DEFAULT'
              : '⚪ INACTIVE';

          console.log(`  ${index + 1}. ${version.version} - ${status}`);
          console.log(`     📝 ${version.description}`);
          console.log(`     📅 ${version.createdAt.toISOString()}`);
          console.log(`     👤 Created by: ${version.createdBy}`);

          if (version.testGroup) {
            console.log(
              `     🧪 Test: ${version.testGroup} (${version.testPercentage}%)`,
            );
          }

          console.log('');
        });

        console.log(
          '💡 Use --version <version> to rollback to a specific version',
        );
      }
    } else {
      // Perform rollback
      console.log(`🔄 Rolling back to version: ${options.version}\n`);

      const result = await migrationService.rollbackToVersion(options.version);

      if (result.success) {
        console.log('✅ Rollback completed successfully!');
        console.log(`🏷️ Active version: ${result.version}`);
      } else {
        console.error('❌ Rollback failed:');
        console.error(`   ${result.message}`);
        process.exit(1);
      }
    }

    await app.close();
  } catch (error) {
    console.error('❌ Rollback script failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}
