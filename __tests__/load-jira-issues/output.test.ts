// __tests__/load-jira-issues/output.test.ts
import * as fs from 'fs';
import { buildOutputArtifact, buildChangesetMetadata } from '../../src/load-jira-issues/output';
import { ChangesetInput } from '../../src/load-jira-issues/types';

jest.mock('fs');
jest.mock('../../src/load-jira-issues/jira', () => ({
  buildIssueBrowseUrl: (baseUrl: string, issueKey: string) => `${baseUrl}/browse/${issueKey}`,
}));

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
