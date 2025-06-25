# GitHub Actions Workflows

This repository uses a branch-based publishing system to provide better control over when packages are published.

## Publishing Workflows

### 📦 NPM Publishing

- **Trigger**: Create a PR to the `publish-npm` branch
- **Workflow**: `.github/workflows/npm-publish.yml`
- **What it does**:
  - Builds and validates the NPM package
  - Automatically resolves version conflicts
  - Publishes to NPM registry with provenance
  - Includes pre-seeded database template

### 🐳 Docker Publishing

- **Trigger**: Create a PR to the `publish-docker` branch
- **Workflow**: `.github/workflows/docker-publish.yml`
- **What it does**:
  - Builds multi-platform Docker image (linux/amd64, linux/arm64)
  - Syncs version with NPM package
  - Publishes to Docker Hub
  - Runtime database initialization

## How to Publish

### Option 1: NPM Only

```bash
# Create and switch to publish branch
git checkout -b publish-npm

# Make any final changes if needed
# git add . && git commit -m "Prepare for NPM release"

# Push and create PR
git push origin publish-npm
# Then create PR to publish-npm branch on GitHub
```

### Option 2: Docker Only

```bash
# Create and switch to publish branch
git checkout -b publish-docker

# Make any final changes if needed
# git add . && git commit -m "Prepare for Docker release"

# Push and create PR
git push origin publish-docker
# Then create PR to publish-docker branch on GitHub
```

### Option 3: Both NPM and Docker

```bash
# Publish NPM first
git checkout -b publish-npm
git push origin publish-npm
# Create PR to publish-npm, wait for completion

# Then publish Docker
git checkout main
git pull origin main  # Get any version updates
git checkout -b publish-docker
git push origin publish-docker
# Create PR to publish-docker
```

## Manual Triggers

Both workflows also support manual triggering via GitHub Actions UI:

### NPM Manual Trigger

- Go to Actions → "Build and Publish NPM Package" → "Run workflow"
- Options:
  - **Version bump type**: patch, minor, major
  - **Skip tests**: For emergency releases only
  - **Force version**: Override automatic version resolution

### Docker Manual Trigger

- Go to Actions → "Build and Publish Docker Image" → "Run workflow"
- Options:
  - **Sync with NPM**: Automatically use NPM package version
  - **Force version**: Override automatic version resolution

## Branch Protection

Consider setting up branch protection rules for `publish-npm` and `publish-docker` branches:

1. Require PR reviews
2. Require status checks to pass
3. Restrict who can merge to these branches
4. Delete branch after merge

This ensures publishing is always intentional and reviewed.

## Version Management

The workflows include intelligent version management:

- **Automatic conflict resolution**: If a version already exists on NPM, it auto-increments
- **NPM sync**: Docker builds can automatically sync with the latest NPM version
- **Manual override**: Force specific versions when needed
- **Git integration**: Version bumps are committed back to the repository

## Troubleshooting

### NPM Publication Issues

- Check that `NPM_TOKEN` secret is configured
- Verify package name is available on NPM
- Ensure version is higher than existing versions

### Docker Publication Issues

- Check that `DOCKER_HUB_ACCESS_TOKEN` secret is configured
- Verify Docker Hub repository exists and is accessible
- Check build logs for compilation errors

### Version Conflicts

- The workflows automatically resolve most version conflicts
- For manual resolution, use the "force version" option
- Check package.json and NPM registry for version alignment
