// __tests__/changes.test.ts

import { buildChanges } from '../src/changes';
import { ChangesetInput } from '../src/types';

describe('buildChanges', () => {
  describe('releases-count changeset type', () => {
    it('should build changes array with releases count', () => {
      const changeset: ChangesetInput = {
        releasesCount: 5
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([{ releases: { count: 5 } }]);
    });

    it('should handle releases count of 1', () => {
      const changeset: ChangesetInput = {
        releasesCount: 1
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([{ releases: { count: 1 } }]);
    });

    it('should handle releases count of 0', () => {
      const changeset: ChangesetInput = {
        releasesCount: 0
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([{ releases: { count: 0 } }]);
    });
  });

  describe('time-range changeset type', () => {
    it('should build changes array with time range (start and end)', () => {
      const changeset: ChangesetInput = {
        timeRangeStart: '2025-01-01T00:00:00Z',
        timeRangeEnd: '2025-01-31T23:59:59Z'
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([
        {
          timeRange: {
            start: '2025-01-01T00:00:00Z',
            end: '2025-01-31T23:59:59Z'
          }
        }
      ]);
    });

    it('should return empty array if only start is provided (requires both)', () => {
      const changeset: ChangesetInput = {
        timeRangeStart: '2025-01-01T00:00:00Z'
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([]);
    });

    it('should return empty array if only end is provided', () => {
      const changeset: ChangesetInput = {
        timeRangeEnd: '2025-01-31T23:59:59Z'
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([]);
    });
  });

  describe('commits-count changeset type', () => {
    it('should build changes array with commits count', () => {
      const changeset: ChangesetInput = {
        commitsCount: 10
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([{ commits: { count: 10 } }]);
    });

    it('should handle commits count of 0', () => {
      const changeset: ChangesetInput = {
        commitsCount: 0
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([{ commits: { count: 0 } }]);
    });
  });

  describe('commits-since-sha changeset type', () => {
    it('should build changes array with commits since SHA', () => {
      const changeset: ChangesetInput = {
        commitsSinceSha: 'abc123def456'
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([{ commits: { startSha: 'abc123def456' } }]);
    });

    it('should handle long commit SHA', () => {
      const changeset: ChangesetInput = {
        commitsSinceSha: 'abc123def456789ghi012jkl345mno678pqr901stu234'
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([
        { commits: { startSha: 'abc123def456789ghi012jkl345mno678pqr901stu234' } }
      ]);
    });
  });

  describe('commits-shas changeset type (array)', () => {
    it('should build changes array with specific commit SHAs', () => {
      const changeset: ChangesetInput = {
        commitsShas: ['abc123', 'def456', '789ghi']
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([{ commits: { shas: ['abc123', 'def456', '789ghi'] } }]);
    });

    it('should handle single commit SHA in array', () => {
      const changeset: ChangesetInput = {
        commitsShas: ['abc123']
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([{ commits: { shas: ['abc123'] } }]);
    });

    it('should return empty array if commitsShas is empty array', () => {
      const changeset: ChangesetInput = {
        commitsShas: []
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([]);
    });

    it('should return empty array if commitsShas is undefined', () => {
      const changeset: ChangesetInput = {
        commitsShas: undefined
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([]);
    });
  });

  describe('commits-range changeset type (start/end with include-start)', () => {
    it('should build changes array with commit range (start and end)', () => {
      const changeset: ChangesetInput = {
        commitsStartSha: 'abc123',
        commitsEndSha: 'def456'
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([
        {
          commits: {
            startSha: 'abc123',
            endSha: 'def456',
            includeStartCommit: true
          }
        }
      ]);
    });

    it('should default includeStartCommit to true when not specified', () => {
      const changeset: ChangesetInput = {
        commitsStartSha: 'abc123',
        commitsEndSha: 'def456'
      };
      const result = buildChanges(changeset);
      expect(result[0].commits.includeStartCommit).toBe(true);
    });

    it('should respect includeStartCommit when set to false', () => {
      const changeset: ChangesetInput = {
        commitsStartSha: 'abc123',
        commitsEndSha: 'def456',
        commitsIncludeStart: false
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([
        {
          commits: {
            startSha: 'abc123',
            endSha: 'def456',
            includeStartCommit: false
          }
        }
      ]);
    });

    it('should respect includeStartCommit when set to true', () => {
      const changeset: ChangesetInput = {
        commitsStartSha: 'abc123',
        commitsEndSha: 'def456',
        commitsIncludeStart: true
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([
        {
          commits: {
            startSha: 'abc123',
            endSha: 'def456',
            includeStartCommit: true
          }
        }
      ]);
    });

    it('should return empty array if only start SHA is provided (requires both)', () => {
      const changeset: ChangesetInput = {
        commitsStartSha: 'abc123'
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([]);
    });

    it('should return empty array if only end SHA is provided', () => {
      const changeset: ChangesetInput = {
        commitsEndSha: 'def456'
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([]);
    });
  });

  describe('tags changeset type (start only)', () => {
    it('should build changes array with start tag only', () => {
      const changeset: ChangesetInput = {
        tagsStart: 'v1.0.0'
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([{ tags: { start: 'v1.0.0' } }]);
    });

    it('should handle tag with prefix', () => {
      const changeset: ChangesetInput = {
        tagsStart: 'release-2025-01'
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([{ tags: { start: 'release-2025-01' } }]);
    });
  });

  describe('tags changeset type (start and end)', () => {
    it('should build changes array with start and end tags', () => {
      const changeset: ChangesetInput = {
        tagsStart: 'v1.0.0',
        tagsEnd: 'v2.0.0'
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([
        {
          tags: {
            start: 'v1.0.0',
            end: 'v2.0.0'
          }
        }
      ]);
    });

    it('should handle semantic version tags', () => {
      const changeset: ChangesetInput = {
        tagsStart: 'v1.2.3',
        tagsEnd: 'v1.2.5'
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([
        {
          tags: {
            start: 'v1.2.3',
            end: 'v1.2.5'
          }
        }
      ]);
    });
  });

  describe('empty changeset', () => {
    it('should return empty array for empty changeset object', () => {
      const changeset: ChangesetInput = {};
      const result = buildChanges(changeset);
      expect(result).toEqual([]);
    });

    it('should return empty array when all fields are undefined', () => {
      const changeset: ChangesetInput = {
        releasesCount: undefined,
        timeRangeStart: undefined,
        timeRangeEnd: undefined,
        commitsCount: undefined,
        commitsSinceSha: undefined,
        commitsShas: undefined,
        commitsStartSha: undefined,
        commitsEndSha: undefined,
        commitsIncludeStart: undefined,
        tagsStart: undefined,
        tagsEnd: undefined
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([]);
    });
  });

  describe('priority order when multiple fields are set', () => {
    it('should prioritize releasesCount over other fields', () => {
      const changeset: ChangesetInput = {
        releasesCount: 3,
        commitsCount: 10,
        tagsStart: 'v1.0.0'
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([{ releases: { count: 3 } }]);
    });

    it('should prioritize timeRange over commits when both are set', () => {
      const changeset: ChangesetInput = {
        timeRangeStart: '2025-01-01T00:00:00Z',
        timeRangeEnd: '2025-01-31T23:59:59Z',
        commitsCount: 10,
        tagsStart: 'v1.0.0'
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([
        {
          timeRange: {
            start: '2025-01-01T00:00:00Z',
            end: '2025-01-31T23:59:59Z'
          }
        }
      ]);
    });

    it('should prioritize commitsCount over commitsSinceSha', () => {
      const changeset: ChangesetInput = {
        commitsCount: 10,
        commitsSinceSha: 'abc123'
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([{ commits: { count: 10 } }]);
    });

    it('should prioritize commitsSinceSha over commitsShas array', () => {
      const changeset: ChangesetInput = {
        commitsSinceSha: 'abc123',
        commitsShas: ['def456', '789ghi']
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([{ commits: { startSha: 'abc123' } }]);
    });

    it('should prioritize commitsShas array over commitsRange', () => {
      const changeset: ChangesetInput = {
        commitsShas: ['abc123'],
        commitsStartSha: 'def456',
        commitsEndSha: '789ghi'
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([{ commits: { shas: ['abc123'] } }]);
    });

    it('should prioritize commitsRange over tags', () => {
      const changeset: ChangesetInput = {
        commitsStartSha: 'abc123',
        commitsEndSha: 'def456',
        tagsStart: 'v1.0.0'
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([
        {
          commits: {
            startSha: 'abc123',
            endSha: 'def456',
            includeStartCommit: true
          }
        }
      ]);
    });
  });

  describe('edge cases with numeric values', () => {
    it('should handle negative releases count (treated as defined)', () => {
      const changeset: ChangesetInput = {
        releasesCount: -1
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([{ releases: { count: -1 } }]);
    });

    it('should handle large releases count', () => {
      const changeset: ChangesetInput = {
        releasesCount: 999999
      };
      const result = buildChanges(changeset);
      expect(result).toEqual([{ releases: { count: 999999 } }]);
    });
  });
});
