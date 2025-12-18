import type { Commit } from './types';
/**
 * Build regex pattern for matching JIRA issue keys
 */
export declare function buildIssuePattern(prefixes: string[]): RegExp;
/**
 * Extract JIRA issue keys from a commit message
 */
export declare function extractIssues(message: string, pattern: RegExp): string[];
/**
 * Scan commits and build map of issue key to referencing commit SHAs
 */
export declare function scanCommits(commits: Commit[], prefixes: string[]): Map<string, string[]>;
//# sourceMappingURL=scanner.d.ts.map