"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildChangesetMetadata = buildChangesetMetadata;
exports.buildOutputArtifact = buildOutputArtifact;
exports.writeArtifact = writeArtifact;
exports.buildIssueLinksString = buildIssueLinksString;
exports.buildIssueKeysString = buildIssueKeysString;
// src/load-jira-issues/output.ts
const fs = __importStar(require("fs"));
const jira_1 = require("./jira");
/**
 * Determine changeset type and metadata from input
 */
function buildChangesetMetadata(changeset) {
    if (changeset.releasesCount !== undefined) {
        return { type: 'releases', count: changeset.releasesCount };
    }
    if (changeset.timeRangeStart && changeset.timeRangeEnd) {
        return { type: 'time-range', start: changeset.timeRangeStart, end: changeset.timeRangeEnd };
    }
    if (changeset.commitsCount !== undefined) {
        return { type: 'commits-count', count: changeset.commitsCount };
    }
    if (changeset.commitsSinceSha) {
        return { type: 'commits-since', start: changeset.commitsSinceSha };
    }
    if (changeset.commitsShas && changeset.commitsShas.length > 0) {
        return { type: 'commits-specific', shas: changeset.commitsShas };
    }
    if (changeset.commitsStartSha && changeset.commitsEndSha) {
        return { type: 'commits-range', start: changeset.commitsStartSha, end: changeset.commitsEndSha };
    }
    if (changeset.tagsStart) {
        return { type: 'tags', start: changeset.tagsStart, end: changeset.tagsEnd };
    }
    return { type: 'unknown' };
}
/**
 * Build output artifact from issue map
 */
function buildOutputArtifact(issueMap, jiraBaseUrl, repository, changeset, totalCommits) {
    const issues = Array.from(issueMap.entries())
        .map(([key, commits]) => ({
        key,
        url: (0, jira_1.buildIssueBrowseUrl)(jiraBaseUrl, key),
        commits,
    }))
        .sort((a, b) => a.key.localeCompare(b.key));
    return {
        metadata: {
            generatedAt: new Date().toISOString(),
            jiraBaseUrl,
            repository,
            changeset: buildChangesetMetadata(changeset),
            totalIssues: issues.length,
            totalCommits,
        },
        issues,
    };
}
/**
 * Write artifact to JSON file
 */
function writeArtifact(artifact, outputPath) {
    const json = JSON.stringify(artifact, null, 2);
    fs.writeFileSync(outputPath, json, 'utf-8');
}
/**
 * Build comma-separated issue links string
 */
function buildIssueLinksString(artifact) {
    return artifact.issues.map(issue => issue.url).join(',');
}
/**
 * Build comma-separated issue keys string
 */
function buildIssueKeysString(artifact) {
    return artifact.issues.map(issue => issue.key).join(',');
}
//# sourceMappingURL=output.js.map