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
exports.parseInputs = parseInputs;
// src/load-jira-issues/inputs.ts
const core = __importStar(require("@actions/core"));
const jira_1 = require("./jira");
/**
 * Parse and validate all action inputs
 */
function parseInputs() {
    const jiraBaseUrl = core.getInput('jira-base-url', { required: true });
    const jiraApiToken = core.getInput('jira-api-token', { required: true });
    const jiraUserEmail = core.getInput('jira-user-email') || undefined;
    const projectKeysInput = core.getInput('project-keys');
    const outputFile = core.getInput('output-file') || 'jira-issues.json';
    // Parse comma-separated project keys
    const projectKeys = projectKeysInput
        ? projectKeysInput.split(',').map(k => k.trim()).filter(Boolean)
        : undefined;
    // Parse changeset inputs
    const changeset = parseChangesetInputs();
    // Validate changeset is specified
    if (!changeset) {
        throw new Error('No changeset specified. Please provide one of: releases-count, tags-start, commits-count, etc.');
    }
    // Validate JIRA Cloud requires email
    if ((0, jira_1.isJiraCloud)(jiraBaseUrl) && !jiraUserEmail) {
        throw new Error('jira-user-email is required for JIRA Cloud authentication');
    }
    return {
        jiraBaseUrl,
        jiraApiToken,
        jiraUserEmail,
        projectKeys,
        outputFile,
        changeset,
    };
}
/**
 * Parse changeset specification inputs
 */
function parseChangesetInputs() {
    const releasesCount = core.getInput('releases-count');
    const timeRangeStart = core.getInput('time-range-start');
    const timeRangeEnd = core.getInput('time-range-end');
    const commitsCount = core.getInput('commits-count');
    const commitsSinceSha = core.getInput('commits-since-sha');
    const commitsShas = core.getInput('commits-shas');
    const commitsStartSha = core.getInput('commits-start-sha');
    const commitsEndSha = core.getInput('commits-end-sha');
    const commitsIncludeStart = core.getInput('commits-include-start');
    const tagsStart = core.getInput('tags-start');
    const tagsEnd = core.getInput('tags-end');
    // Check if any changeset inputs are provided
    const hasAnyChangesetInput = [
        releasesCount,
        timeRangeStart,
        commitsCount,
        commitsSinceSha,
        commitsShas,
        commitsStartSha,
        tagsStart,
    ].some(Boolean);
    if (!hasAnyChangesetInput) {
        return undefined;
    }
    // Validate mutual exclusivity
    const specifiedTypes = [
        releasesCount && 'releases-count',
        timeRangeStart && 'time-range',
        commitsCount && 'commits-count',
        commitsSinceSha && 'commits-since-sha',
        commitsShas && 'commits-shas',
        commitsStartSha && 'commits-range',
        tagsStart && 'tags',
    ].filter(Boolean);
    if (specifiedTypes.length > 1) {
        throw new Error(`Multiple changeset types specified: ${specifiedTypes.join(', ')}. Only one type is allowed.`);
    }
    return {
        releasesCount: releasesCount ? parseInt(releasesCount, 10) : undefined,
        timeRangeStart: timeRangeStart || undefined,
        timeRangeEnd: timeRangeEnd || undefined,
        commitsCount: commitsCount ? parseInt(commitsCount, 10) : undefined,
        commitsSinceSha: commitsSinceSha || undefined,
        commitsShas: commitsShas
            ? commitsShas.split(',').map(s => s.trim()).filter(Boolean)
            : undefined,
        commitsStartSha: commitsStartSha || undefined,
        commitsEndSha: commitsEndSha || undefined,
        commitsIncludeStart: commitsIncludeStart ? commitsIncludeStart === 'true' : undefined,
        tagsStart: tagsStart || undefined,
        tagsEnd: tagsEnd || undefined,
    };
}
//# sourceMappingURL=inputs.js.map