"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isJiraCloud = isJiraCloud;
exports.createJiraClient = createJiraClient;
exports.fetchProjectKeys = fetchProjectKeys;
exports.buildIssueBrowseUrl = buildIssueBrowseUrl;
// src/load-jira-issues/jira.ts
const jira_js_1 = require("jira.js");
/**
 * Check if the JIRA URL is a Cloud instance
 */
function isJiraCloud(baseUrl) {
    return baseUrl.includes('.atlassian.net');
}
/**
 * Create appropriate JIRA client based on deployment type
 */
function createJiraClient(baseUrl, token, email) {
    const normalizedUrl = baseUrl.replace(/\/$/, '');
    if (isJiraCloud(normalizedUrl)) {
        if (!email) {
            throw new Error('jira-user-email is required for JIRA Cloud authentication');
        }
        return new jira_js_1.Version3Client({
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
    return new jira_js_1.Version2Client({
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
async function fetchProjectKeys(baseUrl, token, email, allowedKeys) {
    const client = createJiraClient(baseUrl, token, email);
    try {
        const response = await client.projects.searchProjects({});
        const projects = response.values || [];
        let keys = projects.map((p) => p.key).filter((k) => k !== undefined);
        // Filter by allowed keys if specified
        if (allowedKeys && allowedKeys.length > 0) {
            const allowedSet = new Set(allowedKeys.map(k => k.toUpperCase()));
            keys = keys.filter((k) => allowedSet.has(k.toUpperCase()));
        }
        return keys;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`JIRA API error: ${message}`);
    }
}
/**
 * Build JIRA browse URL for an issue
 */
function buildIssueBrowseUrl(baseUrl, issueKey) {
    const normalizedUrl = baseUrl.replace(/\/$/, '');
    return `${normalizedUrl}/browse/${issueKey}`;
}
//# sourceMappingURL=jira.js.map