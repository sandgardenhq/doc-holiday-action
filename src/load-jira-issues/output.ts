// src/load-jira-issues/output.ts
import * as fs from 'fs';
import type { ChangesetInput, OutputArtifact, JiraIssue, ChangesetMetadata } from './types';
import { buildIssueBrowseUrl } from './jira';

/**
 * Determine changeset type and metadata from input
 */
export function buildChangesetMetadata(changeset: ChangesetInput): ChangesetMetadata {
  if (changeset.releasesCount !== undefined) {
    return { type: 'releases', count: changeset.releasesCount };
  }
  if (changeset.timeRangeStart && changeset.timeRangeEnd) {
    return { type: 'time-range', start: changeset.timeRangeStart, end: changeset.timeRangeEnd };
  }
  if (changeset.commitsCount !== undefined) {
    return { type: 'commits-count', count: changeset.commitsCount };
  }
  if (changeset.commitsSinceSha) {
    return { type: 'commits-since', start: changeset.commitsSinceSha };
  }
  if (changeset.commitsShas && changeset.commitsShas.length > 0) {
    return { type: 'commits-specific', shas: changeset.commitsShas };
  }
  if (changeset.commitsStartSha && changeset.commitsEndSha) {
    return { type: 'commits-range', start: changeset.commitsStartSha, end: changeset.commitsEndSha };
  }
  if (changeset.tagsStart) {
    return { type: 'tags', start: changeset.tagsStart, end: changeset.tagsEnd };
  }
  return { type: 'unknown' };
}

/**
 * Build output artifact from issue map
 */
export function buildOutputArtifact(
  issueMap: Map<string, string[]>,
  jiraBaseUrl: string,
  repository: string,
  changeset: ChangesetInput,
  totalCommits: number
): OutputArtifact {
  const issues: JiraIssue[] = Array.from(issueMap.entries())
    .map(([key, commits]) => ({
      key,
      url: buildIssueBrowseUrl(jiraBaseUrl, key),
      commits,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      jiraBaseUrl,
      repository,
      changeset: buildChangesetMetadata(changeset),
      totalIssues: issues.length,
      totalCommits,
    },
    issues,
  };
}

/**
 * Write artifact to JSON file
 */
export function writeArtifact(artifact: OutputArtifact, outputPath: string): void {
  const json = JSON.stringify(artifact, null, 2);
  fs.writeFileSync(outputPath, json, 'utf-8');
}

/**
 * Build comma-separated issue links string
 */
export function buildIssueLinksString(artifact: OutputArtifact): string {
  return artifact.issues.map(issue => issue.url).join(',');
}

/**
 * Build comma-separated issue keys string
 */
export function buildIssueKeysString(artifact: OutputArtifact): string {
  return artifact.issues.map(issue => issue.key).join(',');
}
