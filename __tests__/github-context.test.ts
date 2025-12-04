// __tests__/github-context.test.ts
import * as github from '@actions/github';
import { getSmartDefaults, inferSourceConnection } from '../src/github-context';

// Mock @actions/github
jest.mock('@actions/github', () => ({
  context: {
    payload: {},
    repo: {
      owner: 'test-owner',
      repo: 'test-repo',
    },
  },
}));

describe('github-context', () => {
  describe('getSmartDefaults', () => {
    describe('release events', () => {
      beforeEach(() => {
        // Set up a release event context
        (github.context as any).payload = {
          release: {
            tag_name: 'v1.2.3',
            body: 'Release body with **markdown**\n\nAnd multiple lines.',
          },
        };
      });

      afterEach(() => {
        // Clean up
        (github.context as any).payload = {};
      });

      test('extracts title from release tag', () => {
        const result = getSmartDefaults('release');
        expect(result.title).toBe('Release notes for v1.2.3');
      });

      test('extracts body from release description', () => {
        const result = getSmartDefaults('release');
        expect(result.body).toBe('Release body with **markdown**\n\nAnd multiple lines.');
      });

      test('sets eventType to release', () => {
        const result = getSmartDefaults('release');
        expect(result.eventType).toBe('release');
      });

      test('handles release with empty body', () => {
        (github.context as any).payload.release.body = '';
        const result = getSmartDefaults('release');
        expect(result.body).toBe('');
      });

      test('handles release with null body', () => {
        (github.context as any).payload.release.body = null;
        const result = getSmartDefaults('release');
        expect(result.body).toBe('');
      });

      test('throws error when no release data found', () => {
        (github.context as any).payload = {};
        expect(() => getSmartDefaults('release')).toThrow(
          'No release data found in event payload. Is this a release event?'
        );
      });
    });

    describe('merge events', () => {
      beforeEach(() => {
        // Set up a PR merge event context
        (github.context as any).payload = {
          pull_request: {
            number: 42,
            title: 'Add amazing feature',
            body: 'This PR adds an amazing feature.\n\n## Changes\n- Added feature A\n- Fixed bug B',
            merged: true,
          },
        };
      });

      afterEach(() => {
        // Clean up
        (github.context as any).payload = {};
      });

      test('extracts title from PR number and title', () => {
        const result = getSmartDefaults('merge');
        expect(result.title).toBe('Documentation for PR #42: Add amazing feature');
      });

      test('extracts body from PR description', () => {
        const result = getSmartDefaults('merge');
        expect(result.body).toBe('This PR adds an amazing feature.\n\n## Changes\n- Added feature A\n- Fixed bug B');
      });

      test('sets eventType to merge', () => {
        const result = getSmartDefaults('merge');
        expect(result.eventType).toBe('merge');
      });

      test('handles PR with empty body', () => {
        (github.context as any).payload.pull_request.body = '';
        const result = getSmartDefaults('merge');
        expect(result.body).toBe('');
      });

      test('handles PR with null body', () => {
        (github.context as any).payload.pull_request.body = null;
        const result = getSmartDefaults('merge');
        expect(result.body).toBe('');
      });

      test('throws error when no PR data found', () => {
        (github.context as any).payload = {};
        expect(() => getSmartDefaults('merge')).toThrow(
          'No pull request data found in event payload. Is this a PR event?'
        );
      });

      test('throws error when PR is not merged', () => {
        (github.context as any).payload.pull_request.merged = false;
        expect(() => getSmartDefaults('merge')).toThrow(
          'Pull request is not merged. Use event-type: merge only for merged PRs.'
        );
      });

      test('handles PR number 0', () => {
        (github.context as any).payload.pull_request.number = 0;
        const result = getSmartDefaults('merge');
        expect(result.title).toBe('Documentation for PR #0: Add amazing feature');
      });

      test('handles PR with very long title', () => {
        const longTitle = 'A'.repeat(500);
        (github.context as any).payload.pull_request.title = longTitle;
        const result = getSmartDefaults('merge');
        expect(result.title).toBe(`Documentation for PR #42: ${longTitle}`);
      });
    });

    describe('error cases', () => {
      beforeEach(() => {
        (github.context as any).payload = {};
      });

      test('throws error for unsupported event type', () => {
        expect(() => getSmartDefaults('custom' as any)).toThrow(
          'Unsupported event type: custom'
        );
      });

      test('throws error for invalid event type', () => {
        expect(() => getSmartDefaults('invalid' as any)).toThrow(
          'Unsupported event type: invalid'
        );
      });
    });
  });

  describe('inferSourceConnection', () => {
    test('returns owner/repo format', () => {
      const result = inferSourceConnection();
      expect(result).toBe('test-owner/test-repo');
    });

    test('uses actual context values', () => {
      // Temporarily change the context
      const originalOwner = github.context.repo.owner;
      const originalRepo = github.context.repo.repo;

      (github.context.repo as any).owner = 'different-owner';
      (github.context.repo as any).repo = 'different-repo';

      const result = inferSourceConnection();
      expect(result).toBe('different-owner/different-repo');

      // Restore
      (github.context.repo as any).owner = originalOwner;
      (github.context.repo as any).repo = originalRepo;
    });

    test('handles special characters in owner/repo names', () => {
      const originalOwner = github.context.repo.owner;
      const originalRepo = github.context.repo.repo;

      (github.context.repo as any).owner = 'owner-with-dash';
      (github.context.repo as any).repo = 'repo_with_underscore';

      const result = inferSourceConnection();
      expect(result).toBe('owner-with-dash/repo_with_underscore');

      // Restore
      (github.context.repo as any).owner = originalOwner;
      (github.context.repo as any).repo = originalRepo;
    });
  });
});
