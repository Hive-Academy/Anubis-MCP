# 📦 NPM Publishing Guide for @hive-academy/anubis

This guide documents the optimized NPM publishing process for the Anubis MCP Server package. Follow these steps to ensure consistent, reliable deployments.

## 🎯 Overview

The Anubis package uses a **pre-built approach** that:

- ✅ **Bundles a pre-seeded database** (`prisma/.anubis/workflow.db`, ~589 kB)
- ✅ **Excludes generated Prisma files** (saves 99.5% space)
- ✅ **Uses runtime Prisma generation** for NPM packages
- ✅ **Copies database to user's project directory** (not NPM cache)

## 📋 Pre-Publishing Checklist

### 1. **Version Management**

```bash
# Check current version
npm view @hive-academy/anubis version

# Update package.json version (required for each publish)
# Edit package.json: "version": "1.1.x"
```

### 2. **Database Template Verification**

```bash
# Ensure pre-seeded database exists
ls -la prisma/.anubis/workflow.db
# Should be ~589.8kB

# If missing, regenerate:
npm run db:reset
npm run db:seed
```

### 3. **Package Size Verification**

```bash
# Check what will be included
npm pack --dry-run

# Verify size (should be ~465kB, NOT 86MB)
npm pack
ls -lh *.tgz
```

## 🚀 Publishing Process

### Step 1: Clean Build

```bash
# Clean build and generate Prisma client
npm run prepublishOnly   # or let npm publish run it automatically

# Verify no generated folder is included
# (package.json excludes "generated/**/*")
```

### Step 2: Version Bump

```bash
# Edit package.json manually or use npm version
npm version patch  # For bug fixes
npm version minor  # For new features
npm version major  # For breaking changes
```

### Step 3: Publish

```bash
# Publish to NPM (auto-runs prepublishOnly)
npm publish

# Verify publication
npm view @hive-academy/anubis version
```

## 📦 Package Architecture

### What Gets Bundled

```
@hive-academy/anubis/
├── dist/                           # Compiled TypeScript
│   ├── cli.js                     # Main entry point
│   └── ...                        # All compiled services
├── enhanced-workflow-rules/       # Workflow definitions
├── prisma/                        # Schema, migrations, seed patches, data
│   ├── data/
│   │   └── workflow.db            # Pre-seeded database (~589 kB)
│   └── scripts/
│       └── prisma-seed.js         # Idempotent runtime seed script
└── package.json
```

### What Gets Excluded

- ❌ `generated/**/*` (Huge Prisma query engines)
- ❌ `node_modules/`
- ❌ `src/` (TypeScript source)
- ❌ `test/`

## ⚙️ Runtime Behavior

When users run `npx @hive-academy/anubis`:

1. **Package Installation**: NPM downloads 465kB package to cache
2. **Prisma Generation**: CLI generates Prisma client at runtime if it doesn't exist
3. **Database Copy**: Pre-seeded DB copied to user's `PROJECT_ROOT/data/` (only on first run)
4. **Runtime Upgrade**:
   1. CLI applies any pending Prisma migrations (`prisma migrate deploy`)
   2. CLI executes the idempotent `prisma-seed.js` script, which UPSERTs core tables so new workflow data appears without touching user-generated records
   3. NestJS app starts

## 🔧 Configuration Files

### package.json Key Settings

```json
{
  "files": [
    "dist/**/*",
    "enhanced-workflow-rules/**/*",
    "prisma/**/*",
    "package.json",
    "README.md"
  ],
  "scripts": {
    "prepublishOnly": "npm run build && npm run db:generate"
  }
}
```

### CLI Entry Point

- **File**: `dist/cli.js`
- **Behavior**: Runtime Prisma generation + database copying
- **No complex initialization** (unlike previous approach)

## 🚨 Troubleshooting

### Issue: Package Too Large (>10MB)

**Cause**: `generated/**/*` included in package
**Solution**: Verify package.json excludes generated folder

### Issue: Database Not Found

**Cause**: Missing `prisma/.anubis/workflow.db`
**Solution**:

```bash
# Regenerate template database
npm run db:reset
npm run db:seed
# Check: should create ~589.8kB file
```

### Issue: Version Already Published

**Cause**: NPM doesn't allow republishing same version
**Solution**: Bump version in package.json

### Issue: Prisma Client Errors

**Cause**: Runtime generation failure
**Solution**: CLI automatically handles this, but check:

```bash
# Ensure Prisma schema is valid
npx prisma validate
```

### Issue: Seed Script Errors

**Cause**: `dist/scripts/prisma-seed.js` not found or throws.

**Solution**:

1. Ensure you ran `npm run build` so the TypeScript seed compiles to JS.
2. Verify the script finishes locally with `node dist/scripts/prisma-seed.js --runtime`.
3. Check that every insert/ update in the seed uses `createMany({ skipDuplicates: true })` or an UPSERT so it is safe to run repeatedly.

## 📊 Performance Metrics

### Package Size Optimization

- **Before**: 86MB (with generated folder)
- **After**: 465kB (99.5% reduction)
- **Download time**: <2 seconds vs 30+ seconds

### User Experience

- **Installation**: `npx @hive-academy/anubis` (instant)
- **First run**: ~30 seconds (Prisma generation)
- **Subsequent runs**: ~5 seconds (pre-built)

## 🔍 Verification Commands

### Post-Publish Verification

```bash
# Test live package installation
npx @hive-academy/anubis@latest --version

# Test MCP functionality
npx @hive-academy/anubis@latest

# Verify database creation in test directory
cd /tmp/test-project
npx @hive-academy/anubis@latest
ls -la .anubis/workflow.db  # Should exist
```

### Package Health Check

```bash
# Check package contents
npm view @hive-academy/anubis

# Check download stats
npm view @hive-academy/anubis --json
```

## 📝 Release Notes Template

When publishing, document changes:

```markdown
## v1.1.x - YYYY-MM-DD

### 🚀 Improvements

- Feature/fix description

### 📦 Package Info

- Size: 465kB (optimized)
- Database: Pre-seeded workflow.db
- Runtime: Prisma generation + database copying

### 🔧 Technical Changes

- Specific technical improvements
```

## 🤝 Contributing

When making changes that affect publishing:

1. **Test locally** with `npm pack`
2. **Verify package size** stays ~465kB
3. **Test runtime behavior** with `npx ./package.tgz`
4. **Update this guide** if process changes

---

## 📞 Support

If publishing fails or package behaves unexpectedly:

1. Check this guide first
2. Verify pre-publish checklist
3. Test with `npm pack --dry-run`
4. Compare with working version metrics

**Remember**: The goal is a fast, reliable NPM package that "just works" for users! 🎯
