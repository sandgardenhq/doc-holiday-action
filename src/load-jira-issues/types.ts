// src/load-jira-issues/types.ts

/**
 * Parsed and validated action inputs for load-jira-issues
 */
export interface JiraActionInputs {
  jiraBaseUrl: string;
  jiraApiToken: string;
  jiraUserEmail?: string;
  projectKeys?: string[];
  outputFile: string;
  changeset?: ChangesetInput;
}

/**
 * Changeset specification (shared structure with doc-holiday-action)
 */
export interface ChangesetInput {
  releasesCount?: number;
  timeRangeStart?: string;
  timeRangeEnd?: string;
  commitsCount?: number;
  commitsSinceSha?: string;
  commitsShas?: string[];
  commitsStartSha?: string;
  commitsEndSha?: string;
  commitsIncludeStart?: boolean;
  tagsStart?: string;
  tagsEnd?: string;
}

/**
 * Git commit data
 */
export interface Commit {
  sha: string;
  message: string;
}

/**
 * JIRA issue with referencing commits
 */
export interface JiraIssue {
  key: string;
  url: string;
  commits: string[];
}

/**
 * Changeset metadata for output
 */
export interface ChangesetMetadata {
  type: string;
  start?: string;
  end?: string;
  count?: number;
  shas?: string[];
}

/**
 * Output artifact metadata
 */
export interface OutputMetadata {
  generatedAt: string;
  jiraBaseUrl: string;
  repository: string;
  changeset: ChangesetMetadata;
  totalIssues: number;
  totalCommits: number;
}

/**
 * Complete output artifact structure
 */
export interface OutputArtifact {
  metadata: OutputMetadata;
  issues: JiraIssue[];
}

/**
 * Action outputs
 */
export interface JiraActionOutputs {
  issueLinks: string;
  issueKeys: string;
  issueCount: number;
}
