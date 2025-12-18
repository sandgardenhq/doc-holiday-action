// src/load-jira-issues/jira.ts
import { Version2Client, Version3Client } from 'jira.js';

/**
 * Check if the JIRA URL is a Cloud instance
 */
export function isJiraCloud(baseUrl: string): boolean {
  return baseUrl.includes('.atlassian.net');
}

/**
 * Create appropriate JIRA client based on deployment type
 */
export function createJiraClient(
  baseUrl: string,
  token: string,
  email?: string
): Version2Client | Version3Client {
  const normalizedUrl = baseUrl.replace(/\/$/, '');

  if (isJiraCloud(normalizedUrl)) {
    if (!email) {
      throw new Error('jira-user-email is required for JIRA Cloud authentication');
    }
    return new Version3Client({
      host: normalizedUrl,
      authentication: {
        basic: {
          email,
          apiToken: token,
        },
      },
    });
  }

  // Data Center / Server uses OAuth2 with access token
  return new Version2Client({
    host: normalizedUrl,
    authentication: {
      oauth2: {
        accessToken: token,
      },
    },
  });
}

/**
 * Fetch project keys from JIRA API
 */
export async function fetchProjectKeys(
  baseUrl: string,
  token: string,
  email?: string,
  allowedKeys?: string[]
): Promise<string[]> {
  const client = createJiraClient(baseUrl, token, email);

  try {
    const response: any = await (client.projects as any).searchProjects({});
    const projects = response.values || [];
    let keys = projects.map((p: any) => p.key).filter((k: any): k is string => k !== undefined);

    // Filter by allowed keys if specified
    if (allowedKeys && allowedKeys.length > 0) {
      const allowedSet = new Set(allowedKeys.map(k => k.toUpperCase()));
      keys = keys.filter((k: string) => allowedSet.has(k.toUpperCase()));
    }

    return keys;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`JIRA API error: ${message}`);
  }
}

/**
 * Build JIRA browse URL for an issue
 */
export function buildIssueBrowseUrl(baseUrl: string, issueKey: string): string {
  const normalizedUrl = baseUrl.replace(/\/$/, '');
  return `${normalizedUrl}/browse/${issueKey}`;
}
