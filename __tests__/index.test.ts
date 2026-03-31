// __tests__/index.test.ts
import * as core from '@actions/core';
import { ActionInputs, WorkStateRequest, WorkStateResponse } from '../src/types';

jest.mock('@actions/core');
jest.mock('../src/inputs');
jest.mock('../src/changes');
jest.mock('../src/api');

import { parseInputs } from '../src/inputs';
import { buildChanges } from '../src/changes';
import { createWorkState } from '../src/api';
import { run } from '../src/index';

const mockCore = core as jest.Mocked<typeof core>;
const mockParseInputs = parseInputs as jest.MockedFunction<typeof parseInputs>;
const mockBuildChanges = buildChanges as jest.MockedFunction<typeof buildChanges>;
const mockCreateWorkState = createWorkState as jest.MockedFunction<typeof createWorkState>;

const mockResponse: WorkStateResponse = {
  id: 'ws-0000000000001234',
  jobId: 'job-0000000000007118',
  outId: 'out-000000000000abcd',
  orgId: 'org-49440c77dc13f38d',
  status: 'running',
  publicationId: 'pub-0000000000009999',
  connectionId: 'conn-0000000000000001',
  publicationName: 'my-publication',
  triggerType: 'api',
  operationType: 'docs-update',
  createdAt: '2025-10-29T15:00:00Z',
  updatedAt: '2025-10-29T15:01:00Z',
  branch: 'doc-holiday/work-states-api',
  title: 'Update the API docs',
  summary: 'Replaces Jobs API references.',
  outputUrl: 'output-url-123',
  staged: true,
  excludedFiles: ['README.md'],
  entries: [
    {
      id: 'entry-0001',
      createdAt: '2025-10-29T15:00:00Z',
      status: 'requested',
      message: 'Work state created',
    },
  ],
};

describe('index.ts - main orchestration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic flow', () => {
    it('should create work state with minimal inputs', async () => {
      mockParseInputs.mockReturnValue({
        apiToken: 'test-token',
        body: 'Generate docs',
      });
      mockCreateWorkState.mockResolvedValue(mockResponse);

      await run();

      expect(mockCreateWorkState).toHaveBeenCalledWith('test-token', {
        body: 'Generate docs',
      });

      expect(mockCore.setOutput).toHaveBeenCalledWith('id', 'ws-0000000000001234');
      expect(mockCore.setOutput).toHaveBeenCalledWith('job-id', 'job-0000000000007118');
      expect(mockCore.setOutput).toHaveBeenCalledWith('out-id', 'out-000000000000abcd');
      expect(mockCore.setOutput).toHaveBeenCalledWith('org-id', 'org-49440c77dc13f38d');
      expect(mockCore.setOutput).toHaveBeenCalledWith('status', 'running');
      expect(mockCore.setOutput).toHaveBeenCalledWith('publication-id', 'pub-0000000000009999');
      expect(mockCore.setOutput).toHaveBeenCalledWith('connection-id', 'conn-0000000000000001');
      expect(mockCore.setOutput).toHaveBeenCalledWith('publication-name', 'my-publication');
      expect(mockCore.setOutput).toHaveBeenCalledWith('trigger-type', 'api');
      expect(mockCore.setOutput).toHaveBeenCalledWith('operation-type', 'docs-update');
      expect(mockCore.setOutput).toHaveBeenCalledWith('created-at', '2025-10-29T15:00:00Z');
      expect(mockCore.setOutput).toHaveBeenCalledWith('updated-at', '2025-10-29T15:01:00Z');
      expect(mockCore.setOutput).toHaveBeenCalledWith('branch', 'doc-holiday/work-states-api');
      expect(mockCore.setOutput).toHaveBeenCalledWith('title', 'Update the API docs');
      expect(mockCore.setOutput).toHaveBeenCalledWith('summary', 'Replaces Jobs API references.');
      expect(mockCore.setOutput).toHaveBeenCalledWith('output-url', 'output-url-123');
      expect(mockCore.setOutput).toHaveBeenCalledWith('staged', 'true');
      expect(mockCore.setOutput).toHaveBeenCalledWith('excluded-files', JSON.stringify(['README.md']));
      expect(mockCore.setOutput).toHaveBeenCalledWith('entries', JSON.stringify(mockResponse.entries));

      expect(mockCore.setFailed).not.toHaveBeenCalled();
    });

    it('should include all optional fields in request', async () => {
      mockParseInputs.mockReturnValue({
        apiToken: 'test-token',
        body: 'Generate docs',
        publication: 'my-pub',
        stage: true,
        labels: ['docs', 'api'],
        relevantLinks: ['https://example.com'],
      });
      mockCreateWorkState.mockResolvedValue(mockResponse);

      await run();

      expect(mockCreateWorkState).toHaveBeenCalledWith('test-token', {
        body: 'Generate docs',
        publication: 'my-pub',
        stage: true,
        labels: ['docs', 'api'],
        relevantLinks: ['https://example.com'],
      });
    });
  });

  describe('changeset handling', () => {
    it('should include changes when changeset provided', async () => {
      const mockChanges = [{ commits: { count: 5 } }];
      mockParseInputs.mockReturnValue({
        apiToken: 'test-token',
        body: 'Generate docs',
        changeset: { commitsCount: 5 },
      });
      mockBuildChanges.mockReturnValue(mockChanges);
      mockCreateWorkState.mockResolvedValue(mockResponse);

      await run();

      expect(mockBuildChanges).toHaveBeenCalledWith({ commitsCount: 5 });
      expect(mockCreateWorkState).toHaveBeenCalledWith('test-token', {
        body: 'Generate docs',
        changes: mockChanges,
      });
    });

    it('should not include changes when buildChanges returns empty', async () => {
      mockParseInputs.mockReturnValue({
        apiToken: 'test-token',
        body: 'Generate docs',
        changeset: { commitsCount: 5 },
      });
      mockBuildChanges.mockReturnValue([]);
      mockCreateWorkState.mockResolvedValue(mockResponse);

      await run();

      const callArgs = mockCreateWorkState.mock.calls[0][1];
      expect(callArgs).not.toHaveProperty('changes');
    });

    it('should not call buildChanges when no changeset', async () => {
      mockParseInputs.mockReturnValue({
        apiToken: 'test-token',
        body: 'Generate docs',
      });
      mockCreateWorkState.mockResolvedValue(mockResponse);

      await run();

      expect(mockBuildChanges).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should call setFailed when parseInputs throws', async () => {
      mockParseInputs.mockImplementation(() => { throw new Error('Invalid inputs'); });

      await run();

      expect(mockCore.setFailed).toHaveBeenCalledWith('Invalid inputs');
      expect(mockCreateWorkState).not.toHaveBeenCalled();
    });

    it('should call setFailed when createWorkState throws', async () => {
      mockParseInputs.mockReturnValue({
        apiToken: 'test-token',
        body: 'Generate docs',
      });
      mockCreateWorkState.mockRejectedValue(new Error('API request failed'));

      await run();

      expect(mockCore.setFailed).toHaveBeenCalledWith('API request failed');
    });

    it('should handle non-Error exceptions', async () => {
      mockParseInputs.mockReturnValue({
        apiToken: 'test-token',
        body: 'Generate docs',
      });
      mockCreateWorkState.mockRejectedValue('string error');

      await run();

      expect(mockCore.setFailed).toHaveBeenCalledWith('An unknown error occurred');
    });
  });
});
