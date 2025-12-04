// src/index.ts
import * as core from '@actions/core';
import { parseInputs } from './inputs';
import { getSmartDefaults, inferSourceConnection } from './github-context';
import { buildChanges } from './changes';
import { createJob, constructJobUrl } from './api';
import { DocHolidayRequest } from './types';

export async function run(): Promise<void> {
  try {
    core.info('Starting doc.holiday GitHub Action...');

    // Step 1: Parse inputs
    const inputs = parseInputs();
    core.info('Inputs parsed and validated successfully');

    // Step 2: Determine title, body, and eventType
    let title = inputs.title;
    let body = inputs.body;
    let eventType = inputs.eventType;

    if (inputs.eventType === 'release' || inputs.eventType === 'merge') {
      core.info(`Smart mode: ${inputs.eventType}`);
      const smartDefaults = getSmartDefaults(inputs.eventType);
      title = smartDefaults.title;
      body = smartDefaults.body;
      eventType = smartDefaults.eventType;
    }

    if (!title || !body) {
      throw new Error('Title and body are required');
    }

    // Step 3: Infer source connection if not provided
    const sourceConnection = inputs.sourceConnection || inferSourceConnection();
    core.info(`Source connection: ${sourceConnection}`);

    // Step 4: Build changes array if changeset inputs provided
    let changes: any[] | undefined;
    if (inputs.changeset) {
      const builtChanges = buildChanges(inputs.changeset);
      if (builtChanges.length > 0) {
        changes = builtChanges;
        core.info('Changeset specification added to request');
        core.warning('Changeset inputs override any commits specified in body');
      }
    }

    // Step 5: Build API request
    const request: DocHolidayRequest = {
      docRequest: {
        title,
        body,
        sourceConnection,
      },
    };

    // Add optional fields
    if (inputs.publications) {
      request.docRequest.publications = inputs.publications;
    }
    if (inputs.labels) {
      request.docRequest.labels = inputs.labels;
    }
    if (inputs.comments) {
      request.docRequest.comments = inputs.comments;
    }
    if (inputs.relevantLinks) {
      request.docRequest.relevantLinks = inputs.relevantLinks;
    }
    if (eventType && eventType !== 'custom') {
      request.docRequest.eventType = eventType;
    }
    if (changes) {
      request.docRequest.changes = changes;
    }

    core.info('API request constructed');

    // Step 6: Create job
    const response = await createJob(inputs.apiToken, request);

    // Step 7: Set outputs
    const jobUrl = constructJobUrl(response.id);

    core.setOutput('job-id', response.id);
    core.setOutput('job-state', response.state);
    core.setOutput('job-url', jobUrl);

    core.info('✓ Action completed successfully!');
    core.info(`Job ID: ${response.id}`);
    core.info(`Job State: ${response.state}`);
    core.info(`View job: ${jobUrl}`);
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
