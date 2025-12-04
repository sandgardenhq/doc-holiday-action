# Doc Holiday GitHub Action v1.0

## Overview

The Doc Holiday GitHub Action automatically generates release notes and documentation updates using [doc.holiday](https://doc.holiday). It integrates into GitHub Actions workflows and supports smart event detection, manual control, and multiple changeset specification modes.

## Prerequisites

- A doc.holiday account
- A doc.holiday API token stored as a GitHub secret named `DOC_HOLIDAY_TOKEN`
- A GitHub repository where you can configure workflows

## Quick Start

### 1. Get Your API Token

1. Go to [doc.holiday Settings 0 API Keys](https://app.doc.holiday/settings/api-keys).
2. Create a new API key.
3. Copy the token and store it in your repository's secrets as `DOC_HOLIDAY_TOKEN`.

### 2. Configure Automatic Release Notes

1. Open (or create) `.github/workflows/release-docs.yml` in your repository.
2. Add the following workflow definition:

```yaml
name: Generate Release Documentation

on:
  release:
    types: [published]

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    steps:
      - name: Generate release notes with Doc Holiday
        uses: sandgardenhq/doc-holiday-action@v1
        with:
          api-token: ${{ secrets.DOC_HOLIDAY_TOKEN }}
          event-type: release
```

3. Commit and push the workflow file.
4. Publish a new GitHub release to trigger the workflow.

## Usage Modes

### Smart Mode: Releases

Use `event-type: release` to automatically generate release notes when a release is published:

```yaml
- uses: sandgardenhq/doc-holiday-action@v1
  with:
    api-token: ${{ secrets.DOC_HOLIDAY_TOKEN }}
    event-type: release
```

### Smart Mode: PR Merges

Use `event-type: merge` to generate documentation when a pull request is merged:

```yaml
- uses: sandgardenhq/doc-holiday-action@v1
  with:
    api-token: ${{ secrets.DOC_HOLIDAY_TOKEN }}
    event-type: merge
```

### Manual Mode: Custom Jobs

Use manual mode for scheduled, on-demand, or highly customized documentation jobs. In manual mode, you set `event-type` to `custom` (or omit it) and provide a `title` and `body`:

```yaml
- uses: sandgardenhq/doc-holiday-action@v1
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

## Key Inputs

- `api-token` (required): doc.holiday API token stored in GitHub secrets.
- `event-type`: `release`, `merge`, or `custom` (default is `custom`).
- `title` and `body`: Required in manual/custom mode.
- Changeset inputs such as `commits-count`, `releases-count`, `time-range-start`/`time-range-end`, `commits-since-sha`, `commits-shas`, `commits-start-sha`/`commits-end-sha`, and `tags-start`/`tags-end` let you control which changes doc.holiday analyzes.

Only one changeset specification type should be used at a time.

## Tips and Best Practices

- Store the API token in GitHub secrets and never commit it to the repository.
- Use smart modes (`release` and `merge`) for "fire-and-forget" setups.
- Use manual mode for scheduled jobs, custom ranges, or multi-publication updates.
- Use labels and comments to give doc.holiday more context about how to shape the generated documentation.

## Troubleshooting

- If you see authentication errors, verify that `DOC_HOLIDAY_TOKEN` is set in repository secrets and passed correctly to the action.
- If you receive errors about missing `title` or `body`, ensure both are set when `event-type` is `custom` or omitted.
- If you see errors about multiple changeset types, ensure you only configure a single changeset input (for example, `commits-count` or `releases-count`, but not both).

## Related Documentation

- [GitHub Marketplace README for Doc Holiday Action](../README.md)
- [doc.holiday Documentation](https://doc.holiday/docs)
