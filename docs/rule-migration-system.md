# Rule Migration and Versioning System

The Rule Migration and Versioning System allows you to migrate markdown-based workflow rules to the database with full versioning support, A/B testing capabilities, and rollback functionality.

## Overview

This system transforms static markdown rule files into a dynamic, database-driven workflow guidance system that can:

- **Migrate** markdown rules to structured database format
- **Version** rules with changelog and metadata
- **A/B Test** different rule versions with user percentage targeting
- **Rollback** to previous versions when needed
- **Clean up** old versions automatically

## Components

### 1. RuleMigrationService

Core service that handles:

- Parsing markdown files into structured rule format
- Creating database entries for roles, steps, and conditions
- Managing rule versions and metadata
- Rollback and cleanup operations

### 2. Migration Scripts

Standalone TypeScript scripts for easy CLI usage:

#### `scripts/migrate-rules.ts`

Migrates markdown rules to database with versioning.

#### `scripts/rollback-rules.ts`

Rolls back to previous rule versions or lists available versions.

## Usage

### Basic Migration

```bash
# Migrate rules from default directory (./enhanced-workflow-rules)
npm run migrate-rules

# Migrate with custom path and version
npm run migrate-rules --path ./my-rules --version v2.0.0 --description "Updated workflow rules"
```

### A/B Testing

```bash
# Create a test version for 25% of users
npm run migrate-rules --test-group beta --test-percentage 25 --version v2.1.0-beta
```

### Rollback Operations

```bash
# List available versions
npm run rollback-rules

# Rollback to specific version
npm run rollback-rules --version v1.0.0
```

## Migration Script Options

### migrate-rules

| Option                        | Description                        | Default                      |
| ----------------------------- | ---------------------------------- | ---------------------------- |
| `-p, --path <path>`           | Path to markdown rules directory   | `./enhanced-workflow-rules`  |
| `-v, --version <version>`     | Version identifier                 | `v{timestamp}`               |
| `-d, --description <desc>`    | Migration description              | `"Automated rule migration"` |
| `-t, --test-group <group>`    | Test group name for A/B testing    | -                            |
| `--test-percentage <percent>` | Percentage for A/B testing (0-100) | -                            |
| `-h, --help`                  | Show help message                  | -                            |

### rollback-rules

| Option                    | Description            |
| ------------------------- | ---------------------- |
| `-v, --version <version>` | Version to rollback to |
| `-h, --help`              | Show help message      |

## Markdown Rule Format

The migration system expects markdown files with this structure:

```markdown
# Role Name

## Step 1: Step Title

Step description and instructions.

## Step 2: Another Step

More step content with behavioral context.
```

### File Naming Convention

Rule files should follow this pattern:

- `100-boomerang-role.md`
- `200-researcher-role.md`
- `300-architect-role.md`
- `400-senior-developer-role.md`
- `500-code-review-role.md`
- `600-integration-engineer-role.md`

The number prefix determines the role priority.

## Database Schema

### RuleVersion

Tracks different versions of rule migrations:

- `version`: Version identifier (e.g., "v1.0.0")
- `description`: Human-readable description
- `isActive`: Whether this version is currently active
- `isDefault`: Whether this is the default version
- `testGroup`: A/B testing group name
- `testPercentage`: Percentage of users for A/B testing
- `changeLog`: JSON object with change details

### WorkflowRole

Represents different workflow roles:

- `name`: Role identifier (e.g., "boomerang")
- `displayName`: Human-readable name
- `description`: Role description
- `priority`: Execution priority (100, 200, 300, etc.)

### WorkflowStep

Individual steps within each role:

- `roleId`: Reference to WorkflowRole
- `name`: Step identifier
- `displayName`: Human-readable step name
- `description`: Step instructions
- `sequenceNumber`: Order within the role
- `stepType`: Type of step (VALIDATION, ANALYSIS, ACTION, etc.)
- `behavioralContext`: JSON with behavioral guidelines
- `qualityChecklist`: JSON with quality requirements

## A/B Testing

The system supports A/B testing of rule versions:

1. **Create Test Version**: Use `--test-group` and `--test-percentage` flags
2. **User Assignment**: Users are assigned to test groups based on percentage
3. **Parallel Versions**: Multiple versions can be active simultaneously
4. **Rollback Safety**: Can rollback test versions without affecting main version

Example:

```bash
# Create beta version for 25% of users
npm run migrate-rules --test-group beta --test-percentage 25

# Create canary version for 5% of users
npm run migrate-rules --test-group canary --test-percentage 5
```

## Version Management

### Automatic Cleanup

The system can automatically clean up old versions:

```typescript
// Keep only the last 10 versions
await migrationService.cleanupOldVersions(10);
```

### Version History

View complete migration history:

```typescript
const history = await migrationService.getMigrationHistory();
```

## Error Handling

The migration system includes comprehensive error handling:

- **File System Errors**: Invalid paths, permission issues
- **Parsing Errors**: Malformed markdown, missing sections
- **Database Errors**: Connection issues, constraint violations
- **Validation Errors**: Invalid version formats, percentage ranges

All errors are logged with context and provide actionable error messages.

## Integration with Workflow System

Once migrated, rules are automatically available to:

- **WorkflowGuidanceService**: Provides step-by-step guidance
- **StepExecutionService**: Executes workflow steps
- **RoleTransitionService**: Manages role transitions
- **MCP Operations**: Exposes rules through MCP protocol

## Best Practices

1. **Version Naming**: Use semantic versioning (v1.0.0, v1.1.0, etc.)
2. **Descriptions**: Provide clear, descriptive migration messages
3. **Testing**: Use A/B testing for significant rule changes
4. **Backup**: Keep markdown files as backup/source of truth
5. **Gradual Rollout**: Start with small test percentages
6. **Monitoring**: Monitor system behavior after rule changes
7. **Cleanup**: Regularly clean up old versions to maintain performance

## Troubleshooting

### Common Issues

1. **"Directory not found"**: Check the rules path exists
2. **"Version already exists"**: Use a different version identifier
3. **"No markdown files found"**: Ensure files have `.md` extension
4. **"Database connection failed"**: Check Prisma configuration

### Debug Mode

Enable detailed logging by setting environment variables:

```bash
DEBUG=true npm run migrate-rules
```

## Future Enhancements

- **Rule Validation**: Pre-migration rule validation
- **Diff Viewer**: Compare rule versions
- **Automated Testing**: Test rule changes automatically
- **Performance Metrics**: Track rule execution performance
- **Rule Analytics**: Usage statistics and optimization suggestions
