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
