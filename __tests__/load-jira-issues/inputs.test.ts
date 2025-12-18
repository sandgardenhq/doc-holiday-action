// __tests__/load-jira-issues/inputs.test.ts
import * as core from '@actions/core';
import { parseInputs } from '../../src/load-jira-issues/inputs';

jest.mock('@actions/core');
jest.mock('../../src/load-jira-issues/jira', () => ({
  isJiraCloud: (baseUrl: string) => baseUrl.includes('.atlassian.net'),
}));

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
