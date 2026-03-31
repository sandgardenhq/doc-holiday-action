// src/inputs.ts
import * as core from '@actions/core';
import { ActionInputs, ChangesetInput } from './types';

export function parseInputs(): ActionInputs {
  const apiToken = core.getInput('api-token', { required: true });
  const body = core.getInput('body');
  const publicationInput = core.getInput('publication');
  const stageInput = core.getInput('stage');
  const labelsInput = core.getInput('labels');
  const relevantLinksInput = core.getInput('relevant-links');

  if (!body) {
    throw new Error('body is required');
  }

  const labels = labelsInput
    ? labelsInput.split(',').map(l => l.trim()).filter(Boolean)
    : undefined;

  const relevantLinks = relevantLinksInput
    ? relevantLinksInput.split(',').map(l => l.trim()).filter(Boolean)
    : undefined;

  const changeset = parseChangesetInputs();

  return {
    apiToken,
    body,
    publication: publicationInput || undefined,
    stage: stageInput ? stageInput === 'true' : undefined,
    labels,
    relevantLinks,
    changeset,
  };
}

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
