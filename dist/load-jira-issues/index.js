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
exports.run = run;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const inputs_1 = require("./inputs");
const jira_1 = require("./jira");
const git_1 = require("./git");
const scanner_1 = require("./scanner");
const output_1 = require("./output");
/**
 * Main entry point for the load-jira-issues action
 */
async function run() {
    try {
        core.info('Starting JIRA issue extraction...');
        // Step 1: Parse inputs
        const inputs = (0, inputs_1.parseInputs)();
        core.info(`JIRA base URL: ${inputs.jiraBaseUrl}`);
        // Step 2: Fetch JIRA project keys
        core.info('Fetching JIRA project keys...');
        const projectKeys = await (0, jira_1.fetchProjectKeys)(inputs.jiraBaseUrl, inputs.jiraApiToken, inputs.jiraUserEmail, inputs.projectKeys);
        core.info(`Found ${projectKeys.length} project keys: ${projectKeys.join(', ')}`);
        // Step 3: Fetch commits based on changeset
        core.info('Fetching commits from Git...');
        const commits = await (0, git_1.fetchCommits)(inputs.changeset);
        core.info(`Found ${commits.length} commits`);
        // Step 4: Scan commits for issue references
        core.info('Scanning commits for JIRA issues...');
        const issueMap = (0, scanner_1.scanCommits)(commits, projectKeys);
        core.info(`Found ${issueMap.size} unique issues`);
        // Step 5: Build and write output artifact
        const repository = `${github.context.repo.owner}/${github.context.repo.repo}`;
        const artifact = (0, output_1.buildOutputArtifact)(issueMap, inputs.jiraBaseUrl, repository, inputs.changeset, commits.length);
        (0, output_1.writeArtifact)(artifact, inputs.outputFile);
        core.info(`Output written to ${inputs.outputFile}`);
        // Step 6: Set action outputs
        const issueLinks = (0, output_1.buildIssueLinksString)(artifact);
        const issueKeys = (0, output_1.buildIssueKeysString)(artifact);
        core.setOutput('issue-links', issueLinks);
        core.setOutput('issue-keys', issueKeys);
        core.setOutput('issue-count', artifact.metadata.totalIssues.toString());
        core.info('✓ Action completed successfully!');
        core.info(`Found ${artifact.metadata.totalIssues} JIRA issues across ${artifact.metadata.totalCommits} commits`);
    }
    catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
        else {
            core.setFailed('An unknown error occurred');
        }
    }
}
// Only run if not in test environment
if (process.env.NODE_ENV !== 'test') {
    run();
}
//# sourceMappingURL=index.js.map