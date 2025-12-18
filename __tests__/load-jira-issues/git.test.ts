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
