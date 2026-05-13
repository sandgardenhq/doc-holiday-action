// __tests__/api.test.ts
import { createConversation } from '../src/api';
import { ConversationRequest, ConversationResponse } from '../src/types';
import * as core from '@actions/core';

jest.mock('@actions/core');

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

const mockRequest: ConversationRequest = {
  body: 'Test body',
};

const mockResponse: ConversationResponse = {
  id: 'ws-0000000000001234',
  jobId: 'job-0000000000007118',
  outId: 'out-000000000000abcd',
  orgId: 'org-49440c77dc13f38d',
  status: 'requested',
  publicationId: 'pub-0000000000009999',
  connectionId: 'conn-0000000000000001',
  publicationName: 'my-publication',
  triggerType: 'api',
  operationType: 'docs-update',
  createdAt: '2025-10-29T15:00:00Z',
  updatedAt: '2025-10-29T15:01:00Z',
  branch: 'doc-holiday/conversations-api',
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
      message: 'Conversation created',
    },
  ],
};

describe('api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createConversation', () => {
    it('should POST to /api/v1/conversations/', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await createConversation('test-token', mockRequest);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.doc.holiday/api/v1/conversations/',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockRequest),
        }
      );
    });

    it('should include optional fields in request', async () => {
      const fullRequest: ConversationRequest = {
        body: 'Test body',
        publication: 'my-pub',
        stage: true,
        labels: ['label1'],
        relevantLinks: ['https://example.com'],
        changes: [{ releases: { count: 1 } }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await createConversation('test-token', fullRequest);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.doc.holiday/api/v1/conversations/',
        expect.objectContaining({
          body: JSON.stringify(fullRequest),
        })
      );
    });

    it('should throw auth error without retry on 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(createConversation('bad-token', mockRequest)).rejects.toThrow(
        'Authentication failed. Please check your api-token.'
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on 429 with exponential backoff', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 429 })
        .mockResolvedValueOnce({ ok: false, status: 429 })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

      const result = await createConversation('test-token', mockRequest);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should retry on network error', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

      const result = await createConversation('test-token', mockRequest);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'Server error' })
        .mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'Server error' })
        .mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'Server error' });

      await expect(createConversation('test-token', mockRequest)).rejects.toThrow(
        'Failed to create conversation after 3 attempts'
      );
    });

    it('should handle 503 with retry then success', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 503, text: async () => 'Unavailable' })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

      const result = await createConversation('test-token', mockRequest);
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
