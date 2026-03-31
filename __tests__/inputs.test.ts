// __tests__/inputs.test.ts
import * as core from '@actions/core';
import { parseInputs } from '../src/inputs';

jest.mock('@actions/core');

const mockGetInput = core.getInput as jest.MockedFunction<typeof core.getInput>;
const mockGetBooleanInput = core.getBooleanInput as jest.MockedFunction<typeof core.getBooleanInput>;

describe('parseInputs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetInput.mockReturnValue('');
    mockGetBooleanInput.mockReturnValue(false);
  });

  describe('required inputs', () => {
    it('should parse api-token as required', () => {
      mockGetInput.mockImplementation((name: string, options?: core.InputOptions) => {
        if (name === 'api-token') {
          expect(options?.required).toBe(true);
          return 'test-token-123';
        }
        if (name === 'body') return 'test body';
        return '';
      });

      const result = parseInputs();
      expect(result.apiToken).toBe('test-token-123');
    });

    it('should require body', () => {
      mockGetInput.mockImplementation((name: string) => {
        if (name === 'api-token') return 'test-token';
        return '';
      });

      expect(() => parseInputs()).toThrow('body is required');
    });
  });

  describe('publication (singular)', () => {
    it('should parse publication as a single string', () => {
      mockGetInput.mockImplementation((name: string) => {
        if (name === 'api-token') return 'test-token';
        if (name === 'body') return 'test body';
        if (name === 'publication') return 'my-publication';
        return '';
      });

      const result = parseInputs();
      expect(result.publication).toBe('my-publication');
    });

    it('should return undefined for empty publication', () => {
      mockGetInput.mockImplementation((name: string) => {
        if (name === 'api-token') return 'test-token';
        if (name === 'body') return 'test body';
        return '';
      });

      const result = parseInputs();
      expect(result.publication).toBeUndefined();
    });
  });

  describe('stage input', () => {
    it('should parse stage as true', () => {
      mockGetInput.mockImplementation((name: string) => {
        if (name === 'api-token') return 'test-token';
        if (name === 'body') return 'test body';
        if (name === 'stage') return 'true';
        return '';
      });

      const result = parseInputs();
      expect(result.stage).toBe(true);
    });

    it('should parse stage as false', () => {
      mockGetInput.mockImplementation((name: string) => {
        if (name === 'api-token') return 'test-token';
        if (name === 'body') return 'test body';
        if (name === 'stage') return 'false';
        return '';
      });

      const result = parseInputs();
      expect(result.stage).toBe(false);
    });

    it('should return undefined when stage is not set', () => {
      mockGetInput.mockImplementation((name: string) => {
        if (name === 'api-token') return 'test-token';
        if (name === 'body') return 'test body';
        return '';
      });

      const result = parseInputs();
      expect(result.stage).toBeUndefined();
    });
  });

  describe('removed inputs should not be parsed', () => {
    it('should not have title, eventType, sourceConnection, or comments', () => {
      mockGetInput.mockImplementation((name: string) => {
        if (name === 'api-token') return 'test-token';
        if (name === 'body') return 'test body';
        return '';
      });

      const result = parseInputs();
      expect(result).not.toHaveProperty('title');
      expect(result).not.toHaveProperty('eventType');
      expect(result).not.toHaveProperty('sourceConnection');
      expect(result).not.toHaveProperty('comments');
      expect(result).not.toHaveProperty('publications');
    });
  });

  describe('comma-separated parsing', () => {
    it('should parse labels from comma-separated string', () => {
      mockGetInput.mockImplementation((name: string) => {
        if (name === 'api-token') return 'test-token';
        if (name === 'body') return 'test body';
        if (name === 'labels') return 'weekly,automated,release';
        return '';
      });

      const result = parseInputs();
      expect(result.labels).toEqual(['weekly', 'automated', 'release']);
    });

    it('should parse relevant-links from comma-separated string', () => {
      mockGetInput.mockImplementation((name: string) => {
        if (name === 'api-token') return 'test-token';
        if (name === 'body') return 'test body';
        if (name === 'relevant-links') return 'https://example.com,https://docs.example.com';
        return '';
      });

      const result = parseInputs();
      expect(result.relevantLinks).toEqual(['https://example.com', 'https://docs.example.com']);
    });

    it('should trim and filter empty values', () => {
      mockGetInput.mockImplementation((name: string) => {
        if (name === 'api-token') return 'test-token';
        if (name === 'body') return 'test body';
        if (name === 'labels') return ' a , , b ';
        return '';
      });

      const result = parseInputs();
      expect(result.labels).toEqual(['a', 'b']);
    });
  });

  describe('changeset parsing', () => {
    it('should parse releases-count changeset', () => {
      mockGetInput.mockImplementation((name: string) => {
        if (name === 'api-token') return 'test-token';
        if (name === 'body') return 'test body';
        if (name === 'releases-count') return '2';
        return '';
      });

      const result = parseInputs();
      expect(result.changeset?.releasesCount).toBe(2);
    });

    it('should return undefined changeset when no changeset inputs', () => {
      mockGetInput.mockImplementation((name: string) => {
        if (name === 'api-token') return 'test-token';
        if (name === 'body') return 'test body';
        return '';
      });

      const result = parseInputs();
      expect(result.changeset).toBeUndefined();
    });

    it('should throw on multiple changeset types', () => {
      mockGetInput.mockImplementation((name: string) => {
        if (name === 'api-token') return 'test-token';
        if (name === 'body') return 'test body';
        if (name === 'releases-count') return '2';
        if (name === 'commits-count') return '10';
        return '';
      });

      expect(() => parseInputs()).toThrow(/Multiple changeset types specified/);
    });
  });

  describe('complete integration', () => {
    it('should parse a complete configuration', () => {
      mockGetInput.mockImplementation((name: string) => {
        if (name === 'api-token') return 'test-token-123';
        if (name === 'body') return 'Update the API docs';
        if (name === 'publication') return 'my-publication';
        if (name === 'stage') return 'true';
        if (name === 'labels') return 'docs,api';
        if (name === 'relevant-links') return 'https://example.com';
        if (name === 'releases-count') return '1';
        return '';
      });

      const result = parseInputs();
      expect(result).toEqual({
        apiToken: 'test-token-123',
        body: 'Update the API docs',
        publication: 'my-publication',
        stage: true,
        labels: ['docs', 'api'],
        relevantLinks: ['https://example.com'],
        changeset: expect.objectContaining({
          releasesCount: 1,
        }),
      });
    });

    it('should parse minimal configuration', () => {
      mockGetInput.mockImplementation((name: string) => {
        if (name === 'api-token') return 'test-token';
        if (name === 'body') return 'test body';
        return '';
      });

      const result = parseInputs();
      expect(result).toEqual({
        apiToken: 'test-token',
        body: 'test body',
        publication: undefined,
        stage: undefined,
        labels: undefined,
        relevantLinks: undefined,
        changeset: undefined,
      });
    });
  });
});
