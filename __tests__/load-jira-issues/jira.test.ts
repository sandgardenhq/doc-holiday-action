// __tests__/load-jira-issues/jira.test.ts

// Mock jira.js module to avoid import issues in tests
jest.mock('jira.js', () => ({
  Version2Client: jest.fn(),
  Version3Client: jest.fn(),
}));

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
