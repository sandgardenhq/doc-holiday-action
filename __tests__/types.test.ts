// __tests__/types.test.ts
import {
  ActionInputs,
  ChangesetInput,
  WorkStateRequest,
  WorkStateResponse,
  WorkStateEntry,
} from '../src/types';

describe('types', () => {
  it('ActionInputs should not have title, eventType, sourceConnection, or comments', () => {
    const inputs: ActionInputs = {
      apiToken: 'token',
      body: 'test',
    };
    expect(inputs).not.toHaveProperty('title');
    expect(inputs).not.toHaveProperty('eventType');
    expect(inputs).not.toHaveProperty('sourceConnection');
    expect(inputs).not.toHaveProperty('comments');
    expect(inputs).not.toHaveProperty('publications');
  });

  it('ActionInputs should have publication (singular) and stage', () => {
    const inputs: ActionInputs = {
      apiToken: 'token',
      body: 'test',
      publication: 'my-pub',
      stage: true,
    };
    expect(inputs.publication).toBe('my-pub');
    expect(inputs.stage).toBe(true);
  });

  it('WorkStateRequest should have flat structure', () => {
    const request: WorkStateRequest = {
      body: 'test',
      publication: 'my-pub',
      stage: true,
      labels: ['a'],
      relevantLinks: ['https://example.com'],
      changes: [{ commits: { count: 5 } }],
    };
    expect(request.body).toBe('test');
    expect(request).not.toHaveProperty('docRequest');
  });

  it('WorkStateResponse should have all fields', () => {
    const response: WorkStateResponse = {
      id: 'ws-123',
      jobId: 'job-123',
      outId: 'out-123',
      orgId: 'org-123',
      status: 'running',
      publicationId: 'pub-123',
      connectionId: 'conn-123',
      publicationName: 'my-pub',
      triggerType: 'api',
      operationType: 'docs-update',
      createdAt: '2025-10-29T15:00:00Z',
      updatedAt: '2025-10-29T15:01:00Z',
      branch: 'doc-holiday/work-states',
      title: 'Update docs',
      summary: 'Updated docs',
      outputUrl: 'output-url',
      staged: true,
      excludedFiles: ['README.md'],
      entries: [
        {
          id: 'entry-1',
          createdAt: '2025-10-29T15:00:00Z',
          status: 'requested',
          message: 'Created',
        },
      ],
    };
    expect(response.id).toBe('ws-123');
    expect(response.entries).toHaveLength(1);
  });
});
