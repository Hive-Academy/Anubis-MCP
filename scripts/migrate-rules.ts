#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { RuleMigrationService } from '../src/task-workflow/domains/workflow-rules/services/rule-migration.service';
import * as path from 'path';

interface ScriptOptions {
  path?: string;
  version?: string;
  description?: string;
  testGroup?: string;
  testPercentage?: number;
  help?: boolean;
}

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '-p':
      case '--path':
        options.path = args[++i];
        break;
      case '-v':
      case '--version':
        options.version = args[++i];
        break;
      case '-d':
      case '--description':
        options.description = args[++i];
        break;
      case '-t':
      case '--test-group':
        options.testGroup = args[++i];
        break;
      case '--test-percentage':
        const percentage = parseInt(args[++i], 10);
        if (isNaN(percentage) || percentage < 0 || percentage > 100) {
          console.error(
            '❌ Test percentage must be a number between 0 and 100',
          );
          process.exit(1);
        }
        options.testPercentage = percentage;
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
🔄 Rule Migration Script

Migrate markdown rules to database with versioning support.

Usage:
  npm run migrate-rules [options]

Options:
  -p, --path <path>              Path to markdown rules directory
                                 (default: ./enhanced-workflow-rules)
  -v, --version <version>        Version identifier for this migration
                                 (default: v{timestamp})
  -d, --description <desc>       Description of this migration
                                 (default: "Automated rule migration")
  -t, --test-group <group>       Test group name for A/B testing
  --test-percentage <percent>    Percentage of users for A/B testing (0-100)
  -h, --help                     Show this help message

Examples:
  npm run migrate-rules
  npm run migrate-rules --path ./my-rules --version v2.0.0
  npm run migrate-rules --test-group beta --test-percentage 25
  `);
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  try {
    console.log('🚀 Starting rule migration...');

    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    const migrationService = app.get(RuleMigrationService);

    // Set defaults
    const rulesPath =
      options.path || path.join(process.cwd(), 'enhanced-workflow-rules');
    const version = options.version || `v${Date.now()}`;
    const description = options.description || 'Automated rule migration';

    console.log(`📂 Rules path: ${rulesPath}`);
    console.log(`🏷️  Version: ${version}`);
    console.log(`📝 Description: ${description}`);

    if (options.testGroup) {
      console.log(
        `🧪 Test group: ${options.testGroup} (${options.testPercentage || 0}%)`,
      );
    }

    console.log('');

    // Execute migration
    const result = await migrationService.migrateMarkdownRules(rulesPath, {
      version,
      description,
      testGroup: options.testGroup,
      testPercentage: options.testPercentage,
    });

    if (result.success) {
      console.log('✅ Migration completed successfully!');
      console.log(`📊 Migrated ${result.migratedRules} rules`);
      console.log(`🏷️ Version: ${result.version}`);

      if (options.testGroup) {
        console.log(
          `🧪 Test deployment: ${options.testGroup} (${options.testPercentage}%)`,
        );
      }
    } else {
      console.error('❌ Migration failed:');
      console.error(`   ${result.message}`);

      if (result.errors) {
        console.error('   Errors:');
        result.errors.forEach((error) => console.error(`   - ${error}`));
      }

      process.exit(1);
    }

    await app.close();
  } catch (error) {
    console.error('❌ Migration script failed:', error);
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
