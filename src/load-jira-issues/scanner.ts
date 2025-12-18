// src/load-jira-issues/scanner.ts
import type { Commit } from './types';

/**
 * Build regex pattern for matching JIRA issue keys
 */
export function buildIssuePattern(prefixes: string[]): RegExp {
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
export function extractIssues(message: string, pattern: RegExp): string[] {
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
export function scanCommits(
  commits: Commit[],
  prefixes: string[]
): Map<string, string[]> {
  const issueMap = new Map<string, string[]>();

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
