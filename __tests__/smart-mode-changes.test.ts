// __tests__/smart-mode-changes.test.ts
import * as core from '@actions/core';
import { ActionInputs, SmartDefaults, DocHolidayResponse } from '../src/types';

// Mock all modules BEFORE importing them
jest.mock('@actions/core');
jest.mock('../src/inputs');
jest.mock('../src/github-context');
jest.mock('../src/changes');
jest.mock('../src/api');

// Import after mocking
import { parseInputs } from '../src/inputs';
import { getSmartDefaults, inferSourceConnection } from '../src/github-context';
import { buildChanges } from '../src/changes';
import { createJob, constructJobUrl } from '../src/api';
import { run } from '../src/index';

// Create typed mocks
const mockCore = core as jest.Mocked<typeof core>;
const mockParseInputs = parseInputs as jest.MockedFunction<typeof parseInputs>;
const mockGetSmartDefaults = getSmartDefaults as jest.MockedFunction<typeof getSmartDefaults>;
const mockInferSourceConnection = inferSourceConnection as jest.MockedFunction<typeof inferSourceConnection>;
const mockBuildChanges = buildChanges as jest.MockedFunction<typeof buildChanges>;
const mockCreateJob = createJob as jest.MockedFunction<typeof createJob>;
const mockConstructJobUrl = constructJobUrl as jest.MockedFunction<typeof constructJobUrl>;

describe('Smart Mode Changes Bug', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('BUG: release mode does not provide changes array to API - doc.holiday must infer commits from body', async () => {
    // Arrange
    const mockInputs: ActionInputs = {
      apiToken: 'test-token',
      eventType: 'release',
    };

    // Current implementation: getSmartDefaults does NOT return changes
    const mockSmartDefaults: SmartDefaults = {
      title: 'Release notes for v1.0.0',
      body: 'Release body content',
      eventType: 'release',
      // NO changes field - that's the bug!
    };

    const mockResponse: DocHolidayResponse = {
      id: 'job-123',
      orgId: 'org-456',
      type: 'doc',
      state: 'requested',
    };

    mockParseInputs.mockReturnValue(mockInputs);
    mockGetSmartDefaults.mockReturnValue(mockSmartDefaults);
    mockInferSourceConnection.mockReturnValue('owner/repo');
    mockCreateJob.mockResolvedValue(mockResponse);
    mockConstructJobUrl.mockReturnValue('https://app.doc.holiday/jobs/job-123');

    // Act
    await run();

    // Assert - This test PASSES showing the bug exists
    const createJobCall = mockCreateJob.mock.calls[0];
    expect(createJobCall).toBeDefined();

    const apiRequest = createJobCall[1];

    // BUG CONFIRMED: changes is NOT included in the API request
    // This means doc.holiday has to guess which commits from the body text
    expect(apiRequest.docRequest.changes).toBeUndefined();

    // What we SHOULD send:
    // changes: [{ releases: { count: 1 } }]  // or appropriate release commit range
  });

  it('BUG: merge mode does not provide changes array to API - doc.holiday must infer commits from body', async () => {
    // Arrange
    const mockInputs: ActionInputs = {
      apiToken: 'test-token',
      eventType: 'merge',
    };

    // Current implementation: getSmartDefaults does NOT return changes
    const mockSmartDefaults: SmartDefaults = {
      title: 'Documentation for PR #42',
      body: 'PR description',
      eventType: 'merge',
      // NO changes field - that's the bug!
    };

    const mockResponse: DocHolidayResponse = {
      id: 'job-789',
      orgId: 'org-456',
      type: 'doc',
      state: 'requested',
    };

    mockParseInputs.mockReturnValue(mockInputs);
    mockGetSmartDefaults.mockReturnValue(mockSmartDefaults);
    mockInferSourceConnection.mockReturnValue('owner/repo');
    mockCreateJob.mockResolvedValue(mockResponse);
    mockConstructJobUrl.mockReturnValue('https://app.doc.holiday/jobs/job-789');

    // Act
    await run();

    // Assert - This test PASSES showing the bug exists
    const createJobCall = mockCreateJob.mock.calls[0];
    expect(createJobCall).toBeDefined();

    const apiRequest = createJobCall[1];

    // BUG CONFIRMED: changes is NOT included in the API request
    // This means doc.holiday has to guess which PR commits from the body text
    expect(apiRequest.docRequest.changes).toBeUndefined();

    // What we SHOULD send:
    // changes: [{ commits: { startSha: 'abc123', endSha: 'def456' } }]  // PR commit range
  });
});
