// src/index.ts
import * as core from '@actions/core';
import { parseInputs } from './inputs';
import { buildChanges } from './changes';
import { createWorkState } from './api';
import { WorkStateRequest } from './types';

export async function run(): Promise<void> {
  try {
    core.info('Starting doc.holiday GitHub Action...');

    const inputs = parseInputs();
    core.info('Inputs parsed successfully');

    const request: WorkStateRequest = {
      body: inputs.body,
    };

    if (inputs.publication) {
      request.publication = inputs.publication;
    }
    if (inputs.stage !== undefined) {
      request.stage = inputs.stage;
    }
    if (inputs.labels) {
      request.labels = inputs.labels;
    }
    if (inputs.relevantLinks) {
      request.relevantLinks = inputs.relevantLinks;
    }

    if (inputs.changeset) {
      const changes = buildChanges(inputs.changeset);
      if (changes.length > 0) {
        request.changes = changes;
        core.info('Changeset specification added to request');
      }
    }

    core.info('Creating work state...');
    const response = await createWorkState(inputs.apiToken, request);

    // Set all outputs
    core.setOutput('id', response.id);
    core.setOutput('job-id', response.jobId);
    core.setOutput('out-id', response.outId);
    core.setOutput('org-id', response.orgId);
    core.setOutput('status', response.status);
    core.setOutput('publication-id', response.publicationId);
    core.setOutput('connection-id', response.connectionId);
    core.setOutput('publication-name', response.publicationName);
    core.setOutput('trigger-type', response.triggerType);
    core.setOutput('operation-type', response.operationType);
    core.setOutput('created-at', response.createdAt);
    core.setOutput('updated-at', response.updatedAt);
    core.setOutput('branch', response.branch);
    core.setOutput('title', response.title);
    core.setOutput('summary', response.summary);
    core.setOutput('output-url', response.outputUrl);
    core.setOutput('staged', String(response.staged));
    core.setOutput('excluded-files', JSON.stringify(response.excludedFiles));
    core.setOutput('entries', JSON.stringify(response.entries));

    core.info('Action completed successfully!');
    core.info(`Work State ID: ${response.id}`);
    core.info(`Status: ${response.status}`);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unknown error occurred');
    }
  }
}

if (process.env.NODE_ENV !== 'test') {
  run();
}
