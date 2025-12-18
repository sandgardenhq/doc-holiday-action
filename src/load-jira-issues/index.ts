import * as core from '@actions/core';
import * as github from '@actions/github';
import { parseInputs } from './inputs';
import { fetchProjectKeys } from './jira';
import { fetchCommits } from './git';
import { scanCommits } from './scanner';
import { buildOutputArtifact, writeArtifact, buildIssueLinksString, buildIssueKeysString } from './output';

/**
 * Main entry point for the load-jira-issues action
 */
export async function run(): Promise<void> {
  try {
    core.info('Starting JIRA issue extraction...');

    // Step 1: Parse inputs
    const inputs = parseInputs();
    core.info(`JIRA base URL: ${inputs.jiraBaseUrl}`);

    // Step 2: Fetch JIRA project keys
    core.info('Fetching JIRA project keys...');
    const projectKeys = await fetchProjectKeys(
      inputs.jiraBaseUrl,
      inputs.jiraApiToken,
      inputs.jiraUserEmail,
      inputs.projectKeys
    );
    core.info(`Found ${projectKeys.length} project keys: ${projectKeys.join(', ')}`);

    // Step 3: Fetch commits based on changeset
    core.info('Fetching commits from Git...');
    const commits = await fetchCommits(inputs.changeset!);
    core.info(`Found ${commits.length} commits`);

    // Step 4: Scan commits for issue references
    core.info('Scanning commits for JIRA issues...');
    const issueMap = scanCommits(commits, projectKeys);
    core.info(`Found ${issueMap.size} unique issues`);

    // Step 5: Build and write output artifact
    const repository = `${github.context.repo.owner}/${github.context.repo.repo}`;
    const artifact = buildOutputArtifact(
      issueMap,
      inputs.jiraBaseUrl,
      repository,
      inputs.changeset!,
      commits.length
    );

    writeArtifact(artifact, inputs.outputFile);
    core.info(`Output written to ${inputs.outputFile}`);

    // Step 6: Set action outputs
    const issueLinks = buildIssueLinksString(artifact);
    const issueKeys = buildIssueKeysString(artifact);

    core.setOutput('issue-links', issueLinks);
    core.setOutput('issue-keys', issueKeys);
    core.setOutput('issue-count', artifact.metadata.totalIssues.toString());

    core.info('✓ Action completed successfully!');
    core.info(`Found ${artifact.metadata.totalIssues} JIRA issues across ${artifact.metadata.totalCommits} commits`);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unknown error occurred');
    }
  }
}

// Only run if not in test environment
if (process.env.NODE_ENV !== 'test') {
  run();
}
