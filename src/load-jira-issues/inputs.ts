// src/load-jira-issues/inputs.ts
import * as core from '@actions/core';
import type { JiraActionInputs, ChangesetInput } from './types';
import { isJiraCloud } from './jira';

/**
 * Parse and validate all action inputs
 */
export function parseInputs(): JiraActionInputs {
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
  if (isJiraCloud(jiraBaseUrl) && !jiraUserEmail) {
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
function parseChangesetInputs(): ChangesetInput | undefined {
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
    throw new Error(
      `Multiple changeset types specified: ${specifiedTypes.join(', ')}. Only one type is allowed.`
    );
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
