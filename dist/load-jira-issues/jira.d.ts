import { Version2Client, Version3Client } from 'jira.js';
/**
 * Check if the JIRA URL is a Cloud instance
 */
export declare function isJiraCloud(baseUrl: string): boolean;
/**
 * Create appropriate JIRA client based on deployment type
 */
export declare function createJiraClient(baseUrl: string, token: string, email?: string): Version2Client | Version3Client;
/**
 * Fetch project keys from JIRA API
 */
export declare function fetchProjectKeys(baseUrl: string, token: string, email?: string, allowedKeys?: string[]): Promise<string[]>;
/**
 * Build JIRA browse URL for an issue
 */
export declare function buildIssueBrowseUrl(baseUrl: string, issueKey: string): string;
//# sourceMappingURL=jira.d.ts.map