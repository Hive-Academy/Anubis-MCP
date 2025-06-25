#!/usr/bin/env node

/**
 * 🤖 Intelligent Version Manager
 *
 * Automatically resolves version conflicts and manages package versioning
 * with intelligent conflict resolution and comprehensive validation.
 *
 * Usage:
 *   node scripts/version-manager.js [options]
 *   npm run version:resolve [options]
 *
 * Options:
 *   --type <patch|minor|major>  Version bump type
 *   --force <version>           Force specific version
 *   --dry-run                   Show what would happen without making changes
 *   --check-only                Only check for conflicts, don't resolve
 *   --auto-resolve              Automatically resolve conflicts (default)
 *   --max-attempts <number>     Maximum attempts to find available version (default: 50)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class VersionManager {
  constructor(options = {}) {
    this.packagePath = path.join(process.cwd(), 'package.json');
    this.packageName = '@hive-academy/anubis';
    this.options = {
      dryRun: false,
      checkOnly: false,
      autoResolve: true,
      maxAttempts: 50,
      ...options,
    };

    this.colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
    };
  }

  log(message, color = 'reset') {
    console.log(`${this.colors[color]}${message}${this.colors.reset}`);
  }

  error(message) {
    this.log(`❌ ${message}`, 'red');
  }

  success(message) {
    this.log(`✅ ${message}`, 'green');
  }

  warning(message) {
    this.log(`⚠️  ${message}`, 'yellow');
  }

  info(message) {
    this.log(`ℹ️  ${message}`, 'cyan');
  }

  async execCommand(command, options = {}) {
    try {
      const result = execSync(command, {
        encoding: 'utf8',
        stdio: options.silent ? 'pipe' : 'inherit',
        ...options,
      });
      return result?.toString().trim();
    } catch (error) {
      if (!options.allowFailure) {
        throw error;
      }
      return null;
    }
  }

  async getCurrentVersions() {
    this.info('Getting current version information...');

    // Get local version
    const packageJson = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
    const localVersion = packageJson.version;

    // Get NPM version
    let npmVersion;
    try {
      npmVersion = await this.execCommand(
        `npm view ${this.packageName} version`,
        { silent: true, allowFailure: true },
      );
      if (!npmVersion) {
        npmVersion = '0.0.0';
        this.warning('Package not found on NPM, treating as first publish');
      }
    } catch (error) {
      npmVersion = '0.0.0';
      this.warning('Could not fetch NPM version, treating as first publish');
    }

    this.log(`📦 Local version: ${localVersion}`, 'blue');
    this.log(`📦 NPM version: ${npmVersion}`, 'blue');

    return { localVersion, npmVersion };
  }

  parseVersion(version) {
    const parts = version.split('.').map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0,
      toString: () => `${parts[0]}.${parts[1]}.${parts[2]}`,
    };
  }

  async checkVersionExists(version) {
    try {
      await this.execCommand(
        `npm view ${this.packageName}@${version} version`,
        { silent: true, allowFailure: false },
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  async findNextAvailableVersion(baseVersion) {
    this.info(`🔍 Finding next available version from ${baseVersion}...`);

    const parsed = this.parseVersion(baseVersion);
    let attempts = 0;

    while (attempts < this.options.maxAttempts) {
      const candidateVersion = `${parsed.major}.${parsed.minor}.${parsed.patch + attempts + 1}`;

      this.log(`   Testing: ${candidateVersion}`, 'yellow');

      const exists = await this.checkVersionExists(candidateVersion);
      if (!exists) {
        this.success(`Found available version: ${candidateVersion}`);
        return candidateVersion;
      }

      attempts++;
    }

    throw new Error(
      `Could not find available version after ${this.options.maxAttempts} attempts`,
    );
  }

  async bumpVersion(type) {
    this.info(`🔄 Bumping version (${type})...`);

    if (this.options.dryRun) {
      // Simulate version bump
      const { localVersion } = await this.getCurrentVersions();
      const parsed = this.parseVersion(localVersion);

      switch (type) {
        case 'major':
          return `${parsed.major + 1}.0.0`;
        case 'minor':
          return `${parsed.major}.${parsed.minor + 1}.0`;
        case 'patch':
        default:
          return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
      }
    } else {
      await this.execCommand(`npm version ${type} --no-git-tag-version`);
      const packageJson = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
      return packageJson.version;
    }
  }

  async updatePackageVersion(version) {
    if (this.options.dryRun) {
      this.info(`[DRY RUN] Would update package.json to version: ${version}`);
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
    packageJson.version = version;
    fs.writeFileSync(
      this.packagePath,
      JSON.stringify(packageJson, null, 2) + '\n',
    );
    this.success(`Updated package.json to version: ${version}`);
  }

  async resolveVersionConflict() {
    const { localVersion, npmVersion } = await this.getCurrentVersions();

    let targetVersion = localVersion;
    let strategy = 'use-local';

    // Handle forced version
    if (this.options.forceVersion) {
      targetVersion = this.options.forceVersion;
      strategy = 'forced';
      this.info(`🎯 Using forced version: ${targetVersion}`);
    }
    // Handle version bump
    else if (this.options.bumpType) {
      targetVersion = await this.bumpVersion(this.options.bumpType);
      strategy = 'manual-bump';
      this.info(
        `🔄 Version bumped (${this.options.bumpType}): ${targetVersion}`,
      );
    }

    // Check for conflicts
    this.info('🔍 Checking for version conflicts...');
    const hasConflict = await this.checkVersionExists(targetVersion);

    if (hasConflict) {
      this.warning(
        `Version conflict detected: ${targetVersion} already exists on NPM`,
      );

      if (this.options.checkOnly) {
        throw new Error(`Version conflict: ${targetVersion} already published`);
      }

      if (!this.options.autoResolve) {
        throw new Error(
          `Version conflict detected and auto-resolve is disabled`,
        );
      }

      // Auto-resolve conflict
      this.info('🤖 Auto-resolving version conflict...');
      targetVersion = await this.findNextAvailableVersion(targetVersion);
      strategy = 'auto-resolved';

      await this.updatePackageVersion(targetVersion);
    } else {
      this.success(`No version conflict - proceeding with: ${targetVersion}`);
    }

    return {
      targetVersion,
      strategy,
      conflictResolved: hasConflict,
      originalLocal: localVersion,
      originalNpm: npmVersion,
    };
  }

  async validatePackage() {
    this.info('🔍 Validating package...');

    // Check if package.json exists
    if (!fs.existsSync(this.packagePath)) {
      throw new Error('package.json not found');
    }

    // Validate package.json
    const packageJson = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
    if (packageJson.name !== this.packageName) {
      throw new Error(
        `Package name mismatch: expected ${this.packageName}, got ${packageJson.name}`,
      );
    }

    // Check for required files
    const requiredFiles = ['dist', 'prisma', 'README.md'];
    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(process.cwd(), file))) {
        this.warning(`Required file/directory missing: ${file}`);
      }
    }

    this.success('Package validation passed');
  }

  async generateReport(result) {
    this.log('\n📊 Version Resolution Report', 'bright');
    this.log('================================', 'bright');
    this.log(`Package: ${this.packageName}`, 'blue');
    this.log(`Target Version: ${result.targetVersion}`, 'green');
    this.log(`Strategy: ${result.strategy}`, 'cyan');
    this.log(
      `Conflict Resolved: ${result.conflictResolved ? 'Yes' : 'No'}`,
      result.conflictResolved ? 'yellow' : 'green',
    );

    if (result.conflictResolved) {
      this.log(`Original Local: ${result.originalLocal}`, 'magenta');
      this.log(`Original NPM: ${result.originalNpm}`, 'magenta');
    }

    this.log('\n🔧 Next Steps:', 'bright');
    if (this.options.dryRun) {
      this.log('• Run without --dry-run to apply changes', 'yellow');
    } else {
      this.log('• Build and test the package', 'green');
      this.log('• Commit version changes if needed', 'green');
      this.log('• Publish to NPM', 'green');
    }

    this.log('\n🚀 Publish Commands:', 'bright');
    this.log(`npm publish`, 'cyan');
    this.log(`# or`, 'cyan');
    this.log(`npm run build && npm publish`, 'cyan');
  }

  async run() {
    try {
      this.log('🤖 Intelligent Version Manager', 'bright');
      this.log('==============================', 'bright');

      if (this.options.dryRun) {
        this.warning('DRY RUN MODE - No changes will be made');
      }

      await this.validatePackage();
      const result = await this.resolveVersionConflict();
      await this.generateReport(result);

      return result;
    } catch (error) {
      this.error(`Version management failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--type':
        options.bumpType = args[++i];
        break;
      case '--force':
        options.forceVersion = args[++i];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--check-only':
        options.checkOnly = true;
        break;
      case '--no-auto-resolve':
        options.autoResolve = false;
        break;
      case '--max-attempts':
        options.maxAttempts = parseInt(args[++i]);
        break;
      case '--help':
        console.log(`
🤖 Intelligent Version Manager

Usage:
  node scripts/version-manager.js [options]

Options:
  --type <patch|minor|major>  Version bump type
  --force <version>           Force specific version
  --dry-run                   Show what would happen without making changes
  --check-only                Only check for conflicts, don't resolve
  --no-auto-resolve           Don't automatically resolve conflicts
  --max-attempts <number>     Maximum attempts to find available version (default: 50)
  --help                      Show this help message

Examples:
  # Check for conflicts only
  node scripts/version-manager.js --check-only
  
  # Bump patch version and auto-resolve conflicts
  node scripts/version-manager.js --type patch
  
  # Force specific version
  node scripts/version-manager.js --force 1.2.5
  
  # Dry run to see what would happen
  node scripts/version-manager.js --type minor --dry-run
        `);
        process.exit(0);
      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  const manager = new VersionManager(options);
  manager.run();
}

module.exports = VersionManager;
