# AWS Setup Guide for Delectable CI/CD

> This guide walks you through setting up AWS credentials for GitHub Actions using OIDC (no long-lived secrets). By the end, your CI/CD pipeline will push Docker images to Amazon ECR.

---

## Why Your Workflow Failed

Your GitHub Action step:

```yaml
- uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-region: us-east-1
    audience: sts.amazonaws.com
```

Failed with: `Credentials could not be loaded, please check your action inputs: Could not load credentials from any providers`

**Root cause:** The step is missing `role-to-assume`. Without it, the action has no way to obtain credentials. You also need to set up the AWS side (OIDC provider + IAM role) before this can work.

---

## What You Need

- An AWS account
- Your GitHub repository (e.g., `your-username/delectable`)
- About 15 minutes

**Cost:** Effectively $0. OIDC, IAM, and STS are free. ECR costs ~$1/month for typical usage.

---

## Step 1: Create the OIDC Identity Provider in AWS

This tells AWS to trust tokens from GitHub Actions.

1. Go to **AWS Console** > search **IAM** > click **IAM**
2. In the left sidebar, click **Identity providers**
3. Click **Add provider**
4. Fill in:
   - **Provider type:** `OpenID Connect`
   - **Provider URL:** `https://token.actions.githubusercontent.com`
   - Click **Get thumbprint**
   - **Audience:** `sts.amazonaws.com`
5. Click **Add provider**

You only need to do this once per AWS account.

---

## Step 2: Create the IAM Role

This role is what GitHub Actions will "assume" to get temporary AWS credentials.

1. In IAM, click **Roles** in the left sidebar
2. Click **Create role**
3. Select **Web identity**
4. Choose:
   - **Identity provider:** `token.actions.githubusercontent.com`
   - **Audience:** `sts.amazonaws.com`
5. Click **Next** (skip permissions for now)
6. Click **Next**
7. **Role name:** `GitHubActions-Delectable-ECR`
8. Click **Create role**

---

## Step 3: Edit the Trust Policy

This restricts the role so only YOUR repository can use it.

1. Click on the role you just created (`GitHubActions-Delectable-ECR`)
2. Click the **Trust relationships** tab
3. Click **Edit trust policy**
4. Replace with this JSON (fill in your values):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_USERNAME/delectable:*"
        }
      }
    }
  ]
}
```

**Replace:**
- `YOUR_ACCOUNT_ID` with your 12-digit AWS account ID (find it in the top-right dropdown)
- `YOUR_GITHUB_USERNAME/delectable` with your actual GitHub org/repo

5. Click **Update policy**

---

## Step 4: Create the ECR Permission Policy

This gives the role permission to push Docker images to ECR.

1. In IAM, click **Policies** > **Create policy**
2. Click the **JSON** tab
3. Paste this:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECRAuth",
      "Effect": "Allow",
      "Action": "ecr:GetAuthorizationToken",
      "Resource": "*"
    },
    {
      "Sid": "ECRPush",
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:DescribeRepositories",
        "ecr:ListImages"
      ],
      "Resource": [
        "arn:aws:ecr:us-east-1:YOUR_ACCOUNT_ID:repository/delectable-frontend",
        "arn:aws:ecr:us-east-1:YOUR_ACCOUNT_ID:repository/delectable-backend"
      ]
    }
  ]
}
```

4. Click **Next**
5. **Policy name:** `ECR-Push-Delectable`
6. Click **Create policy**

---

## Step 5: Attach the Policy to the Role

1. Go to **Roles** > click `GitHubActions-Delectable-ECR`
2. Click **Add permissions** > **Attach policies**
3. Search for `ECR-Push-Delectable`
4. Select it > click **Add permissions**

---

## Step 6: Create ECR Repositories

1. Go to **AWS Console** > search **ECR** > click **Elastic Container Registry**
2. Click **Create repository**
3. Create the frontend repo:
   - **Visibility:** Private
   - **Repository name:** `delectable-frontend`
   - **Scan on push:** Enabled
4. Click **Create repository**
5. Repeat for backend:
   - **Repository name:** `delectable-backend`

---

## Step 7: Add GitHub Repository Variables

Go to your GitHub repo > **Settings** > **Secrets and variables** > **Actions** > **Variables** tab.

Add these **variables** (not secrets -- ARNs are not sensitive):

| Name | Value |
|------|-------|
| `AWS_ACCOUNT_ID` | `123456789012` (your 12-digit ID) |
| `AWS_ROLE_ARN` | `arn:aws:iam::123456789012:role/GitHubActions-Delectable-ECR` |

**You do NOT need `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY`.** That's the whole point of OIDC -- no long-lived secrets.

---

## Step 8: Fix Your GitHub Actions Workflow

Here's the corrected workflow. The key changes are marked with comments:

```yaml
name: Build and Push to ECR

on:
  push:
    branches: [main]

# REQUIRED: id-token:write lets GitHub generate the OIDC token
permissions:
  id-token: write
  contents: read

env:
  AWS_REGION: us-east-1

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # FIXED: Added role-to-assume (this was the missing piece)
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ vars.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push frontend
        env:
          REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          TAG: ${{ github.sha }}
        run: |
          docker build -t $REGISTRY/delectable-frontend:$TAG \
                        -t $REGISTRY/delectable-frontend:latest \
                        -f docker/Dockerfile.frontend .
          docker push $REGISTRY/delectable-frontend --all-tags

      - name: Build and push backend
        env:
          REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          TAG: ${{ github.sha }}
        run: |
          docker build -t $REGISTRY/delectable-backend:$TAG \
                        -t $REGISTRY/delectable-backend:latest \
                        -f docker/Dockerfile.backend .
          docker push $REGISTRY/delectable-backend --all-tags
```

### What Changed vs. Your Failing Config

| Problem | Before | After |
|---------|--------|-------|
| No `role-to-assume` | Missing | `${{ vars.AWS_ROLE_ARN }}` |
| No `permissions` block | Missing | `id-token: write` |
| No ECR login step | Missing | `aws-actions/amazon-ecr-login@v2` |
| `output-env-credentials` | Present | Removed (unnecessary) |
| `audience` | Present | Removed (default is correct) |

---

## Troubleshooting

### "Not authorized to perform sts:AssumeRoleWithWebIdentity"

- **Check the trust policy:** The `sub` condition must match your repo. Use `"StringLike"` with `"repo:your-org/delectable:*"` to match all branches.
- **Check the OIDC provider:** Must have audience `sts.amazonaws.com`.
- **Check `permissions`:** Your workflow must have `id-token: write`.

### "The repository does not exist"

- ECR does NOT auto-create repositories. Create them first (Step 6).
- Check the region matches between your workflow and ECR repositories.

### "no basic auth credentials"

- You're missing the ECR login step. Add `aws-actions/amazon-ecr-login@v2`.

### How to Debug

Add this step temporarily to verify credentials work:

```yaml
      - name: Verify AWS identity
        run: aws sts get-caller-identity
```

This should output your role ARN and account ID.

---

## Verification Checklist

```
AWS:
[ ] OIDC provider created (token.actions.githubusercontent.com)
[ ] IAM role created (GitHubActions-Delectable-ECR)
[ ] Trust policy has correct repo name
[ ] ECR policy created and attached to role
[ ] ECR repos created (delectable-frontend, delectable-backend)

GitHub:
[ ] Variable AWS_ACCOUNT_ID set
[ ] Variable AWS_ROLE_ARN set
[ ] Workflow has permissions: id-token: write
[ ] Workflow has role-to-assume parameter
[ ] Workflow has ECR login step

Test:
[ ] Push to main branch
[ ] Workflow passes
[ ] ECR repos show new images
```

---

## Cost Summary

| Service | Monthly Cost |
|---------|-------------|
| IAM / OIDC / STS | Free |
| ECR Storage (~10 GB) | ~$1.00 |
| ECR Data Transfer (same region) | Free |
| ECR Basic Scanning | Free |
| **Total** | **~$1/month** |

ECR Free Tier: 500 MB/month for the first 12 months.
