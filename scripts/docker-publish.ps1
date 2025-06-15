# MCP Workflow Manager Docker Publication Script for Windows
# This script builds and publishes the Docker image with integrated database seeding

param(
    [string]$Version = "latest",
    [string]$DockerHubUsername = "hiveacademy",
    [string]$ImageName = "mcp-workflow-manager",
    [switch]$SkipTests = $false,
    [switch]$Verbose = $false
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
$Green = "`e[32m"
$Red = "`e[31m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = $Reset)
    Write-Host "$Color$Message$Reset"
}

function Test-DockerRunning {
    try {
        docker info | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Test-DockerLogin {
    try {
        docker info | Select-String "Username:" | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Main execution
try {
    Write-ColorOutput "🚀 MCP Workflow Manager Docker Publication Script" $Blue
    Write-ColorOutput "=================================================" $Blue
    
    # Check Docker is running
    Write-ColorOutput "🔍 Checking Docker status..." $Yellow
    if (-not (Test-DockerRunning)) {
        throw "Docker is not running. Please start Docker Desktop and try again."
    }
    Write-ColorOutput "✅ Docker is running" $Green
    
    # Check Docker login
    Write-ColorOutput "🔍 Checking Docker Hub authentication..." $Yellow
    if (-not (Test-DockerLogin)) {
        Write-ColorOutput "⚠️  Not logged into Docker Hub. Attempting login..." $Yellow
        docker login
        if ($LASTEXITCODE -ne 0) {
            throw "Docker login failed"
        }
    }
    Write-ColorOutput "✅ Docker Hub authentication verified" $Green
    
    # Get version from package.json if not specified
    if ($Version -eq "latest") {
        $PackageJson = Get-Content "package.json" | ConvertFrom-Json
        $Version = $PackageJson.version
        Write-ColorOutput "📦 Using version from package.json: $Version" $Blue
    }
    
    # Define image tags
    $FullImageName = "$DockerHubUsername/$ImageName"
    $VersionTag = "${FullImageName}:$Version"
    $LatestTag = "${FullImageName}:latest"
    
    Write-ColorOutput "🏷️  Image tags:" $Blue
    Write-ColorOutput "   - $VersionTag" $Blue
    Write-ColorOutput "   - $LatestTag" $Blue
    
    # Pre-build tests (optional)
    if (-not $SkipTests) {
        Write-ColorOutput "🧪 Running pre-build tests..." $Yellow
        
        # Check if essential files exist
        $RequiredFiles = @(
            "package.json",
            "Dockerfile",
            "src/cli.ts",
            "prisma/schema.prisma",
            "scripts/prisma-seed.ts",
            "enhanced-workflow-rules/json"
        )
        
        foreach ($File in $RequiredFiles) {
            if (-not (Test-Path $File)) {
                throw "Required file/directory not found: $File"
            }
        }
        
        Write-ColorOutput "✅ Pre-build validation passed" $Green
    }
    
    # Clean up any existing build artifacts
    Write-ColorOutput "🧹 Cleaning up build artifacts..." $Yellow
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist"
    }
    
    # Create buildx builder if it doesn't exist
    Write-ColorOutput "🔧 Setting up Docker buildx..." $Yellow
    $BuilderName = "mcp-builder"
    
    # Check if builder exists
    $ExistingBuilder = docker buildx ls | Select-String $BuilderName
    if (-not $ExistingBuilder) {
        docker buildx create --name $BuilderName --use --bootstrap
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to create Docker buildx builder"
        }
    } else {
        docker buildx use $BuilderName
    }
    
    Write-ColorOutput "✅ Docker buildx ready" $Green
    
    # Build and push multi-platform image
    Write-ColorOutput "🏗️  Building and pushing Docker image..." $Yellow
    Write-ColorOutput "   This may take several minutes..." $Blue
    
    $BuildArgs = @(
        "buildx", "build",
        "--platform", "linux/amd64,linux/arm64",
        "--tag", $VersionTag,
        "--tag", $LatestTag,
        "--push",
        "."
    )
    
    if ($Verbose) {
        $BuildArgs += "--progress=plain"
    }
    
    & docker @BuildArgs
    
    if ($LASTEXITCODE -ne 0) {
        throw "Docker build and push failed"
    }
    
    Write-ColorOutput "✅ Docker image built and pushed successfully" $Green
    
    # Verify the published image
    Write-ColorOutput "🔍 Verifying published image..." $Yellow
    
    # Pull the image to verify it's available
    docker pull $LatestTag
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to pull published image for verification"
    }
    
    # Test the image
    Write-ColorOutput "🧪 Testing published image..." $Yellow
    $TestOutput = docker run --rm $LatestTag --help 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "⚠️  Image test failed, but image was published successfully" $Yellow
        Write-ColorOutput "Output: $TestOutput" $Yellow
    } else {
        Write-ColorOutput "✅ Image test passed" $Green
    }
    
    # Success summary
    Write-ColorOutput "" 
    Write-ColorOutput "🎉 PUBLICATION SUCCESSFUL!" $Green
    Write-ColorOutput "=========================" $Green
    Write-ColorOutput "📦 Image: $FullImageName" $Green
    Write-ColorOutput "🏷️  Tags: $Version, latest" $Green
    Write-ColorOutput "🌐 Docker Hub: https://hub.docker.com/r/$DockerHubUsername/$ImageName" $Green
    Write-ColorOutput ""
    Write-ColorOutput "📋 Usage Examples:" $Blue
    Write-ColorOutput "   docker pull $LatestTag" $Blue
    Write-ColorOutput "   docker run --rm -i -v mcp-data:/app/data $LatestTag" $Blue
    Write-ColorOutput ""
    Write-ColorOutput "🔧 Claude Desktop Integration:" $Blue
    Write-ColorOutput '   Add to your Claude Desktop config:' $Blue
    Write-ColorOutput '   {' $Blue
    Write-ColorOutput '     "mcpServers": {' $Blue
    Write-ColorOutput '       "workflow-manager": {' $Blue
    Write-ColorOutput '         "command": "docker",' $Blue
    Write-ColorOutput '         "args": ["run", "--rm", "-i", "-v", "mcp-workflow-data:/app/data", "' + $LatestTag + '"]' $Blue
    Write-ColorOutput '       }' $Blue
    Write-ColorOutput '     }' $Blue
    Write-ColorOutput '   }' $Blue
    
} catch {
    Write-ColorOutput "❌ ERROR: $($_.Exception.Message)" $Red
    Write-ColorOutput "💡 Troubleshooting tips:" $Yellow
    Write-ColorOutput "   1. Ensure Docker Desktop is running" $Yellow
    Write-ColorOutput "   2. Check Docker Hub login: docker login" $Yellow
    Write-ColorOutput "   3. Verify network connectivity" $Yellow
    Write-ColorOutput "   4. Check disk space for Docker builds" $Yellow
    exit 1
} 