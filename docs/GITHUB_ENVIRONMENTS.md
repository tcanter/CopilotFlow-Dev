# GitHub Environments Setup Guide

This guide explains how to set up GitHub environments and secrets for the CopilotFlow project to
enable full CI/CD functionality.

## Overview

The project uses GitHub Actions workflows that reference:

- **Environments**: `development` and `production`
- **Secrets**: API keys and deployment tokens

Currently, these are commented out in the workflows to prevent validation errors.

## Step 1: Create GitHub Environments

### In your GitHub repository:

1. **Navigate to Settings** → **Environments**
2. **Create `development` environment:**
   - Click "New environment"
   - Name: `development`
   - Add protection rules (optional):
     - Required reviewers
     - Wait timer
     - Deployment branches (restrict to `develop` branch)

3. **Create `production` environment:**
   - Click "New environment"
   - Name: `production`
   - Add protection rules (recommended):
     - Required reviewers
     - Wait timer
     - Deployment branches (restrict to `main` branch)

## Step 2: Configure Repository Secrets

### Navigate to Settings → Secrets and variables → Actions

**Required Secrets:**

```bash
# AI/OpenAI Integration
OPENAI_API_KEY=your_openai_api_key_here
AZURE_OPENAI_API_KEY=your_azure_openai_key_here

# Deployment
DEPLOY_TOKEN=your_deployment_token_here
```

### To add secrets:

1. Click "New repository secret"
2. Enter secret name (e.g., `OPENAI_API_KEY`)
3. Enter secret value
4. Click "Add secret"

## Step 3: Enable Workflows

### After environments and secrets are configured:

1. **Uncomment environment references** in workflow files:

   ```yaml
   # In .github/workflows/ai-development.yml
   environment: development  # Remove the # comment
   environment: production   # Remove the # comment
   ```

2. **Commit and push changes:**
   ```bash
   git add .github/workflows/
   git commit -m "Enable GitHub environments for deployment"
   git push
   ```

## Step 4: Environment-Specific Configuration

### Development Environment

- **Purpose**: Testing and validation
- **Triggers**: Pushes to `develop` branch
- **Protection**: Minimal (optional reviewers)
- **Secrets**: Development API keys, staging endpoints

### Production Environment

- **Purpose**: Live deployment
- **Triggers**: Pushes to `main` branch
- **Protection**: Required reviewers, deployment protection
- **Secrets**: Production API keys, live endpoints

## Step 5: Validation

### Run QA validation to check setup:

```bash
npm run qa:validate
```

This will verify:

- ✅ Workflow syntax
- ⚠️ Environment references (will warn until environments are created)
- ⚠️ Secret references (will warn until secrets are configured)

## Optional: Environment Variables

### You can also set environment-specific variables:

1. **In each environment** (Settings → Environments → [environment-name]):
2. Click "Add variable"
3. Set environment-specific values:
   ```
   API_BASE_URL=https://api.staging.example.com  # for development
   API_BASE_URL=https://api.example.com          # for production
   ```

## Troubleshooting

### Common Issues:

1. **"Environment 'development' not found"**
   - Ensure environment is created in repository settings
   - Check environment name spelling

2. **"Secret 'OPENAI_API_KEY' not found"**
   - Verify secret is added to repository secrets
   - Check secret name spelling (case-sensitive)

3. **Deployment fails with permission errors**
   - Verify `DEPLOY_TOKEN` has correct permissions
   - Check if deployment target is accessible

### Testing Environments:

```bash
# Test with workflow that references environments
git checkout develop
git commit --allow-empty -m "Test development deployment"
git push origin develop

# Test production deployment
git checkout main
git merge develop
git push origin main
```

## Security Best Practices

### Secret Management:

- ✅ Use repository secrets for sensitive data
- ✅ Use environment variables for non-sensitive configuration
- ✅ Rotate secrets regularly
- ✅ Use least-privilege principle for deployment tokens
- ❌ Never commit secrets to code
- ❌ Don't use secrets in pull request workflows

### Environment Protection:

- ✅ Require reviews for production deployments
- ✅ Restrict deployment branches
- ✅ Use environment-specific secrets
- ✅ Monitor deployment logs

## Next Steps

1. **Create environments** following Step 1
2. **Add required secrets** following Step 2
3. **Enable workflows** following Step 3
4. **Test deployments** with test commits
5. **Monitor and iterate** based on deployment results

## Resources

- [GitHub Environments Documentation](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Actions Best Practices](https://docs.github.com/en/actions/learn-github-actions/security-hardening-for-github-actions)
