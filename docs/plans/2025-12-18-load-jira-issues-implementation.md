# Load JIRA Issues Action - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a GitHub Action that extracts JIRA issue references from Git commits and outputs them for downstream steps.

**Architecture:** Separate action with its own entry point, sharing changeset types with doc-holiday-action. Uses Git CLI for commit fetching (requires checkout), JIRA API for project key discovery, regex scanning for issue extraction.

**Tech Stack:** TypeScript, @actions/core, @actions/exec, jira.js, Jest

---

## Task 1: Add jira.js Dependency

**Files:**
- Modify: `package.json`

**Step 1: Add the jira.js dependency**

```bash
npm install jira.js
```

**Step 2: Verify installation**

Run: `npm ls jira.js`
Expected: Shows jira.js in dependency tree

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add jira.js dependency for JIRA API integration"
```

---

## Task 2: Create Types for Load JIRA Issues

**Files:**
- Create: `src/load-jira-issues/types.ts`
- Test: `__tests__/load-jira-issues/types.test.ts`

**Step 1: Create the types file**

```typescript
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
```

**Step 2: Create test directory and type compilation test**

```typescript
// __tests__/load-jira-issues/types.test.ts
import {
  JiraActionInputs,
  ChangesetInput,
  Commit,
  JiraIssue,
  OutputArtifact,
  JiraActionOutputs,
} from '../../src/load-jira-issues/types';

describe('Load JIRA Issues Type Definitions', () => {
  describe('JiraActionInputs', () => {
    it('should compile with required fields', () => {
      const inputs: JiraActionInputs = {
        jiraBaseUrl: 'https://company.atlassian.net',
        jiraApiToken: 'token-123',
        outputFile: 'jira-issues.json',
      };
      expect(inputs.jiraBaseUrl).toBe('https://company.atlassian.net');
    });

    it('should compile with all optional fields', () => {
      const inputs: JiraActionInputs = {
        jiraBaseUrl: 'https://company.atlassian.net',
        jiraApiToken: 'token-123',
        jiraUserEmail: 'user@company.com',
        projectKeys: ['PROJ', 'INFRA'],
        outputFile: 'jira-issues.json',
        changeset: { commitsCount: 10 },
      };
      expect(inputs.jiraUserEmail).toBe('user@company.com');
    });
  });

  describe('Commit', () => {
    it('should compile with required fields', () => {
      const commit: Commit = {
        sha: 'abc123',
        message: 'feat: add feature PROJ-123',
      };
      expect(commit.sha).toBe('abc123');
    });
  });

  describe('JiraIssue', () => {
    it('should compile with required fields', () => {
      const issue: JiraIssue = {
        key: 'PROJ-123',
        url: 'https://company.atlassian.net/browse/PROJ-123',
        commits: ['abc123', 'def456'],
      };
      expect(issue.key).toBe('PROJ-123');
    });
  });

  describe('OutputArtifact', () => {
    it('should compile with all required fields', () => {
      const artifact: OutputArtifact = {
        metadata: {
          generatedAt: '2025-01-15T10:30:00.000Z',
          jiraBaseUrl: 'https://company.atlassian.net',
          repository: 'owner/repo',
          changeset: { type: 'commits-count', count: 10 },
          totalIssues: 5,
          totalCommits: 10,
        },
        issues: [
          {
            key: 'PROJ-123',
            url: 'https://company.atlassian.net/browse/PROJ-123',
            commits: ['abc123'],
          },
        ],
      };
      expect(artifact.metadata.totalIssues).toBe(5);
    });
  });

  describe('JiraActionOutputs', () => {
    it('should compile with all fields', () => {
      const outputs: JiraActionOutputs = {
        issueLinks: 'https://company.atlassian.net/browse/PROJ-123',
        issueKeys: 'PROJ-123',
        issueCount: 1,
      };
      expect(outputs.issueCount).toBe(1);
    });
  });
});
```

**Step 3: Create directory structure**

```bash
mkdir -p src/load-jira-issues __tests__/load-jira-issues
```

**Step 4: Run test to verify types compile**

Run: `npm test -- __tests__/load-jira-issues/types.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/load-jira-issues/types.ts __tests__/load-jira-issues/types.test.ts
git commit -m "feat(jira): add type definitions for load-jira-issues action"
```

---

## Task 3: Implement Scanner Module

**Files:**
- Create: `src/load-jira-issues/scanner.ts`
- Test: `__tests__/load-jira-issues/scanner.test.ts`

**Step 1: Write failing tests for scanner**

```typescript
// __tests__/load-jira-issues/scanner.test.ts
import { buildIssuePattern, extractIssues, scanCommits } from '../../src/load-jira-issues/scanner';
import { Commit } from '../../src/load-jira-issues/types';

describe('scanner', () => {
  describe('buildIssuePattern', () => {
    it('should build pattern for single prefix', () => {
      const pattern = buildIssuePattern(['PROJ']);
      expect(pattern.test('PROJ-123')).toBe(true);
      expect(pattern.test('OTHER-123')).toBe(false);
    });

    it('should build pattern for multiple prefixes', () => {
      const pattern = buildIssuePattern(['PROJ', 'INFRA']);
      expect(pattern.test('PROJ-123')).toBe(true);
      expect(pattern.test('INFRA-456')).toBe(true);
      expect(pattern.test('OTHER-789')).toBe(false);
    });

    it('should be case insensitive', () => {
      const pattern = buildIssuePattern(['PROJ']);
      expect(pattern.test('proj-123')).toBe(true);
      expect(pattern.test('Proj-123')).toBe(true);
    });

    it('should return non-matching pattern for empty prefixes', () => {
      const pattern = buildIssuePattern([]);
      expect(pattern.test('PROJ-123')).toBe(false);
    });
  });

  describe('extractIssues', () => {
    it('should extract single issue from message', () => {
      const pattern = buildIssuePattern(['PROJ']);
      const issues = extractIssues('fix: resolve bug PROJ-123', pattern);
      expect(issues).toEqual(['PROJ-123']);
    });

    it('should extract multiple issues from message', () => {
      const pattern = buildIssuePattern(['PROJ', 'INFRA']);
      const issues = extractIssues('feat: PROJ-123 and INFRA-456 done', pattern);
      expect(issues).toEqual(['PROJ-123', 'INFRA-456']);
    });

    it('should deduplicate repeated issues', () => {
      const pattern = buildIssuePattern(['PROJ']);
      const issues = extractIssues('fix: PROJ-123 related to PROJ-123', pattern);
      expect(issues).toEqual(['PROJ-123']);
    });

    it('should normalize to uppercase', () => {
      const pattern = buildIssuePattern(['PROJ']);
      const issues = extractIssues('fix: proj-123 done', pattern);
      expect(issues).toEqual(['PROJ-123']);
    });

    it('should return empty array when no matches', () => {
      const pattern = buildIssuePattern(['PROJ']);
      const issues = extractIssues('fix: some bug', pattern);
      expect(issues).toEqual([]);
    });
  });

  describe('scanCommits', () => {
    it('should build map of issues to commits', () => {
      const commits: Commit[] = [
        { sha: 'abc123', message: 'feat: add feature PROJ-123' },
        { sha: 'def456', message: 'fix: PROJ-123 and PROJ-456' },
        { sha: 'ghi789', message: 'docs: update readme' },
      ];
      const issueMap = scanCommits(commits, ['PROJ']);

      expect(issueMap.get('PROJ-123')).toEqual(['abc123', 'def456']);
      expect(issueMap.get('PROJ-456')).toEqual(['def456']);
      expect(issueMap.size).toBe(2);
    });

    it('should return empty map for empty commits', () => {
      const issueMap = scanCommits([], ['PROJ']);
      expect(issueMap.size).toBe(0);
    });

    it('should return empty map for empty prefixes', () => {
      const commits: Commit[] = [
        { sha: 'abc123', message: 'feat: PROJ-123' },
      ];
      const issueMap = scanCommits(commits, []);
      expect(issueMap.size).toBe(0);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/load-jira-issues/scanner.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write scanner implementation**

```typescript
// src/load-jira-issues/scanner.ts
import type { Commit } from './types';

/**
 * Build regex pattern for matching JIRA issue keys
 */
export function buildIssuePattern(prefixes: string[]): RegExp {
  if (prefixes.length === 0) {
    return /(?!)/g; // Pattern that matches nothing
  }
  const prefixGroup = prefixes.join('|');
  return new RegExp(`(${prefixGroup})-\\d+`, 'gi');
}

/**
 * Extract JIRA issue keys from a commit message
 */
export function extractIssues(message: string, pattern: RegExp): string[] {
  pattern.lastIndex = 0; // Reset regex state for global patterns

  const matches = message.match(pattern);
  if (!matches) {
    return [];
  }

  // Normalize to uppercase and deduplicate
  const uniqueIssues = [...new Set(matches.map(m => m.toUpperCase()))];
  return uniqueIssues;
}

/**
 * Scan commits and build map of issue key to referencing commit SHAs
 */
export function scanCommits(
  commits: Commit[],
  prefixes: string[]
): Map<string, string[]> {
  const issueMap = new Map<string, string[]>();

  if (prefixes.length === 0) {
    return issueMap;
  }

  const pattern = buildIssuePattern(prefixes);

  for (const commit of commits) {
    const issues = extractIssues(commit.message, pattern);
    for (const issue of issues) {
      const existing = issueMap.get(issue) || [];
      existing.push(commit.sha);
      issueMap.set(issue, existing);
    }
  }

  return issueMap;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/load-jira-issues/scanner.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/load-jira-issues/scanner.ts __tests__/load-jira-issues/scanner.test.ts
git commit -m "feat(jira): add commit message scanner for JIRA issue extraction"
```

---

## Task 4: Implement JIRA Client Module

**Files:**
- Create: `src/load-jira-issues/jira.ts`
- Test: `__tests__/load-jira-issues/jira.test.ts`

**Step 1: Write failing tests for JIRA client**

```typescript
// __tests__/load-jira-issues/jira.test.ts
import { isJiraCloud, buildIssueBrowseUrl } from '../../src/load-jira-issues/jira';

// Note: fetchProjectKeys requires mocking jira.js which is complex
// We test the pure functions here; integration tests cover API calls

describe('jira', () => {
  describe('isJiraCloud', () => {
    it('should return true for atlassian.net URLs', () => {
      expect(isJiraCloud('https://company.atlassian.net')).toBe(true);
      expect(isJiraCloud('https://myorg.atlassian.net/')).toBe(true);
    });

    it('should return false for self-hosted URLs', () => {
      expect(isJiraCloud('https://jira.company.com')).toBe(false);
      expect(isJiraCloud('https://jira.internal.org')).toBe(false);
    });
  });

  describe('buildIssueBrowseUrl', () => {
    it('should build browse URL for issue', () => {
      const url = buildIssueBrowseUrl('https://company.atlassian.net', 'PROJ-123');
      expect(url).toBe('https://company.atlassian.net/browse/PROJ-123');
    });

    it('should handle trailing slash in base URL', () => {
      const url = buildIssueBrowseUrl('https://company.atlassian.net/', 'PROJ-123');
      expect(url).toBe('https://company.atlassian.net/browse/PROJ-123');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/load-jira-issues/jira.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write JIRA client implementation**

```typescript
// src/load-jira-issues/jira.ts
import { Version2Client, Version3Client } from 'jira.js';

/**
 * Check if the JIRA URL is a Cloud instance
 */
export function isJiraCloud(baseUrl: string): boolean {
  return baseUrl.includes('.atlassian.net');
}

/**
 * Create appropriate JIRA client based on deployment type
 */
export function createJiraClient(
  baseUrl: string,
  token: string,
  email?: string
): Version2Client | Version3Client {
  const normalizedUrl = baseUrl.replace(/\/$/, '');

  if (isJiraCloud(normalizedUrl)) {
    if (!email) {
      throw new Error('jira-user-email is required for JIRA Cloud authentication');
    }
    return new Version3Client({
      host: normalizedUrl,
      authentication: {
        basic: {
          email,
          apiToken: token,
        },
      },
    });
  }

  // Data Center / Server uses PAT
  return new Version2Client({
    host: normalizedUrl,
    authentication: {
      personalAccessToken: token,
    },
  });
}

/**
 * Fetch project keys from JIRA API
 */
export async function fetchProjectKeys(
  baseUrl: string,
  token: string,
  email?: string,
  allowedKeys?: string[]
): Promise<string[]> {
  const client = createJiraClient(baseUrl, token, email);

  try {
    const response: any = await (client.projects as any).searchProjects({});
    const projects = response.values || [];
    let keys = projects.map((p: any) => p.key).filter((k: any): k is string => k !== undefined);

    // Filter by allowed keys if specified
    if (allowedKeys && allowedKeys.length > 0) {
      const allowedSet = new Set(allowedKeys.map(k => k.toUpperCase()));
      keys = keys.filter((k: string) => allowedSet.has(k.toUpperCase()));
    }

    return keys;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`JIRA API error: ${message}`);
  }
}

/**
 * Build JIRA browse URL for an issue
 */
export function buildIssueBrowseUrl(baseUrl: string, issueKey: string): string {
  const normalizedUrl = baseUrl.replace(/\/$/, '');
  return `${normalizedUrl}/browse/${issueKey}`;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/load-jira-issues/jira.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/load-jira-issues/jira.ts __tests__/load-jira-issues/jira.test.ts
git commit -m "feat(jira): add JIRA client for project key fetching"
```

---

## Task 5: Implement Git Module

**Files:**
- Create: `src/load-jira-issues/git.ts`
- Test: `__tests__/load-jira-issues/git.test.ts`

**Step 1: Write failing tests for git module**

```typescript
// __tests__/load-jira-issues/git.test.ts
import * as exec from '@actions/exec';
import { fetchCommits, parseGitLogOutput, buildGitLogArgs } from '../../src/load-jira-issues/git';
import { ChangesetInput } from '../../src/load-jira-issues/types';

jest.mock('@actions/exec');

const mockExec = exec.exec as jest.MockedFunction<typeof exec.exec>;
const mockGetExecOutput = exec.getExecOutput as jest.MockedFunction<typeof exec.getExecOutput>;

describe('git', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseGitLogOutput', () => {
    it('should parse git log output into commits', () => {
      const output = 'abc123\x00feat: add feature PROJ-123\x00def456\x00fix: bug PROJ-456';
      const commits = parseGitLogOutput(output);
      expect(commits).toEqual([
        { sha: 'abc123', message: 'feat: add feature PROJ-123' },
        { sha: 'def456', message: 'fix: bug PROJ-456' },
      ]);
    });

    it('should handle empty output', () => {
      const commits = parseGitLogOutput('');
      expect(commits).toEqual([]);
    });

    it('should handle single commit', () => {
      const output = 'abc123\x00feat: single commit';
      const commits = parseGitLogOutput(output);
      expect(commits).toEqual([
        { sha: 'abc123', message: 'feat: single commit' },
      ]);
    });
  });

  describe('buildGitLogArgs', () => {
    it('should build args for commits-count', () => {
      const changeset: ChangesetInput = { commitsCount: 10 };
      const args = buildGitLogArgs(changeset);
      expect(args).toContain('-n');
      expect(args).toContain('10');
    });

    it('should build args for tags range', () => {
      const changeset: ChangesetInput = { tagsStart: 'v1.0.0', tagsEnd: 'v1.1.0' };
      const args = buildGitLogArgs(changeset);
      expect(args).toContain('v1.0.0..v1.1.0');
    });

    it('should build args for tags start only', () => {
      const changeset: ChangesetInput = { tagsStart: 'v1.0.0' };
      const args = buildGitLogArgs(changeset);
      expect(args).toContain('v1.0.0..HEAD');
    });

    it('should build args for commits range', () => {
      const changeset: ChangesetInput = {
        commitsStartSha: 'abc123',
        commitsEndSha: 'def456',
        commitsIncludeStart: true
      };
      const args = buildGitLogArgs(changeset);
      expect(args).toContain('abc123^..def456');
    });

    it('should build args for commits range without include start', () => {
      const changeset: ChangesetInput = {
        commitsStartSha: 'abc123',
        commitsEndSha: 'def456',
        commitsIncludeStart: false
      };
      const args = buildGitLogArgs(changeset);
      expect(args).toContain('abc123..def456');
    });

    it('should build args for commits-since-sha', () => {
      const changeset: ChangesetInput = { commitsSinceSha: 'abc123' };
      const args = buildGitLogArgs(changeset);
      expect(args).toContain('abc123..HEAD');
    });

    it('should build args for specific commits', () => {
      const changeset: ChangesetInput = { commitsShas: ['abc123', 'def456'] };
      const args = buildGitLogArgs(changeset);
      expect(args).toContain('abc123');
      expect(args).toContain('def456');
    });
  });

  describe('fetchCommits', () => {
    it('should fetch commits using git log', async () => {
      mockGetExecOutput.mockResolvedValue({
        stdout: 'abc123\x00feat: PROJ-123\x00def456\x00fix: PROJ-456',
        stderr: '',
        exitCode: 0,
      });

      const changeset: ChangesetInput = { commitsCount: 10 };
      const commits = await fetchCommits(changeset);

      expect(commits).toHaveLength(2);
      expect(commits[0].sha).toBe('abc123');
    });

    it('should throw error when git command fails', async () => {
      mockGetExecOutput.mockResolvedValue({
        stdout: '',
        stderr: 'fatal: not a git repository',
        exitCode: 128,
      });

      const changeset: ChangesetInput = { commitsCount: 10 };
      await expect(fetchCommits(changeset)).rejects.toThrow('Git command failed');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/load-jira-issues/git.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Add @actions/exec dependency**

```bash
npm install @actions/exec
```

**Step 4: Write git module implementation**

```typescript
// src/load-jira-issues/git.ts
import * as exec from '@actions/exec';
import type { Commit, ChangesetInput } from './types';

const GIT_LOG_FORMAT = '%H%x00%s%x00'; // SHA, null byte, subject, null byte

/**
 * Parse git log output into Commit objects
 */
export function parseGitLogOutput(output: string): Commit[] {
  if (!output.trim()) {
    return [];
  }

  const parts = output.split('\x00').filter(Boolean);
  const commits: Commit[] = [];

  for (let i = 0; i < parts.length; i += 2) {
    if (parts[i] && parts[i + 1] !== undefined) {
      commits.push({
        sha: parts[i],
        message: parts[i + 1],
      });
    } else if (parts[i]) {
      // Handle last commit if no trailing null byte
      commits.push({
        sha: parts[i],
        message: parts[i + 1] || '',
      });
    }
  }

  return commits;
}

/**
 * Build git log arguments based on changeset specification
 */
export function buildGitLogArgs(changeset: ChangesetInput): string[] {
  const args = ['log', `--format=${GIT_LOG_FORMAT}`];

  if (changeset.commitsCount !== undefined) {
    args.push('-n', changeset.commitsCount.toString());
  } else if (changeset.tagsStart) {
    const range = changeset.tagsEnd
      ? `${changeset.tagsStart}..${changeset.tagsEnd}`
      : `${changeset.tagsStart}..HEAD`;
    args.push(range);
  } else if (changeset.commitsStartSha && changeset.commitsEndSha) {
    const startRef = changeset.commitsIncludeStart
      ? `${changeset.commitsStartSha}^`
      : changeset.commitsStartSha;
    args.push(`${startRef}..${changeset.commitsEndSha}`);
  } else if (changeset.commitsSinceSha) {
    args.push(`${changeset.commitsSinceSha}..HEAD`);
  } else if (changeset.commitsShas && changeset.commitsShas.length > 0) {
    // For specific commits, we need to use --no-walk
    args.push('--no-walk');
    args.push(...changeset.commitsShas);
  } else if (changeset.releasesCount !== undefined) {
    // For releases, we need to find the last N release tags
    // This is a simplification - may need git describe or tag listing
    args.push('-n', '100'); // Fetch enough to cover releases
  } else if (changeset.timeRangeStart && changeset.timeRangeEnd) {
    args.push(`--since=${changeset.timeRangeStart}`);
    args.push(`--until=${changeset.timeRangeEnd}`);
  }

  return args;
}

/**
 * Fetch commits from git based on changeset specification
 */
export async function fetchCommits(changeset: ChangesetInput): Promise<Commit[]> {
  const args = buildGitLogArgs(changeset);

  const result = await exec.getExecOutput('git', args, {
    ignoreReturnCode: true,
    silent: true,
  });

  if (result.exitCode !== 0) {
    throw new Error(`Git command failed: ${result.stderr}`);
  }

  return parseGitLogOutput(result.stdout);
}
```

**Step 5: Run test to verify it passes**

Run: `npm test -- __tests__/load-jira-issues/git.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add package.json package-lock.json src/load-jira-issues/git.ts __tests__/load-jira-issues/git.test.ts
git commit -m "feat(jira): add git module for commit fetching via CLI"
```

---

## Task 6: Implement Output Module

**Files:**
- Create: `src/load-jira-issues/output.ts`
- Test: `__tests__/load-jira-issues/output.test.ts`

**Step 1: Write failing tests for output module**

```typescript
// __tests__/load-jira-issues/output.test.ts
import * as fs from 'fs';
import { buildOutputArtifact, buildChangesetMetadata } from '../../src/load-jira-issues/output';
import { ChangesetInput } from '../../src/load-jira-issues/types';

jest.mock('fs');

const mockWriteFileSync = fs.writeFileSync as jest.MockedFunction<typeof fs.writeFileSync>;

describe('output', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildChangesetMetadata', () => {
    it('should build metadata for commits-count', () => {
      const changeset: ChangesetInput = { commitsCount: 10 };
      const metadata = buildChangesetMetadata(changeset);
      expect(metadata).toEqual({ type: 'commits-count', count: 10 });
    });

    it('should build metadata for tags range', () => {
      const changeset: ChangesetInput = { tagsStart: 'v1.0.0', tagsEnd: 'v1.1.0' };
      const metadata = buildChangesetMetadata(changeset);
      expect(metadata).toEqual({ type: 'tags', start: 'v1.0.0', end: 'v1.1.0' });
    });

    it('should build metadata for time range', () => {
      const changeset: ChangesetInput = {
        timeRangeStart: '2025-01-01T00:00:00Z',
        timeRangeEnd: '2025-01-31T23:59:59Z'
      };
      const metadata = buildChangesetMetadata(changeset);
      expect(metadata).toEqual({
        type: 'time-range',
        start: '2025-01-01T00:00:00Z',
        end: '2025-01-31T23:59:59Z'
      });
    });

    it('should build metadata for releases-count', () => {
      const changeset: ChangesetInput = { releasesCount: 2 };
      const metadata = buildChangesetMetadata(changeset);
      expect(metadata).toEqual({ type: 'releases', count: 2 });
    });
  });

  describe('buildOutputArtifact', () => {
    it('should build complete artifact from issue map', () => {
      const issueMap = new Map<string, string[]>();
      issueMap.set('PROJ-123', ['abc123', 'def456']);
      issueMap.set('PROJ-456', ['ghi789']);

      const artifact = buildOutputArtifact(
        issueMap,
        'https://company.atlassian.net',
        'owner/repo',
        { commitsCount: 10 },
        10
      );

      expect(artifact.metadata.jiraBaseUrl).toBe('https://company.atlassian.net');
      expect(artifact.metadata.repository).toBe('owner/repo');
      expect(artifact.metadata.totalIssues).toBe(2);
      expect(artifact.metadata.totalCommits).toBe(10);
      expect(artifact.issues).toHaveLength(2);
      expect(artifact.issues[0].key).toBe('PROJ-123');
      expect(artifact.issues[0].url).toBe('https://company.atlassian.net/browse/PROJ-123');
    });

    it('should sort issues by key', () => {
      const issueMap = new Map<string, string[]>();
      issueMap.set('PROJ-456', ['abc123']);
      issueMap.set('PROJ-123', ['def456']);

      const artifact = buildOutputArtifact(
        issueMap,
        'https://company.atlassian.net',
        'owner/repo',
        { commitsCount: 10 },
        10
      );

      expect(artifact.issues[0].key).toBe('PROJ-123');
      expect(artifact.issues[1].key).toBe('PROJ-456');
    });

    it('should handle empty issue map', () => {
      const issueMap = new Map<string, string[]>();

      const artifact = buildOutputArtifact(
        issueMap,
        'https://company.atlassian.net',
        'owner/repo',
        { commitsCount: 10 },
        10
      );

      expect(artifact.metadata.totalIssues).toBe(0);
      expect(artifact.issues).toHaveLength(0);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/load-jira-issues/output.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write output module implementation**

```typescript
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
```

**Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/load-jira-issues/output.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/load-jira-issues/output.ts __tests__/load-jira-issues/output.test.ts
git commit -m "feat(jira): add output module for artifact generation"
```

---

## Task 7: Implement Inputs Module

**Files:**
- Create: `src/load-jira-issues/inputs.ts`
- Test: `__tests__/load-jira-issues/inputs.test.ts`

**Step 1: Write failing tests for inputs module**

```typescript
// __tests__/load-jira-issues/inputs.test.ts
import * as core from '@actions/core';
import { parseInputs } from '../../src/load-jira-issues/inputs';

jest.mock('@actions/core');

const mockGetInput = core.getInput as jest.MockedFunction<typeof core.getInput>;

describe('parseInputs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetInput.mockReturnValue('');
  });

  describe('required inputs', () => {
    it('should parse jira-base-url as required', () => {
      mockGetInput.mockImplementation((name: string, options?: core.InputOptions) => {
        if (name === 'jira-base-url') {
          expect(options?.required).toBe(true);
          return 'https://company.atlassian.net';
        }
        if (name === 'jira-api-token') return 'token-123';
        if (name === 'jira-user-email') return 'user@company.com';
        if (name === 'output-file') return '';
        if (name === 'commits-count') return '10';
        return '';
      });

      const result = parseInputs();
      expect(result.jiraBaseUrl).toBe('https://company.atlassian.net');
    });

    it('should parse jira-api-token as required', () => {
      mockGetInput.mockImplementation((name: string, options?: core.InputOptions) => {
        if (name === 'jira-base-url') return 'https://company.atlassian.net';
        if (name === 'jira-api-token') {
          expect(options?.required).toBe(true);
          return 'token-123';
        }
        if (name === 'jira-user-email') return 'user@company.com';
        if (name === 'commits-count') return '10';
        return '';
      });

      const result = parseInputs();
      expect(result.jiraApiToken).toBe('token-123');
    });
  });

  describe('optional inputs', () => {
    it('should parse jira-user-email', () => {
      mockGetInput.mockImplementation((name: string) => {
        if (name === 'jira-base-url') return 'https://company.atlassian.net';
        if (name === 'jira-api-token') return 'token-123';
        if (name === 'jira-user-email') return 'user@company.com';
        if (name === 'commits-count') return '10';
        return '';
      });

      const result = parseInputs();
      expect(result.jiraUserEmail).toBe('user@company.com');
    });

    it('should parse project-keys as comma-separated list', () => {
      mockGetInput.mockImplementation((name: string) => {
        if (name === 'jira-base-url') return 'https://company.atlassian.net';
        if (name === 'jira-api-token') return 'token-123';
        if (name === 'jira-user-email') return 'user@company.com';
        if (name === 'project-keys') return 'PROJ, INFRA, OPS';
        if (name === 'commits-count') return '10';
        return '';
      });

      const result = parseInputs();
      expect(result.projectKeys).toEqual(['PROJ', 'INFRA', 'OPS']);
    });

    it('should use default output-file when not provided', () => {
      mockGetInput.mockImplementation((name: string) => {
        if (name === 'jira-base-url') return 'https://company.atlassian.net';
        if (name === 'jira-api-token') return 'token-123';
        if (name === 'jira-user-email') return 'user@company.com';
        if (name === 'commits-count') return '10';
        return '';
      });

      const result = parseInputs();
      expect(result.outputFile).toBe('jira-issues.json');
    });
  });

  describe('changeset validation', () => {
    it('should throw error when no changeset specified', () => {
      mockGetInput.mockImplementation((name: string) => {
        if (name === 'jira-base-url') return 'https://company.atlassian.net';
        if (name === 'jira-api-token') return 'token-123';
        if (name === 'jira-user-email') return 'user@company.com';
        return '';
      });

      expect(() => parseInputs()).toThrow('No changeset specified');
    });

    it('should throw error when multiple changeset types specified', () => {
      mockGetInput.mockImplementation((name: string) => {
        if (name === 'jira-base-url') return 'https://company.atlassian.net';
        if (name === 'jira-api-token') return 'token-123';
        if (name === 'jira-user-email') return 'user@company.com';
        if (name === 'commits-count') return '10';
        if (name === 'releases-count') return '2';
        return '';
      });

      expect(() => parseInputs()).toThrow('Multiple changeset types specified');
    });
  });

  describe('JIRA Cloud validation', () => {
    it('should throw error when jira-user-email missing for Cloud', () => {
      mockGetInput.mockImplementation((name: string) => {
        if (name === 'jira-base-url') return 'https://company.atlassian.net';
        if (name === 'jira-api-token') return 'token-123';
        if (name === 'commits-count') return '10';
        return '';
      });

      expect(() => parseInputs()).toThrow('jira-user-email is required for JIRA Cloud');
    });

    it('should not require jira-user-email for Data Center', () => {
      mockGetInput.mockImplementation((name: string) => {
        if (name === 'jira-base-url') return 'https://jira.company.com';
        if (name === 'jira-api-token') return 'token-123';
        if (name === 'commits-count') return '10';
        return '';
      });

      const result = parseInputs();
      expect(result.jiraUserEmail).toBeUndefined();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/load-jira-issues/inputs.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write inputs module implementation**

```typescript
// src/load-jira-issues/inputs.ts
import * as core from '@actions/core';
import type { JiraActionInputs, ChangesetInput } from './types';
import { isJiraCloud } from './jira';

/**
 * Parse and validate all action inputs
 */
export function parseInputs(): JiraActionInputs {
  const jiraBaseUrl = core.getInput('jira-base-url', { required: true });
  const jiraApiToken = core.getInput('jira-api-token', { required: true });
  const jiraUserEmail = core.getInput('jira-user-email') || undefined;
  const projectKeysInput = core.getInput('project-keys');
  const outputFile = core.getInput('output-file') || 'jira-issues.json';

  // Parse comma-separated project keys
  const projectKeys = projectKeysInput
    ? projectKeysInput.split(',').map(k => k.trim()).filter(Boolean)
    : undefined;

  // Parse changeset inputs
  const changeset = parseChangesetInputs();

  // Validate changeset is specified
  if (!changeset) {
    throw new Error('No changeset specified. Please provide one of: releases-count, tags-start, commits-count, etc.');
  }

  // Validate JIRA Cloud requires email
  if (isJiraCloud(jiraBaseUrl) && !jiraUserEmail) {
    throw new Error('jira-user-email is required for JIRA Cloud authentication');
  }

  return {
    jiraBaseUrl,
    jiraApiToken,
    jiraUserEmail,
    projectKeys,
    outputFile,
    changeset,
  };
}

/**
 * Parse changeset specification inputs
 */
function parseChangesetInputs(): ChangesetInput | undefined {
  const releasesCount = core.getInput('releases-count');
  const timeRangeStart = core.getInput('time-range-start');
  const timeRangeEnd = core.getInput('time-range-end');
  const commitsCount = core.getInput('commits-count');
  const commitsSinceSha = core.getInput('commits-since-sha');
  const commitsShas = core.getInput('commits-shas');
  const commitsStartSha = core.getInput('commits-start-sha');
  const commitsEndSha = core.getInput('commits-end-sha');
  const commitsIncludeStart = core.getInput('commits-include-start');
  const tagsStart = core.getInput('tags-start');
  const tagsEnd = core.getInput('tags-end');

  // Check if any changeset inputs are provided
  const hasAnyChangesetInput = [
    releasesCount,
    timeRangeStart,
    commitsCount,
    commitsSinceSha,
    commitsShas,
    commitsStartSha,
    tagsStart,
  ].some(Boolean);

  if (!hasAnyChangesetInput) {
    return undefined;
  }

  // Validate mutual exclusivity
  const specifiedTypes = [
    releasesCount && 'releases-count',
    timeRangeStart && 'time-range',
    commitsCount && 'commits-count',
    commitsSinceSha && 'commits-since-sha',
    commitsShas && 'commits-shas',
    commitsStartSha && 'commits-range',
    tagsStart && 'tags',
  ].filter(Boolean);

  if (specifiedTypes.length > 1) {
    throw new Error(
      `Multiple changeset types specified: ${specifiedTypes.join(', ')}. Only one type is allowed.`
    );
  }

  return {
    releasesCount: releasesCount ? parseInt(releasesCount, 10) : undefined,
    timeRangeStart: timeRangeStart || undefined,
    timeRangeEnd: timeRangeEnd || undefined,
    commitsCount: commitsCount ? parseInt(commitsCount, 10) : undefined,
    commitsSinceSha: commitsSinceSha || undefined,
    commitsShas: commitsShas
      ? commitsShas.split(',').map(s => s.trim()).filter(Boolean)
      : undefined,
    commitsStartSha: commitsStartSha || undefined,
    commitsEndSha: commitsEndSha || undefined,
    commitsIncludeStart: commitsIncludeStart ? commitsIncludeStart === 'true' : undefined,
    tagsStart: tagsStart || undefined,
    tagsEnd: tagsEnd || undefined,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/load-jira-issues/inputs.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/load-jira-issues/inputs.ts __tests__/load-jira-issues/inputs.test.ts
git commit -m "feat(jira): add inputs module for action input parsing"
```

---

## Task 8: Implement Main Entry Point

**Files:**
- Create: `src/load-jira-issues/index.ts`
- Test: `__tests__/load-jira-issues/index.test.ts`

**Step 1: Write failing tests for main entry point**

```typescript
// __tests__/load-jira-issues/index.test.ts
import * as core from '@actions/core';
import * as github from '@actions/github';
import { run } from '../../src/load-jira-issues/index';
import * as inputs from '../../src/load-jira-issues/inputs';
import * as jira from '../../src/load-jira-issues/jira';
import * as git from '../../src/load-jira-issues/git';
import * as scanner from '../../src/load-jira-issues/scanner';
import * as output from '../../src/load-jira-issues/output';

jest.mock('@actions/core');
jest.mock('@actions/github', () => ({
  context: {
    repo: { owner: 'test-owner', repo: 'test-repo' },
  },
}));
jest.mock('../../src/load-jira-issues/inputs');
jest.mock('../../src/load-jira-issues/jira');
jest.mock('../../src/load-jira-issues/git');
jest.mock('../../src/load-jira-issues/scanner');
jest.mock('../../src/load-jira-issues/output');

const mockParseInputs = inputs.parseInputs as jest.MockedFunction<typeof inputs.parseInputs>;
const mockFetchProjectKeys = jira.fetchProjectKeys as jest.MockedFunction<typeof jira.fetchProjectKeys>;
const mockFetchCommits = git.fetchCommits as jest.MockedFunction<typeof git.fetchCommits>;
const mockScanCommits = scanner.scanCommits as jest.MockedFunction<typeof scanner.scanCommits>;
const mockBuildOutputArtifact = output.buildOutputArtifact as jest.MockedFunction<typeof output.buildOutputArtifact>;
const mockWriteArtifact = output.writeArtifact as jest.MockedFunction<typeof output.writeArtifact>;
const mockBuildIssueLinksString = output.buildIssueLinksString as jest.MockedFunction<typeof output.buildIssueLinksString>;
const mockBuildIssueKeysString = output.buildIssueKeysString as jest.MockedFunction<typeof output.buildIssueKeysString>;
const mockSetOutput = core.setOutput as jest.MockedFunction<typeof core.setOutput>;
const mockSetFailed = core.setFailed as jest.MockedFunction<typeof core.setFailed>;
const mockInfo = core.info as jest.MockedFunction<typeof core.info>;

describe('run', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete full flow successfully', async () => {
    mockParseInputs.mockReturnValue({
      jiraBaseUrl: 'https://company.atlassian.net',
      jiraApiToken: 'token-123',
      jiraUserEmail: 'user@company.com',
      outputFile: 'jira-issues.json',
      changeset: { commitsCount: 10 },
    });

    mockFetchProjectKeys.mockResolvedValue(['PROJ', 'INFRA']);
    mockFetchCommits.mockResolvedValue([
      { sha: 'abc123', message: 'feat: PROJ-123' },
      { sha: 'def456', message: 'fix: PROJ-456' },
    ]);

    const issueMap = new Map([
      ['PROJ-123', ['abc123']],
      ['PROJ-456', ['def456']],
    ]);
    mockScanCommits.mockReturnValue(issueMap);

    const artifact = {
      metadata: {
        generatedAt: '2025-01-15T10:30:00.000Z',
        jiraBaseUrl: 'https://company.atlassian.net',
        repository: 'test-owner/test-repo',
        changeset: { type: 'commits-count', count: 10 },
        totalIssues: 2,
        totalCommits: 2,
      },
      issues: [
        { key: 'PROJ-123', url: 'https://company.atlassian.net/browse/PROJ-123', commits: ['abc123'] },
        { key: 'PROJ-456', url: 'https://company.atlassian.net/browse/PROJ-456', commits: ['def456'] },
      ],
    };
    mockBuildOutputArtifact.mockReturnValue(artifact);
    mockBuildIssueLinksString.mockReturnValue(
      'https://company.atlassian.net/browse/PROJ-123,https://company.atlassian.net/browse/PROJ-456'
    );
    mockBuildIssueKeysString.mockReturnValue('PROJ-123,PROJ-456');

    await run();

    expect(mockFetchProjectKeys).toHaveBeenCalledWith(
      'https://company.atlassian.net',
      'token-123',
      'user@company.com',
      undefined
    );
    expect(mockFetchCommits).toHaveBeenCalledWith({ commitsCount: 10 });
    expect(mockScanCommits).toHaveBeenCalledWith(
      [
        { sha: 'abc123', message: 'feat: PROJ-123' },
        { sha: 'def456', message: 'fix: PROJ-456' },
      ],
      ['PROJ', 'INFRA']
    );
    expect(mockWriteArtifact).toHaveBeenCalledWith(artifact, 'jira-issues.json');
    expect(mockSetOutput).toHaveBeenCalledWith('issue-links', expect.any(String));
    expect(mockSetOutput).toHaveBeenCalledWith('issue-keys', 'PROJ-123,PROJ-456');
    expect(mockSetOutput).toHaveBeenCalledWith('issue-count', '2');
  });

  it('should handle errors gracefully', async () => {
    mockParseInputs.mockImplementation(() => {
      throw new Error('Missing required input');
    });

    await run();

    expect(mockSetFailed).toHaveBeenCalledWith('Missing required input');
  });

  it('should succeed with zero issues found', async () => {
    mockParseInputs.mockReturnValue({
      jiraBaseUrl: 'https://company.atlassian.net',
      jiraApiToken: 'token-123',
      jiraUserEmail: 'user@company.com',
      outputFile: 'jira-issues.json',
      changeset: { commitsCount: 10 },
    });

    mockFetchProjectKeys.mockResolvedValue(['PROJ']);
    mockFetchCommits.mockResolvedValue([
      { sha: 'abc123', message: 'feat: no jira reference' },
    ]);
    mockScanCommits.mockReturnValue(new Map());

    const artifact = {
      metadata: {
        generatedAt: '2025-01-15T10:30:00.000Z',
        jiraBaseUrl: 'https://company.atlassian.net',
        repository: 'test-owner/test-repo',
        changeset: { type: 'commits-count', count: 10 },
        totalIssues: 0,
        totalCommits: 1,
      },
      issues: [],
    };
    mockBuildOutputArtifact.mockReturnValue(artifact);
    mockBuildIssueLinksString.mockReturnValue('');
    mockBuildIssueKeysString.mockReturnValue('');

    await run();

    expect(mockSetFailed).not.toHaveBeenCalled();
    expect(mockSetOutput).toHaveBeenCalledWith('issue-count', '0');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/load-jira-issues/index.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write main entry point implementation**

```typescript
// src/load-jira-issues/index.ts
import * as core from '@actions/core';
import * as github from '@actions/github';
import { parseInputs } from './inputs';
import { fetchProjectKeys } from './jira';
import { fetchCommits } from './git';
import { scanCommits } from './scanner';
import { buildOutputArtifact, writeArtifact, buildIssueLinksString, buildIssueKeysString } from './output';

/**
 * Main entry point for the load-jira-issues action
 */
export async function run(): Promise<void> {
  try {
    core.info('Starting JIRA issue extraction...');

    // Step 1: Parse inputs
    const inputs = parseInputs();
    core.info(`JIRA base URL: ${inputs.jiraBaseUrl}`);

    // Step 2: Fetch JIRA project keys
    core.info('Fetching JIRA project keys...');
    const projectKeys = await fetchProjectKeys(
      inputs.jiraBaseUrl,
      inputs.jiraApiToken,
      inputs.jiraUserEmail,
      inputs.projectKeys
    );
    core.info(`Found ${projectKeys.length} project keys: ${projectKeys.join(', ')}`);

    // Step 3: Fetch commits based on changeset
    core.info('Fetching commits from Git...');
    const commits = await fetchCommits(inputs.changeset!);
    core.info(`Found ${commits.length} commits`);

    // Step 4: Scan commits for issue references
    core.info('Scanning commits for JIRA issues...');
    const issueMap = scanCommits(commits, projectKeys);
    core.info(`Found ${issueMap.size} unique issues`);

    // Step 5: Build and write output artifact
    const repository = `${github.context.repo.owner}/${github.context.repo.repo}`;
    const artifact = buildOutputArtifact(
      issueMap,
      inputs.jiraBaseUrl,
      repository,
      inputs.changeset!,
      commits.length
    );

    writeArtifact(artifact, inputs.outputFile);
    core.info(`Output written to ${inputs.outputFile}`);

    // Step 6: Set action outputs
    const issueLinks = buildIssueLinksString(artifact);
    const issueKeys = buildIssueKeysString(artifact);

    core.setOutput('issue-links', issueLinks);
    core.setOutput('issue-keys', issueKeys);
    core.setOutput('issue-count', artifact.metadata.totalIssues.toString());

    core.info('✓ Action completed successfully!');
    core.info(`Found ${artifact.metadata.totalIssues} JIRA issues across ${artifact.metadata.totalCommits} commits`);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unknown error occurred');
    }
  }
}

// Only run if not in test environment
if (process.env.NODE_ENV !== 'test') {
  run();
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/load-jira-issues/index.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/load-jira-issues/index.ts __tests__/load-jira-issues/index.test.ts
git commit -m "feat(jira): add main entry point for load-jira-issues action"
```

---

## Task 9: Create Action Definition

**Files:**
- Create: `load-jira-issues-action.yml`

**Step 1: Create the action.yml for load-jira-issues**

```yaml
# load-jira-issues-action.yml
name: 'Load JIRA Issues'
description: 'Extract JIRA issue references from Git commits for use in downstream actions'
author: 'Sandgarden'

branding:
  icon: 'link'
  color: 'blue'

inputs:
  jira-base-url:
    description: 'JIRA instance URL (e.g., https://company.atlassian.net)'
    required: true

  jira-api-token:
    description: 'JIRA API token (store in GitHub secrets)'
    required: true

  jira-user-email:
    description: 'Email for JIRA Cloud auth (required for Cloud, ignored for Data Center)'
    required: false

  project-keys:
    description: 'Comma-separated JIRA project keys to filter (default: all projects)'
    required: false

  output-file:
    description: 'Output JSON file path'
    required: false
    default: 'jira-issues.json'

  releases-count:
    description: 'Number of recent releases to include'
    required: false

  time-range-start:
    description: 'Time range start (ISO 8601 timestamp)'
    required: false

  time-range-end:
    description: 'Time range end (ISO 8601 timestamp)'
    required: false

  commits-count:
    description: 'Number of recent commits'
    required: false

  commits-since-sha:
    description: 'Start from specific commit SHA'
    required: false

  commits-shas:
    description: 'Comma-separated list of specific commit SHAs'
    required: false

  commits-start-sha:
    description: 'Commit range start SHA'
    required: false

  commits-end-sha:
    description: 'Commit range end SHA'
    required: false

  commits-include-start:
    description: 'Include start commit in range (true/false)'
    required: false

  tags-start:
    description: 'Start tag'
    required: false

  tags-end:
    description: 'End tag'
    required: false

outputs:
  issue-links:
    description: 'Comma-separated JIRA issue browse URLs'

  issue-keys:
    description: 'Comma-separated JIRA issue keys'

  issue-count:
    description: 'Number of unique JIRA issues found'

runs:
  using: 'node20'
  main: 'dist/load-jira-issues/index.js'
```

**Step 2: Commit**

```bash
git add load-jira-issues-action.yml
git commit -m "feat(jira): add GitHub Action definition for load-jira-issues"
```

---

## Task 10: Update Build Configuration

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json` (if needed)

**Step 1: Update package.json with new build scripts**

Add to scripts section:
```json
{
  "scripts": {
    "build": "tsc",
    "package": "ncc build dist/index.js -o dist --source-map --license licenses.txt",
    "package:jira": "ncc build dist/load-jira-issues/index.js -o dist/load-jira-issues --source-map --license licenses.txt",
    "package:all": "npm run package && npm run package:jira",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

**Step 2: Build and package**

```bash
npm run build
npm run package:jira
```

**Step 3: Verify build output exists**

Run: `ls -la dist/load-jira-issues/`
Expected: index.js and related files

**Step 4: Commit**

```bash
git add package.json dist/load-jira-issues/
git commit -m "build: add build configuration for load-jira-issues action"
```

---

## Task 11: Run All Tests and Verify

**Step 1: Run full test suite**

```bash
npm test
```

Expected: All tests pass

**Step 2: Run build**

```bash
npm run build && npm run package:all
```

Expected: No errors

**Step 3: Commit any final changes**

```bash
git add -A
git commit -m "chore: final cleanup for load-jira-issues action"
```

---

## Task 12: Update README

**Files:**
- Modify: `README.md`

**Step 1: Add load-jira-issues documentation section to README**

Add after the main doc-holiday-action documentation:

```markdown
---

# Load JIRA Issues Action

Extract JIRA issue references from Git commits for use in downstream actions.

## Quick Start

```yaml
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

- name: Generate Docs with JIRA Links
  uses: sandgardenhq/doc-holiday-action@v1
  with:
    api-token: ${{ secrets.DOC_HOLIDAY_TOKEN }}
    event-type: release
    relevant-links: ${{ steps.jira.outputs.issue-links }}
```

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

Same changeset options as doc-holiday-action. Only one type can be used at a time.

## Outputs

| Output | Description |
|--------|-------------|
| `issue-links` | Comma-separated JIRA browse URLs |
| `issue-keys` | Comma-separated JIRA issue keys |
| `issue-count` | Number of unique issues found |

## Prerequisites

- `actions/checkout` must run before this action
- `fetch-depth: 0` recommended for tag/commit range queries
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add load-jira-issues action documentation to README"
```

---

## Summary

Tasks completed:
1. Add jira.js dependency
2. Create types
3. Implement scanner module
4. Implement JIRA client module
5. Implement git module
6. Implement output module
7. Implement inputs module
8. Implement main entry point
9. Create action definition
10. Update build configuration
11. Run all tests
12. Update README

Total: 12 tasks with TDD approach throughout.
