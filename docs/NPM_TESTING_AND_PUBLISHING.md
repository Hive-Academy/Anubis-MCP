# NPM Testing and Publishing Guide

## 🎉 **PUBLISHED SUCCESSFULLY!**

**Package:** `@hive-academy/mcp-workflow-manager@1.0.0`  
**Registry:** https://registry.npmjs.org/  
**Size:** 358.0 kB (2.0 MB unpacked)  
**Files:** 345 total files

---

## 🚀 Live Testing with Cursor MCP

### 1. Install from NPM Registry

```bash
# Install globally
npm install -g @hive-academy/mcp-workflow-manager

# Or use with npx (recommended)
npx @hive-academy/mcp-workflow-manager
```

### 2. Configure Cursor MCP

**Update your `.cursor/mcp.json`:**

```json
{
  "mcpServers": {
    "workflow-manager": {
      "command": "npx",
      "args": ["-y", "@hive-academy/mcp-workflow-manager"]
    }
  }
}
```

### 3. Test with Cursor

1. **Restart Cursor** completely
2. **Reopen your project**
3. **Wait for MCP initialization** (check status bar)
4. **Test MCP functionality:**

```
Ask Cursor AI: "Can you check if the workflow-manager MCP server is connected and working?"
```

### 4. Verify Installation

```bash
# Check if package is available
npm view @hive-academy/mcp-workflow-manager

# Test CLI directly
npx @hive-academy/mcp-workflow-manager --help
```

---

## 📦 Package Details

**What's Included:**

- ✅ Complete NestJS MCP server
- ✅ 10 domain-based MCP tools
- ✅ Prisma database with SQLite
- ✅ Comprehensive reporting system
- ✅ CLI with automatic setup
- ✅ All compiled TypeScript files
- ✅ Database migrations and schema

**Key Features:**

- **Task Management:** Create, track, and manage development tasks
- **Workflow Operations:** Role-based delegation and transitions
- **Batch Processing:** Organize work into logical batches
- **Reporting:** Generate comprehensive workflow reports
- **Query Optimization:** Efficient data retrieval patterns

---

## 🔧 Advanced Configuration

### Custom Database Path

```bash
# Set custom database location
export DATABASE_URL="file:./custom/path/workflow.db"
npx @hive-academy/mcp-workflow-manager
```

### Skip Playwright Setup

```bash
# Skip browser installation for faster startup
npx @hive-academy/mcp-workflow-manager --skip-playwright
```

### Development Mode

```bash
# Enable detailed logging
export NODE_ENV=development
npx @hive-academy/mcp-workflow-manager
```

---

## 🌐 NPM Registry Links

- **Package Page:** https://www.npmjs.com/package/@hive-academy/mcp-workflow-manager
- **Download Stats:** https://npm-stat.com/charts.html?package=@hive-academy/mcp-workflow-manager
- **Version History:** https://www.npmjs.com/package/@hive-academy/mcp-workflow-manager?activeTab=versions

---

## 🐛 Troubleshooting

### Common Issues

**1. Permission Errors (Windows)**

```bash
# Use npx instead of global install
npx @hive-academy/mcp-workflow-manager
```

**2. Database Initialization**

```bash
# Clear and reinitialize database
rm -rf ./prisma/data/workflow.db
npx @hive-academy/mcp-workflow-manager
```

**3. Playwright Issues**

```bash
# Skip Playwright if not needed
npx @hive-academy/mcp-workflow-manager --skip-playwright
```

**4. MCP Connection Issues**

- Ensure Cursor is completely restarted
- Check `.cursor/mcp.json` syntax
- Verify package installation: `npm list -g @hive-academy/mcp-workflow-manager`

---

## 📈 Next Steps

1. **Test with Real Workflow:** Create actual tasks and test the full workflow
2. **Generate Reports:** Test the reporting functionality
3. **Performance Testing:** Monitor memory and CPU usage
4. **User Feedback:** Gather feedback from team members
5. **Version Updates:** Plan for future feature releases

---

## 🎯 Success Metrics

✅ **Package published successfully to NPM**  
✅ **358KB optimized package size**  
✅ **345 files included with proper structure**  
✅ **Public access configured correctly**  
✅ **CLI executable working**  
✅ **Ready for live Cursor MCP testing**

**Next:** Test the live package with Cursor MCP and gather user feedback!

## 📦 Local Testing

### 1. Test Package Structure

```bash
# Create the package tarball
npm pack

# Verify package contents
tar -tzf hive-academy-mcp-workflow-manager-1.0.0.tgz | head -20
```

**✅ Package includes:**

- All compiled TypeScript files in `dist/`
- Prisma schema and migrations
- CLI executable with proper shebang
- README.md and package.json
- Total size: ~358KB (2.0MB unpacked)

### 2. Test Local Installation

```bash
# Install globally from local tarball
npm install -g ./hive-academy-mcp-workflow-manager-1.0.0.tgz

# Test CLI command
mcp-workflow-manager --help

# Test with npx (simulates real usage)
npx ./hive-academy-mcp-workflow-manager-1.0.0.tgz
```

### 3. Test in Different Project

```bash
# Create test project
mkdir test-mcp-workflow
cd test-mcp-workflow

# Test npx installation
npx @hive-academy/mcp-workflow-manager

# Test with MCP configuration
echo '{
  "mcpServers": {
    "workflow-manager": {
      "command": "npx",
      "args": ["-y", "@hive-academy/mcp-workflow-manager"]
    }
  }
}' > .cursor/mcp.json
```

### 4. Test Database Isolation

```bash
# Test in project A
mkdir project-a && cd project-a
npx @hive-academy/mcp-workflow-manager &
# Should create: project-a-workflow.db

# Test in project B
mkdir ../project-b && cd ../project-b
npx @hive-academy/mcp-workflow-manager &
# Should create: project-b-workflow.db
```

## 🚀 Publishing to NPM

### 1. Pre-Publishing Checklist

**✅ Version Management:**

```bash
# Check current version
npm version

# Update version (choose one)
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0
```

**✅ Quality Checks:**

```bash
# Run tests
npm test

# Check linting
npm run lint

# Build for production
npm run build

# Verify package contents
npm pack --dry-run
```

**✅ Documentation:**

- [ ] README.md updated with latest features
- [ ] CHANGELOG.md updated with version changes
- [ ] Package.json keywords and description current
- [ ] License file present

### 2. NPM Registry Setup

```bash
# Login to npm (first time only)
npm login

# Verify login
npm whoami

# Check package name availability
npm view @hive-academy/mcp-workflow-manager
```

### 3. Publishing Process

**Option A: Standard Publishing**

```bash
# Publish to npm registry
npm publish

# For scoped packages (first time)
npm publish --access public
```

**Option B: Beta/Pre-release**

```bash
# Publish beta version
npm version prerelease --preid=beta
npm publish --tag beta

# Install beta version
npm install @hive-academy/mcp-workflow-manager@beta
```

**Option C: Dry Run (Test Publishing)**

```bash
# Test publish without actually publishing
npm publish --dry-run
```

### 4. Post-Publishing Verification

```bash
# Verify package is available
npm view @hive-academy/mcp-workflow-manager

# Test installation from registry
npm install -g @hive-academy/mcp-workflow-manager

# Test npx usage
npx @hive-academy/mcp-workflow-manager
```

## 🔧 Testing Scenarios

### Scenario 1: Fresh Installation

```bash
# Simulate fresh user experience
mkdir fresh-test && cd fresh-test

# Test npx (should auto-install and run)
npx @hive-academy/mcp-workflow-manager

# Verify database creation
ls -la *.db
```

### Scenario 2: MCP Client Integration

```bash
# Test with Claude Desktop config
echo '{
  "mcpServers": {
    "workflow-manager": {
      "command": "npx",
      "args": ["-y", "@hive-academy/mcp-workflow-manager"]
    }
  }
}' > ~/.config/claude/claude_desktop_config.json

# Test with Cursor IDE config
echo '{
  "mcpServers": {
    "workflow-manager": {
      "command": "npx",
      "args": ["-y", "@hive-academy/mcp-workflow-manager"]
    }
  }
}' > .cursor/mcp.json
```

### Scenario 3: Multi-Project Isolation

```bash
# Project A
mkdir project-a && cd project-a
npx @hive-academy/mcp-workflow-manager &
PID_A=$!

# Project B
mkdir ../project-b && cd ../project-b
npx @hive-academy/mcp-workflow-manager &
PID_B=$!

# Verify separate databases
ls ../project-a/*.db
ls ../project-b/*.db

# Cleanup
kill $PID_A $PID_B
```

### Scenario 4: Report Generation

```bash
# Test report generation functionality
npx @hive-academy/mcp-workflow-manager &

# Create test task and generate report
# (Use MCP client to test workflow operations)

# Verify report files created
ls workflow-reports/
```

## 📊 Package Statistics

**Current Package:**

- **Name:** `@hive-academy/mcp-workflow-manager`
- **Version:** `1.0.0`
- **Size:** 357.9 kB (compressed), 2.0 MB (unpacked)
- **Files:** 345 total files
- **Dependencies:** Production-ready with minimal footprint

**Key Features:**

- ✅ Zero-setup installation via npx
- ✅ Automatic project isolation
- ✅ Cross-platform compatibility
- ✅ Comprehensive reporting system
- ✅ Docker alternative available

## 🎯 Success Criteria

**Local Testing:**

- [ ] Package builds without errors
- [ ] CLI executable works correctly
- [ ] Database isolation functions properly
- [ ] Report generation works
- [ ] MCP integration successful

**Publishing:**

- [ ] Package publishes to npm registry
- [ ] Installation via npm/npx works
- [ ] Documentation is accessible
- [ ] Version management is correct
- [ ] Public access is configured

**User Experience:**

- [ ] Zero-setup installation
- [ ] Clear error messages
- [ ] Automatic dependency handling
- [ ] Cross-platform compatibility
- [ ] Performance is acceptable

## 📝 Next Steps

1. **Complete local testing** using all scenarios above
2. **Update version** if needed (`npm version patch/minor/major`)
3. **Publish to npm** using `npm publish --access public`
4. **Update documentation** with npm installation instructions
5. **Announce release** with changelog and features
6. **Monitor usage** and gather feedback for improvements

## 🔗 Related Resources

- [NPM Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [Package.json Documentation](https://docs.npmjs.com/cli/v8/configuring-npm/package-json)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
