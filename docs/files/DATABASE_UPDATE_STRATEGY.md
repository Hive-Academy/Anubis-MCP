# 🔄 Database Update Strategy for Anubis MCP

This document explains how Anubis handles database updates when publishing new versions to NPM, ensuring users always get the latest workflow rules and schema changes.

## 🎯 Problem Solved

**Previous Issue**: Users who installed Anubis and then updated to a new version would keep their old database, missing:
- ✅ New workflow rules and steps
- ✅ Updated role definitions
- ✅ Schema improvements
- ✅ Bug fixes in workflow logic

**Solution**: **Smart Version-Aware Database Updates**

## 🏗️ Architecture Overview

### 1. **Version Tracking**
- Each package installation creates a `.anubis-version` file in the user's project
- Contains the current package version number
- Used to detect when updates are needed

### 2. **Smart Database Setup**
```typescript
// In cli.ts
function setupSmartDatabase(dbConfig: any): void {
  const currentVersion = packageJson.version;
  const previousVersion = fs.readFileSync(versionFile, 'utf-8').trim();
  
  const needsUpdate = previousVersion !== currentVersion;
  
  if (needsUpdate) {
    // Always copy the latest template database
    fs.copyFileSync(templateDbPath, dbConfig.databasePath);
    
    // Update version file
    fs.writeFileSync(versionFile, currentVersion);
  }
}
```

### 3. **Database Update Process**
Every time a user runs `npx @hive-academy/anubis`:

1. **Version Check**: Compare package version with stored version
2. **Smart Update**: If versions differ, copy latest pre-built database
3. **Migrations**: Run Prisma migrations to ensure schema is up-to-date
4. **Seeding**: Run idempotent seed script to update workflow rules

## 🔄 Update Flow

### First Installation
```bash
npx @hive-academy/anubis
```

1. ✅ **Setup**: Copy pre-built database to `{project}/.anubis/workflow.db`
2. ✅ **Version**: Create `.anubis-version` file with current version
3. ✅ **Migrate**: Run `prisma migrate deploy`
4. ✅ **Seed**: Run seed script to ensure data consistency
5. ✅ **Start**: Launch MCP server

### Version Update
```bash
# User updates package
npm install @hive-academy/anubis@latest

# User runs updated version
npx @hive-academy/anubis
```

1. ✅ **Detect**: Version difference detected
2. ✅ **Update**: Copy latest pre-built database (overwrites old one)
3. ✅ **Version**: Update `.anubis-version` file
4. ✅ **Migrate**: Run migrations for schema changes
5. ✅ **Seed**: Run seed script to update workflow rules
6. ✅ **Start**: Launch MCP server with latest rules

## 🛡️ Data Preservation Strategy

### User Data vs System Data

**System Data (Always Updated)**:
- Workflow roles and definitions
- Workflow steps and guidance
- Role transitions and rules
- Quality checklists and validation

**User Data (Preserved)**:
- User tasks and projects
- Execution history and progress
- User-specific configurations
- Custom workflow adaptations

### Production-Safe Seeding

The seed script uses different strategies for development vs production:

```typescript
// Development: Full reset (clean slate)
if (process.env.NODE_ENV !== 'production') {
  await resetDatabase();
}

// Production: Selective reset (preserve user data)
if (process.env.NODE_ENV === 'production') {
  await resetSystemDataOnly(); // Only deletes workflow system tables
}
```

### Idempotent Operations

All database operations are idempotent:
- **Upsert**: `prisma.workflowRole.upsert()` instead of `create()`
- **Skip Duplicates**: `createMany({ skipDuplicates: true })`
- **Conditional Updates**: Only update when necessary

## 📦 Build Process Integration

### Package Build
```bash
npm run build:prod
```

1. **Compile**: TypeScript → JavaScript
2. **Seed Build**: Compile seed script to `dist/scripts/prisma-seed.js`
3. **Database**: Include pre-built database in `prisma/.anubis/workflow.db`
4. **Package**: Create optimized NPM package

### Runtime Execution
```bash
npx @hive-academy/anubis
```

1. **Extract**: NPM downloads and extracts package
2. **Setup**: Smart database setup with version checking
3. **Update**: Copy/update database if version changed
4. **Migrate**: Run schema migrations
5. **Seed**: Run compiled seed script
6. **Start**: Launch MCP server

## 🔧 Technical Implementation

### CLI Entry Point (`cli.ts`)
```typescript
async function bootstrap() {
  const dbConfig = setupDatabaseEnvironment();
  
  // Smart database setup with version tracking
  setupSmartDatabase(dbConfig);
  
  // Always ensure latest schema and data
  runDatabaseMigrations(dbConfig);
  await runDatabaseSeed(dbConfig);
  
  // Start NestJS application
  const app = await NestFactory.createApplicationContext(AppModule);
}
```

### Seed Script (`prisma-seed.ts`)
```typescript
async function main() {
  // Production: Always run to ensure latest workflow rules
  if (process.env.NODE_ENV === 'production') {
    await resetSystemDataOnly(); // Preserve user data
  }
  
  // Update system data with latest definitions
  await seedWorkflowRoles(jsonBasePath);
  await seedWorkflowSteps(jsonBasePath);
  await seedRoleTransitions(jsonBasePath);
}
```

### Database Config (`database-config.ts`)
```typescript
export function setupDatabaseEnvironment(): DatabaseConfig {
  const config = getDatabaseConfig();
  
  // Always ensure project isolation
  config.isProjectIsolated = true;
  
  // Set environment variables for runtime
  process.env.DATABASE_URL = config.databaseUrl;
  
  return config;
}
```

## 🎯 Benefits of This Approach

### For Users
- ✅ **Automatic Updates**: Always get latest workflow rules
- ✅ **Zero Configuration**: No manual database management
- ✅ **Data Safety**: User data is preserved across updates
- ✅ **Version Consistency**: Database schema always matches package

### For Developers
- ✅ **Easy Deployment**: Just publish NPM package
- ✅ **Reliable Updates**: Version-aware update mechanism
- ✅ **Backward Compatible**: Migrations handle schema changes
- ✅ **Fast Iteration**: Can update workflow rules without breaking users

### For System
- ✅ **Package Size**: Still only 465KB (optimized)
- ✅ **Performance**: Fast startup with pre-built database
- ✅ **Reliability**: Idempotent operations prevent corruption
- ✅ **Cross-Platform**: Works on Windows, Linux, macOS

## 📊 Update Scenarios

### Scenario 1: Workflow Rule Update
```
v1.2.14 → v1.2.15
- New step added to senior-developer role
- Updated quality checklist for architect role
```

**Process**:
1. User runs `npx @hive-academy/anubis`
2. Version mismatch detected (`1.2.14` vs `1.2.15`)
3. Copy latest pre-built database
4. Run migrations (no schema changes)
5. Run seed (updates workflow rules)
6. Start with new rules

### Scenario 2: Schema Change
```
v1.2.15 → v1.3.0
- New table added for enhanced features
- Column added to existing table
```

**Process**:
1. User runs `npx @hive-academy/anubis`
2. Version mismatch detected (`1.2.15` vs `1.3.0`)
3. Copy latest pre-built database
4. Run migrations (applies schema changes)
5. Run seed (updates workflow rules)
6. Start with new schema and rules

### Scenario 3: Bug Fix
```
v1.2.15 → v1.2.16
- Fixed role transition validation
- Updated step dependency logic
```

**Process**:
1. User runs `npx @hive-academy/anubis`
2. Version mismatch detected (`1.2.15` vs `1.2.16`)
3. Copy latest pre-built database
4. Run migrations (no schema changes)
5. Run seed (applies bug fixes)
6. Start with corrected logic

## 🔍 Troubleshooting

### Issue: Version File Missing
**Symptom**: Always copies database even when up-to-date
**Solution**: Version file automatically recreated on next run

### Issue: Migration Failures
**Symptom**: Database schema out of sync
**Solution**: Migrations run with error handling, logs warning but continues

### Issue: Seed Script Errors
**Symptom**: Workflow rules not updated
**Solution**: Seed script runs with error handling, logs warning but continues

### Issue: Permission Errors
**Symptom**: Cannot write to project directory
**Solution**: Clear error message with cross-platform solutions

## 📝 Monitoring and Logging

### User Feedback
```
📦 Anubis Database Update:
   - Previous version: 1.2.14
   - Current version: 1.2.15
   - Updating database with latest workflow rules...
   ✅ Database updated successfully
```

### Developer Logging
```
🔄 Running database migrations...
✅ Database migrations completed
🌱 Running database seed...
✅ Database seed completed
```

## 🚀 Future Enhancements

### Planned Features
1. **Incremental Updates**: Only update changed workflow rules
2. **Rollback Support**: Ability to revert to previous version
3. **Custom Rules**: Allow users to extend workflow rules
4. **Update Notifications**: Inform users about new features

### Performance Optimizations
1. **Lazy Loading**: Only load required workflow rules
2. **Caching**: Cache compiled workflow rules
3. **Compression**: Compress pre-built database
4. **Streaming**: Stream large updates

---

## 📞 Support

This update strategy ensures that Anubis users always have the latest workflow intelligence while maintaining data safety and system reliability. The combination of version tracking, smart updates, and idempotent operations provides a robust foundation for continuous improvement.

**Remember**: The goal is seamless updates that "just work" for users! 🎯
