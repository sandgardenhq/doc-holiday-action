# Doc Holiday GitHub Action

Automatically generate release notes and documentation updates using [doc.holiday](https://doc.holiday).

## Features

- **Automatic Release Notes**: Automatically generates docs when releases are published
- **Pull Request Documentation**: Automatically generates docs when PRs are merged
- **Manual Mode**: Full control over all doc.holiday API parameters
- **Comprehensive Changeset Support**: All 8 changeset specification types from doc.holiday API
- **Fire-and-Forget**: Non-blocking workflow execution
- **Built-in Retry Logic**: Handles rate limits and network failures

## Quick Start

### 1. Get Your API Token

1. Go to [doc.holiday Settings → API Keys](https://app.doc.holiday/settings/api-keys)
2. Create a new API key
3. Copy the token and store it in your repository's secrets as `DOC_HOLIDAY_TOKEN`

### 2. Add to Your Workflow

**Automatic Release Notes:**

```yaml
name: Generate Release Notes
on:
  release:
    types: [published]

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: sandgardenhq/doc-holiday-action@v1.0.1
        with:
          api-token: ${{ secrets.DOC_HOLIDAY_TOKEN }}
          event-type: release
```

**PR Merge Documentation:**

```yaml
name: Update Docs on Merge
on:
  pull_request:
    types: [closed]
    branches: [main]

jobs:
  docs:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    steps:
      - uses: sandgardenhq/doc-holiday-action@v1.0.1
        with:
          api-token: ${{ secrets.DOC_HOLIDAY_TOKEN }}
          event-type: merge
```

## Usage Modes

### Release

Automatically generates release notes when a GitHub release is published.

```yaml
- uses: sandgardenhq/doc-holiday-action@v1.0.1
  with:
    api-token: ${{ secrets.DOC_HOLIDAY_TOKEN }}
    event-type: release
```

**Auto-detected:**
- Title: `"Release notes for {tag_name}"`
- Body: Release description

Release event payload does not specify an explicit changeset. To target specific commits or releases, use the [Changeset Specification](#changeset-specification) inputs.

### Pull Request Merged

Automatically generates documentation when a PR is merged.

```yaml
- uses: sandgardenhq/doc-holiday-action@v1.0.1
  with:
    api-token: ${{ secrets.DOC_HOLIDAY_TOKEN }}
    event-type: merge
```

**Auto-detected:**
- Title: `"Documentation for PR #{number}: {title}"`
- Body: PR description

PR merge events do not automatically include an explicit changeset. To control which commits are documented, use the [Changeset Specification](#changeset-specification) inputs.

### Manual

Complete control over all doc.holiday parameters.

```yaml
- uses: sandgardenhq/doc-holiday-action@v1.0.1
  with:
    api-token: ${{ secrets.DOC_HOLIDAY_TOKEN }}
    title: "Weekly documentation update"
    body: "Generate guides for recent user-facing changes"
    commits-count: 10
    publications: my-api-docs,user-guide
    labels: weekly,automated
    comments: |
      Focus on breaking changes
      Include migration examples
```

## Inputs

### Required

| Input | Description |
|-------|-------------|
| `api-token` | Doc.holiday API token (store in GitHub secrets) |

### Mode Selection

| Input | Description | Default |
|-------|-------------|---------|
| `event-type` | Event type: `release`, `merge`, or `custom` | `custom` |

### Manual Mode (required when `event-type` is `custom`)

| Input | Description |
|-------|-------------|
| `title` | Job title |
| `body` | Natural language request or commit specification |

### Optional Configuration

| Input | Description |
|-------|-------------|
| `publications` | Comma-separated publication names/IDs |
| `source-connection` | Connection name/ID (defaults to `owner/repo`) |
| `labels` | Comma-separated labels |
| `comments` | Additional instructions (multiline supported) |
| `relevant-links` | Comma-separated URLs for context |

### Changeset Specification

Specify changes explicitly (overrides body if provided). **Only one type can be used at a time.**

#### By Releases

| Input | Description |
|-------|-------------|
| `releases-count` | Number of recent releases |

```yaml
releases-count: 2
```

#### By Time Range

| Input | Description |
|-------|-------------|
| `time-range-start` | ISO 8601 timestamp |
| `time-range-end` | ISO 8601 timestamp |

```yaml
time-range-start: '2025-01-01T00:00:00Z'
time-range-end: '2025-01-31T23:59:59Z'
```

#### By Commit Count

| Input | Description |
|-------|-------------|
| `commits-count` | Number of recent commits |

```yaml
commits-count: 10
```

#### By Commit SHA

| Input | Description |
|-------|-------------|
| `commits-since-sha` | Start from specific commit |

```yaml
commits-since-sha: 'abc123def456'
```

#### Specific Commits

| Input | Description |
|-------|-------------|
| `commits-shas` | Comma-separated SHAs |

```yaml
commits-shas: 'abc123,def456,789ghi'
```

#### Commit Range

| Input | Description |
|-------|-------------|
| `commits-start-sha` | Range start SHA |
| `commits-end-sha` | Range end SHA |
| `commits-include-start` | Include start commit (`true`/`false`) |

```yaml
commits-start-sha: 'abc123'
commits-end-sha: 'def456'
commits-include-start: true
```

#### By Tags

| Input | Description |
|-------|-------------|
| `tags-start` | Start tag |
| `tags-end` | End tag (optional) |

```yaml
tags-start: 'v1.0.0'
tags-end: 'v1.1.0'
```

## Outputs

| Output | Description |
|--------|-------------|
| `job-id` | Doc.holiday job ID |
| `job-state` | Job state (typically `requested`) |
| `job-url` | URL to view job in doc.holiday UI |

### Using Outputs

```yaml
- name: Create Doc Holiday Job
  id: doc-holiday
  uses: your-username/doc-holiday-action@v1
  with:
    api-token: ${{ secrets.DOC_HOLIDAY_TOKEN }}
    title: "Update docs"
    body: "Last 5 commits"
    commits-count: 5

- name: Show Job Info
  run: |
    echo "Job ID: ${{ steps.doc-holiday.outputs.job-id }}"
    echo "Job State: ${{ steps.doc-holiday.outputs.job-state }}"
    echo "View at: ${{ steps.doc-holiday.outputs.job-url }}"
```

## Examples

### Weekly Scheduled Updates

```yaml
name: Weekly Documentation
on:
  schedule:
    - cron: '0 0 * * 0'  # Every Sunday at midnight

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: sandgardenhq/doc-holiday-action@v1.0.1
        with:
          api-token: ${{ secrets.DOC_HOLIDAY_TOKEN }}
          title: "Weekly docs update"
          body: "Document user-facing changes from the past week"
          commits-count: 50
          labels: weekly,automated
```

### Manual Workflow Dispatch

```yaml
name: Generate Documentation
on:
  workflow_dispatch:
    inputs:
      commit_range:
        description: 'Commit range (e.g., abc123..def456)'
        required: true
      publications:
        description: 'Publications (comma-separated)'
        required: false

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: sandgardenhq/doc-holiday-action@v1.0.1
        with:
          api-token: ${{ secrets.DOC_HOLIDAY_TOKEN }}
          title: "Manual documentation request"
          body: "Generate documentation for commits ${{ github.event.inputs.commit_range }}"
          publications: ${{ github.event.inputs.publications }}
```

### Multiple Publications

```yaml
- uses: sandgardenhq/doc-holiday-action@v1.0.1
  with:
    api-token: ${{ secrets.DOC_HOLIDAY_TOKEN }}
    title: "Update all docs"
    body: "Last release"
    releases-count: 1
    publications: api-docs,user-guide,changelog
```

## Troubleshooting

### Authentication Error (401)

**Problem:** `Authentication failed. Please check your api-token.`

**Solution:**
1. Verify token is stored in GitHub secrets
2. Check token hasn't expired in doc.holiday settings
3. Ensure you're passing the secret correctly: `${{ secrets.DOC_HOLIDAY_TOKEN }}`

### Missing Title or Body (Manual Mode)

**Problem:** `title is required when event-type is not set or is "custom"`

**Solution:** In manual mode, both `title` and `body` are required:

```yaml
with:
  api-token: ${{ secrets.DOC_HOLIDAY_TOKEN }}
  title: "Your title here"
  body: "Your description here"
```

### Multiple Changeset Types

**Problem:** `Multiple changeset types specified: releases-count, commits-count. Only one type is allowed.`

**Solution:** Use only ONE changeset specification type at a time:

```yaml
# ✓ Good
commits-count: 10

# ✗ Bad
commits-count: 10
releases-count: 2
```

### Rate Limiting (429)

The action automatically retries with exponential backoff. If you see persistent rate limiting, consider spacing out your workflow runs.

## Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Package

```bash
npm run package
```

### Testing

Test locally by creating a test repository with different workflow configurations.

## Publishing to GitHub Marketplace

1. Ensure repository is public
2. Update `action.yml` with your name/organization
3. Update README with your repository URLs
4. Create a release with semantic version tag (e.g., `v1.0.0`)
5. Publish to marketplace via release page

## License

MIT License - see LICENSE file for details.

## Support

- [doc.holiday Documentation](https://doc.holiday/docs)
- [GitHub Issues](https://github.com/sandgardenhq/doc-holiday-action/issues)
