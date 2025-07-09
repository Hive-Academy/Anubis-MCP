#!/usr/bin/env pwsh
# create-prebuilt-package.ps1
# Creates a pre-built NPX package with bundled database and no runtime initialization

param(
  [switch]$Verbose,
  [string]$OutputDir = "package-output"
)

Write-Host "Anubis Pre-built Package Creator" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Step 1: Clean previous builds
Write-Host "`nCleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
if (Test-Path "prisma/data") { Remove-Item -Recurse -Force "prisma/data" }
if (Test-Path "*.tgz") { Remove-Item -Force "*.tgz" }

# Step 2: Build the application
Write-Host "`nBuilding application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "Build failed!" -ForegroundColor Red
  exit 1
}

# Step 3: Create template database directory
Write-Host "`nCreating template database..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "prisma/data" | Out-Null

# Step 4: Generate pre-seeded database
Write-Host "Generating pre-seeded database..." -ForegroundColor Yellow
$env:DATABASE_URL = "file:./prisma/.anubis/workflow.db"

# Run migrations
Write-Host "  Running migrations..." -ForegroundColor Gray
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
  Write-Host "Migrations failed!" -ForegroundColor Red
  exit 1
}

# Run seeding
Write-Host "  Seeding database..." -ForegroundColor Gray
npx prisma db seed
if ($LASTEXITCODE -ne 0) {
  Write-Host "Seeding failed!" -ForegroundColor Red
  exit 1
}



$dbSize = (Get-Item "prisma/.anubis/workflow.db").Length
Write-Host "  Database created successfully ($([math]::Round($dbSize/1KB, 2)) KB)" -ForegroundColor Green

# Step 6: Create simplified CLI for pre-built mode
Write-Host "`nCreating simplified CLI..." -ForegroundColor Yellow

# First, ensure dist directory exists and is built
if (-not (Test-Path "dist")) {
  Write-Host "Dist directory not found!" -ForegroundColor Red
  exit 1
}

$simplifiedCli = @"
#!/usr/bin/env node

const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./app.module');
const fs = require('fs');
const path = require('path');

/**
 * PRE-BUILT ANUBIS MCP SERVER
 * No runtime initialization - just copy database and run
 */

async function startPrebuiltServer() {
  console.log('Starting pre-built Anubis MCP Server...');
  
  try {
    // Step 1: Setup project data directory
    const projectRoot = process.env.PROJECT_ROOT || process.cwd();
    const dataDir = path.join(projectRoot, 'data');
    const dbPath = path.join(dataDir, 'workflow.db');
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('Created data directory:', dataDir);
    }
    
    // Step 2: Copy pre-built database if it doesn't exist
    if (!fs.existsSync(dbPath)) {
      const templateDbPath = path.join(__dirname, '..', 'prisma', 'data', 'workflow.db');
      
      if (fs.existsSync(templateDbPath)) {
        fs.copyFileSync(templateDbPath, dbPath);
        console.log('Copied pre-built database to project');
      } else {
        throw new Error('Pre-built database template not found!');
      }
    }
    
    // Step 3: Set environment
    process.env.DATABASE_URL = 'file:' + dbPath;
    
    // Step 4: Start NestJS application
    console.log('Starting MCP server...');
    const app = await NestFactory.createApplicationContext(AppModule);
    
    console.log('Anubis MCP Server is ready!');
    console.log('Server running - ready for MCP tool calls');
    
    // Keep process alive
    process.on('SIGINT', async () => {
      console.log('Shutting down MCP server...');
      await app.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to start MCP server:', error.message);
    process.exit(1);
  }
}

startPrebuiltServer();
"@

$simplifiedCli | Set-Content "dist/cli-prebuilt.js"

# Step 7: Create package
Write-Host "`nCreating package..." -ForegroundColor Yellow
npm pack

# Step 8: Show results
Write-Host "`nPre-built package created successfully!" -ForegroundColor Green

$packageFiles = Get-ChildItem "*.tgz"
if ($packageFiles) {
  $packageFile = $packageFiles[0]
  $packageSize = [math]::Round($packageFile.Length / 1MB, 2)
  Write-Host "Package: $($packageFile.Name) ($packageSize MB)" -ForegroundColor Cyan
    
  Write-Host "`nTo test the package:" -ForegroundColor Yellow
  Write-Host "   npx $($packageFile.Name)" -ForegroundColor Gray
    
  Write-Host "`nPackage includes:" -ForegroundColor Yellow
  Write-Host "   Compiled application (dist/)" -ForegroundColor Green
  Write-Host "   Pre-built Prisma client (generated/)" -ForegroundColor Green
  Write-Host "   Pre-seeded database (prisma/data/)" -ForegroundColor Green
  Write-Host "   Workflow rules (enhanced-workflow-rules/)" -ForegroundColor Green
  Write-Host "   Simplified launcher (no runtime complexity)" -ForegroundColor Green
}

Write-Host "`nReady for deployment!" -ForegroundColor Green 