import * as core from '@actions/core';
import * as github from '@actions/github';
import { run } from '../../src/load-jira-issues/index';
import * as inputs from '../../src/load-jira-issues/inputs';
import * as jira from '../../src/load-jira-issues/jira';
import * as git from '../../src/load-jira-issues/git';
import * as scanner from '../../src/load-jira-issues/scanner';
import * as output from '../../src/load-jira-issues/output';

jest.mock('@actions/core');
jest.mock('@actions/github', () => ({
  context: {
    repo: { owner: 'test-owner', repo: 'test-repo' },
  },
}));
jest.mock('jira.js', () => ({
  Version2Client: jest.fn(),
  Version3Client: jest.fn(),
}));
jest.mock('../../src/load-jira-issues/inputs');
jest.mock('../../src/load-jira-issues/jira');
jest.mock('../../src/load-jira-issues/git');
jest.mock('../../src/load-jira-issues/scanner');
jest.mock('../../src/load-jira-issues/output');

const mockParseInputs = inputs.parseInputs as jest.MockedFunction<typeof inputs.parseInputs>;
const mockFetchProjectKeys = jira.fetchProjectKeys as jest.MockedFunction<typeof jira.fetchProjectKeys>;
const mockFetchCommits = git.fetchCommits as jest.MockedFunction<typeof git.fetchCommits>;
const mockScanCommits = scanner.scanCommits as jest.MockedFunction<typeof scanner.scanCommits>;
const mockBuildOutputArtifact = output.buildOutputArtifact as jest.MockedFunction<typeof output.buildOutputArtifact>;
const mockWriteArtifact = output.writeArtifact as jest.MockedFunction<typeof output.writeArtifact>;
const mockBuildIssueLinksString = output.buildIssueLinksString as jest.MockedFunction<typeof output.buildIssueLinksString>;
const mockBuildIssueKeysString = output.buildIssueKeysString as jest.MockedFunction<typeof output.buildIssueKeysString>;
const mockSetOutput = core.setOutput as jest.MockedFunction<typeof core.setOutput>;
const mockSetFailed = core.setFailed as jest.MockedFunction<typeof core.setFailed>;
const mockInfo = core.info as jest.MockedFunction<typeof core.info>;

describe('run', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete full flow successfully', async () => {
    mockParseInputs.mockReturnValue({
      jiraBaseUrl: 'https://company.atlassian.net',
      jiraApiToken: 'token-123',
      jiraUserEmail: 'user@company.com',
      outputFile: 'jira-issues.json',
      changeset: { commitsCount: 10 },
    });

    mockFetchProjectKeys.mockResolvedValue(['PROJ', 'INFRA']);
    mockFetchCommits.mockResolvedValue([
      { sha: 'abc123', message: 'feat: PROJ-123' },
      { sha: 'def456', message: 'fix: PROJ-456' },
    ]);

    const issueMap = new Map([
      ['PROJ-123', ['abc123']],
      ['PROJ-456', ['def456']],
    ]);
    mockScanCommits.mockReturnValue(issueMap);

    const artifact = {
      metadata: {
        generatedAt: '2025-01-15T10:30:00.000Z',
        jiraBaseUrl: 'https://company.atlassian.net',
        repository: 'test-owner/test-repo',
        changeset: { type: 'commits-count', count: 10 },
        totalIssues: 2,
        totalCommits: 2,
      },
      issues: [
        { key: 'PROJ-123', url: 'https://company.atlassian.net/browse/PROJ-123', commits: ['abc123'] },
        { key: 'PROJ-456', url: 'https://company.atlassian.net/browse/PROJ-456', commits: ['def456'] },
      ],
    };
    mockBuildOutputArtifact.mockReturnValue(artifact);
    mockBuildIssueLinksString.mockReturnValue(
      'https://company.atlassian.net/browse/PROJ-123,https://company.atlassian.net/browse/PROJ-456'
    );
    mockBuildIssueKeysString.mockReturnValue('PROJ-123,PROJ-456');

    await run();

    expect(mockFetchProjectKeys).toHaveBeenCalledWith(
      'https://company.atlassian.net',
      'token-123',
      'user@company.com',
      undefined
    );
    expect(mockFetchCommits).toHaveBeenCalledWith({ commitsCount: 10 });
    expect(mockScanCommits).toHaveBeenCalledWith(
      [
        { sha: 'abc123', message: 'feat: PROJ-123' },
        { sha: 'def456', message: 'fix: PROJ-456' },
      ],
      ['PROJ', 'INFRA']
    );
    expect(mockWriteArtifact).toHaveBeenCalledWith(artifact, 'jira-issues.json');
    expect(mockSetOutput).toHaveBeenCalledWith('issue-links', expect.any(String));
    expect(mockSetOutput).toHaveBeenCalledWith('issue-keys', 'PROJ-123,PROJ-456');
    expect(mockSetOutput).toHaveBeenCalledWith('issue-count', '2');
  });

  it('should handle errors gracefully', async () => {
    mockParseInputs.mockImplementation(() => {
      throw new Error('Missing required input');
    });

    await run();

    expect(mockSetFailed).toHaveBeenCalledWith('Missing required input');
  });

  it('should succeed with zero issues found', async () => {
    mockParseInputs.mockReturnValue({
      jiraBaseUrl: 'https://company.atlassian.net',
      jiraApiToken: 'token-123',
      jiraUserEmail: 'user@company.com',
      outputFile: 'jira-issues.json',
      changeset: { commitsCount: 10 },
    });

    mockFetchProjectKeys.mockResolvedValue(['PROJ']);
    mockFetchCommits.mockResolvedValue([
      { sha: 'abc123', message: 'feat: no jira reference' },
    ]);
    mockScanCommits.mockReturnValue(new Map());

    const artifact = {
      metadata: {
        generatedAt: '2025-01-15T10:30:00.000Z',
        jiraBaseUrl: 'https://company.atlassian.net',
        repository: 'test-owner/test-repo',
        changeset: { type: 'commits-count', count: 10 },
        totalIssues: 0,
        totalCommits: 1,
      },
      issues: [],
    };
    mockBuildOutputArtifact.mockReturnValue(artifact);
    mockBuildIssueLinksString.mockReturnValue('');
    mockBuildIssueKeysString.mockReturnValue('');

    await run();

    expect(mockSetFailed).not.toHaveBeenCalled();
    expect(mockSetOutput).toHaveBeenCalledWith('issue-count', '0');
  });
});
