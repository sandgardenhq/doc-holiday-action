# Load JIRA Issues GitHub Action - Design

## Overview

A new GitHub Action that extracts JIRA issue references from Git commits and outputs them for downstream steps (e.g., passing to `doc-holiday-action` as `relevant-links`).

## Architecture Decision

**Separate action** - Not integrated into doc-holiday-action. This follows single-responsibility principle and allows flexible composition.

## Inputs

### Required

| Input | Description |
|-------|-------------|
| `jira-base-url` | JIRA instance URL (e.g., `https://company.atlassian.net`) |
| `jira-api-token` | JIRA API token (store in GitHub secrets) |

### Conditional

| Input | Description |
|-------|-------------|
| `jira-user-email` | Required for JIRA Cloud (*.atlassian.net), ignored for Data Center |

### Optional

| Input | Description | Default |
|-------|-------------|---------|
| `project-keys` | Comma-separated JIRA project keys to filter | (all projects) |
| `output-file` | JSON artifact path | `jira-issues.json` |

### Changeset Specification (one required)

| Input | Description |
|-------|-------------|
| `releases-count` | Number of recent releases |
| `time-range-start` | ISO 8601 timestamp |
| `time-range-end` | ISO 8601 timestamp |
| `commits-count` | Number of recent commits |
| `commits-since-sha` | Start from specific commit |
| `commits-shas` | Comma-separated SHAs |
| `commits-start-sha` | Commit range start |
| `commits-end-sha` | Commit range end |
| `commits-include-start` | Include start commit (true/false) |
| `tags-start` | Start tag |
| `tags-end` | End tag |

## Outputs

### Action Outputs

| Output | Description | Example |
|--------|-------------|---------|
| `issue-links` | Comma-separated browse URLs | `https://company.atlassian.net/browse/PROJ-123,...` |
| `issue-keys` | Comma-separated issue keys | `PROJ-123,PROJ-456,INFRA-789` |
| `issue-count` | Number of unique issues found | `5` |

### JSON Artifact

Written to `output-file` (default: `jira-issues.json`):

```json
{
  "metadata": {
    "generatedAt": "2025-01-15T10:30:00.000Z",
    "jiraBaseUrl": "https://company.atlassian.net",
    "repository": "owner/repo",
    "changeset": { "type": "commits-count", "count": 10 },
    "totalIssues": 5,
    "totalCommits": 10
  },
  "issues": [
    {
      "key": "PROJ-123",
      "url": "https://company.atlassian.net/browse/PROJ-123",
      "commits": ["abc123", "def456"]
    }
  ]
}
```

## Execution Flow

1. **Parse & validate inputs** - Read action inputs, validate changeset (only one type specified), check JIRA Cloud vs Data Center

2. **Fetch JIRA project keys** - Call JIRA API to get all project keys, filter by `project-keys` input if provided

3. **Fetch commits via Git CLI** - Based on changeset type:
   - `commits-count`: `git log -n <count> --format="%H %s"`
   - `tags-start/end`: `git log <start>..<end> --format=...`
   - `commits-range`: `git log <start>..<end> --format=...`
   - etc.

4. **Scan commit messages** - Build regex from project keys (e.g., `(PROJ|INFRA)-\d+`), extract all matches from each commit message

5. **Build output** - Deduplicate issues, build browse URLs, map issues to referencing commits

6. **Write outputs** - Set GitHub Action outputs, write JSON artifact

## Error Handling

- Fail if JIRA API auth fails
- Fail if no changeset specified
- Succeed with empty results if no issues found (not an error)

## Prerequisites

- `actions/checkout` must run before this action
- `fetch-depth: 0` recommended for tag/commit range queries

## File Structure

```
src/
  load-jira-issues/
    index.ts      # Main entry point
    inputs.ts     # Parse & validate inputs
    jira.ts       # JIRA API client
    git.ts        # Git CLI commands
    scanner.ts    # Commit message scanning
    output.ts     # Build outputs & artifacts
    types.ts      # TypeScript interfaces
action.yml        # Action definition (separate file for this action)
```

## Usage Examples

### Basic usage with doc-holiday-action

```yaml
jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Load JIRA Issues
        id: jira
        uses: sandgardenhq/load-jira-issues@v1
        with:
          jira-base-url: https://company.atlassian.net
          jira-api-token: ${{ secrets.JIRA_API_TOKEN }}
          jira-user-email: user@company.com
          commits-count: 50

      - name: Generate Docs
        uses: sandgardenhq/doc-holiday-action@v1
        with:
          api-token: ${{ secrets.DOC_HOLIDAY_TOKEN }}
          event-type: release
          relevant-links: ${{ steps.jira.outputs.issue-links }}
```

### With tag range for releases

```yaml
      - uses: sandgardenhq/load-jira-issues@v1
        with:
          jira-base-url: https://company.atlassian.net
          jira-api-token: ${{ secrets.JIRA_API_TOKEN }}
          jira-user-email: user@company.com
          tags-start: v1.0.0
          tags-end: v1.1.0
          project-keys: PROJ,INFRA
```

### With project key filter

```yaml
      - uses: sandgardenhq/load-jira-issues@v1
        with:
          jira-base-url: https://company.atlassian.net
          jira-api-token: ${{ secrets.JIRA_API_TOKEN }}
          jira-user-email: user@company.com
          commits-count: 100
          project-keys: PROJ,INFRA,OPS
```
