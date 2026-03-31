# Doc Holiday GitHub Action

Automatically generate release notes and documentation updates using [doc.holiday](https://doc.holiday).

Version 2 uses the Work States API with a simplified input model centered on natural-language requests and expanded work-state outputs.

## Features

- **Automatic Documentation**: Generate docs from natural language requests
- **Work States API**: Create documentation work through the v2 Work States API model
- **Comprehensive Changeset Support**: All 8 changeset specification types from doc.holiday API
- **Fire-and-Forget**: Non-blocking workflow execution
- **Built-in Retry Logic**: Handles rate limits and network failures

## Quick Start

Doc Holiday Action v2 sends a natural-language documentation request to the Work States API. The main breaking change from v1 is the move away from the Jobs API, along with fewer required inputs and richer outputs.

### 1. Get Your API Token

1. Go to [doc.holiday Settings → API Keys](https://app.doc.holiday/settings/api-keys)
2. Create a new API key
3. Copy the token and store it in your repository's secrets as `DOC_HOLIDAY_TOKEN`

### 2. Add to Your Workflow

```yaml
name: Generate Documentation
on:
  release:
    types: [published]

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: sandgardenhq/doc-holiday-action@v2
        with:
          api-token: ${{ secrets.DOC_HOLIDAY_TOKEN }}
          body: "Generate release notes for the latest release"
          releases-count: 1
```

## Inputs

### Required

| Input | Description |
|-------|-------------|
| `api-token` | Doc.holiday API token (store in GitHub secrets) |
| `body` | Natural language request to Doc Holiday for what you want written |

### Optional

| Input | Description |
|-------|-------------|
| `publication` | Publication ID or name |
| `stage` | If true, work does not immediately result in an opened PR |
| `labels` | Comma-separated labels |
| `relevant-links` | Comma-separated URLs for additional context |

### Changeset Specification

Specify changes explicitly. **Only one type can be used at a time.**

#### By Releases

| Input | Description |
|-------|-------------|
| `releases-count` | Number of recent releases to include |

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
| `commits-shas` | Comma-separated list of specific commit SHAs |

```yaml
commits-shas: 'abc123,def456,789ghi'
```

#### Commit Range

| Input | Description |
|-------|-------------|
| `commits-start-sha` | Commit range start SHA |
| `commits-end-sha` | Commit range end SHA |
| `commits-include-start` | Include start commit in range (`true`/`false`) |

```yaml
commits-start-sha: 'abc123'
commits-end-sha: 'def456'
commits-include-start: true
```

#### By Tags

| Input | Description |
|-------|-------------|
| `tags-start` | Start tag |
| `tags-end` | End tag |

```yaml
tags-start: 'v1.0.0'
tags-end: 'v1.1.0'
```

## Outputs

| Output | Description |
|--------|-------------|
| `id` | Work state ID |
| `job-id` | Associated job ID |
| `out-id` | Output identifier |
| `org-id` | Organization ID |
| `status` | Work state status (`requested`, `running`, `done`, `errored`) |
| `publication-id` | Publication ID |
| `connection-id` | Connection ID |
| `publication-name` | Publication name |
| `trigger-type` | Trigger type |
| `operation-type` | Operation type |
| `created-at` | Creation timestamp (RFC3339) |
| `updated-at` | Last update timestamp (RFC3339) |
| `branch` | Branch name |
| `title` | Title |
| `summary` | Summary |
| `output-url` | Output URL |
| `staged` | Whether the work state is staged |
| `excluded-files` | JSON array of excluded file paths |
| `entries` | JSON array of work history entries |

### Using Outputs

These outputs come from the created work state. They replace older job-oriented outputs such as job URL and job state.

```yaml
- name: Create Documentation
  id: doc-holiday
  uses: sandgardenhq/doc-holiday-action@v2
  with:
    api-token: ${{ secrets.DOC_HOLIDAY_TOKEN }}
    body: "Document the last 5 commits"
    commits-count: 5

- name: Show Work State Info
  run: |
    echo "Work State ID: ${{ steps.doc-holiday.outputs.id }}"
    echo "Status: ${{ steps.doc-holiday.outputs.status }}"
    echo "Branch: ${{ steps.doc-holiday.outputs.branch }}"
    echo "Output URL: ${{ steps.doc-holiday.outputs.output-url }}"
```

## Examples

### PR Merge Documentation

GitHub event data can still be used in the workflow to build the `body` input explicitly, but v2 does not auto-detect or infer request fields from the event payload.

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
      - uses: sandgardenhq/doc-holiday-action@v2
        with:
          api-token: ${{ secrets.DOC_HOLIDAY_TOKEN }}
          body: "Document changes from PR #${{ github.event.pull_request.number }}: ${{ github.event.pull_request.title }}"
          publication: my-docs
          commits-count: 20
```

### Release-Triggered Documentation

```yaml
name: Release Documentation
on:
  release:
    types: [published]

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: sandgardenhq/doc-holiday-action@v2
        with:
          api-token: ${{ secrets.DOC_HOLIDAY_TOKEN }}
          body: "Generate release notes for the latest release"
          releases-count: 1
          labels: release,automated
```

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
      - uses: sandgardenhq/doc-holiday-action@v2
        with:
          api-token: ${{ secrets.DOC_HOLIDAY_TOKEN }}
          body: "Document user-facing changes from the past week"
          commits-count: 50
          labels: weekly,automated
```

### Staged Work (No Immediate PR)

```yaml
- uses: sandgardenhq/doc-holiday-action@v2
  with:
    api-token: ${{ secrets.DOC_HOLIDAY_TOKEN }}
    body: "Draft release notes for the next version"
    releases-count: 1
    stage: true
```

## Troubleshooting

### v2 Migration Notes

- Use `body` for the natural-language request.
- Use `publication` instead of `publications`.
- Use `stage` when work should be prepared without immediately opening a PR.
- Do not use removed v1 inputs such as `event-type`, `title`, `source-connection`, or `comments`.
- Read work-state outputs such as `id`, `status`, `branch`, and `output-url` instead of deprecated job-oriented outputs.

### Authentication Error (401)

**Problem:** `Authentication failed. Please check your api-token.`

**Solution:**
1. Verify token is stored in GitHub secrets
2. Check token hasn't expired in doc.holiday settings
3. Ensure you're passing the secret correctly: `${{ secrets.DOC_HOLIDAY_TOKEN }}`

### Multiple Changeset Types

**Problem:** `Multiple changeset types specified. Only one type is allowed.`

**Solution:** Use only ONE changeset specification type at a time:

```yaml
# Good
commits-count: 10

# Bad
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

## License

MIT License - see LICENSE file for details.

## Support

- [doc.holiday Documentation](https://doc.holiday/docs)
- [GitHub Issues](https://github.com/sandgardenhq/doc-holiday-action/issues)
