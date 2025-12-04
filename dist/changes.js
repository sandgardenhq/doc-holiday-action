"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildChanges = buildChanges;
/**
 * Build changes array for doc.holiday API from changeset inputs
 */
function buildChanges(changeset) {
    // Releases count
    if (changeset.releasesCount !== undefined) {
        return [{ releases: { count: changeset.releasesCount } }];
    }
    // Time range
    if (changeset.timeRangeStart && changeset.timeRangeEnd) {
        return [
            {
                timeRange: {
                    start: changeset.timeRangeStart,
                    end: changeset.timeRangeEnd,
                },
            },
        ];
    }
    // Commits count
    if (changeset.commitsCount !== undefined) {
        return [{ commits: { count: changeset.commitsCount } }];
    }
    // Commits since SHA
    if (changeset.commitsSinceSha) {
        return [{ commits: { startSha: changeset.commitsSinceSha } }];
    }
    // Specific commits (SHAs)
    if (changeset.commitsShas && changeset.commitsShas.length > 0) {
        return [{ commits: { shas: changeset.commitsShas } }];
    }
    // Commit range
    if (changeset.commitsStartSha && changeset.commitsEndSha) {
        return [
            {
                commits: {
                    startSha: changeset.commitsStartSha,
                    endSha: changeset.commitsEndSha,
                    includeStartCommit: changeset.commitsIncludeStart ?? true,
                },
            },
        ];
    }
    // Tags
    if (changeset.tagsStart) {
        const tagsChange = { tags: { start: changeset.tagsStart } };
        if (changeset.tagsEnd) {
            tagsChange.tags.end = changeset.tagsEnd;
        }
        return [tagsChange];
    }
    // No valid changeset
    return [];
}
//# sourceMappingURL=changes.js.map