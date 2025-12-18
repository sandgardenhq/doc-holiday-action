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
