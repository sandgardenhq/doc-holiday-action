"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildIssuePattern = buildIssuePattern;
exports.extractIssues = extractIssues;
exports.scanCommits = scanCommits;
/**
 * Build regex pattern for matching JIRA issue keys
 */
function buildIssuePattern(prefixes) {
    if (prefixes.length === 0) {
        return /(?!)/; // Pattern that matches nothing
    }
    const prefixGroup = prefixes.join('|');
    // Note: Not using 'g' flag to avoid stateful lastIndex issues with test()
    // extractIssues() will use matchAll() or recreate with 'g' flag
    return new RegExp(`(${prefixGroup})-\\d+`, 'i');
}
/**
 * Extract JIRA issue keys from a commit message
 */
function extractIssues(message, pattern) {
    // Create a global version of the pattern for matching all occurrences
    const globalPattern = new RegExp(pattern.source, 'gi');
    const matches = message.match(globalPattern);
    if (!matches) {
        return [];
    }
    // Normalize to uppercase and deduplicate
    const uniqueIssues = [...new Set(matches.map(m => m.toUpperCase()))];
    return uniqueIssues;
}
/**
 * Scan commits and build map of issue key to referencing commit SHAs
 */
function scanCommits(commits, prefixes) {
    const issueMap = new Map();
    if (prefixes.length === 0) {
        return issueMap;
    }
    const pattern = buildIssuePattern(prefixes);
    for (const commit of commits) {
        const issues = extractIssues(commit.message, pattern);
        for (const issue of issues) {
            const existing = issueMap.get(issue) || [];
            existing.push(commit.sha);
            issueMap.set(issue, existing);
        }
    }
    return issueMap;
}
//# sourceMappingURL=scanner.js.map