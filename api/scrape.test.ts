import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from './scrape';

// Mock fetch globally
global.fetch = vi.fn();

// Helper to create mock Vercel request
function createMockRequest(
  method: string,
  body: any = {}
): Partial<VercelRequest> {
  return {
    method,
    body,
  };
}

// Helper to create mock Vercel response
function createMockResponse(): {
  res: Partial<VercelResponse>;
  getStatus: () => number;
  getJson: () => any;
} {
  let statusCode = 200;
  let jsonData: any = {};

  const res: Partial<VercelResponse> = {
    status: vi.fn((code: number) => {
      statusCode = code;
      return res as VercelResponse;
    }),
    json: vi.fn((data: any) => {
      jsonData = data;
      return res as VercelResponse;
    }),
  };

  return {
    res,
    getStatus: () => statusCode,
    getJson: () => jsonData,
  };
}

describe('api/scrape.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockReset();
  });

  describe('HTTP Method Validation', () => {
    it('returns 405 for GET request', async () => {
      const req = createMockRequest('GET');
      const { res, getStatus, getJson } = createMockResponse();

      await handler(req as VercelRequest, res as VercelResponse);

      expect(getStatus()).toBe(405);
      expect(getJson()).toEqual({ error: 'Method not allowed' });
    });

    it('returns 405 for PUT request', async () => {
      const req = createMockRequest('PUT');
      const { res, getStatus, getJson } = createMockResponse();

      await handler(req as VercelRequest, res as VercelResponse);

      expect(getStatus()).toBe(405);
      expect(getJson()).toEqual({ error: 'Method not allowed' });
    });

    it('returns 405 for DELETE request', async () => {
      const req = createMockRequest('DELETE');
      const { res, getStatus, getJson } = createMockResponse();

      await handler(req as VercelRequest, res as VercelResponse);

      expect(getStatus()).toBe(405);
      expect(getJson()).toEqual({ error: 'Method not allowed' });
    });

    it('accepts POST request', async () => {
      const req = createMockRequest('POST', {
        url: 'https://echecs.asso.fr/Resultats.aspx?Action=Ga',
      });
      const { res } = createMockResponse();

      (global.fetch as any).mockResolvedValue({
        ok: true,
        statusText: 'OK',
        text: async () => '<html>test</html>',
      });

      await handler(req as VercelRequest, res as VercelResponse);

      // Should not return 405
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('URL Validation', () => {
    it('returns 400 when URL is missing', async () => {
      const req = createMockRequest('POST', {});
      const { res, getStatus, getJson } = createMockResponse();

      await handler(req as VercelRequest, res as VercelResponse);

      expect(getStatus()).toBe(400);
      expect(getJson()).toEqual({ error: 'URL is required' });
    });

    it('returns 400 when URL is null', async () => {
      const req = createMockRequest('POST', { url: null });
      const { res, getStatus, getJson } = createMockResponse();

      await handler(req as VercelRequest, res as VercelResponse);

      expect(getStatus()).toBe(400);
      expect(getJson()).toEqual({ error: 'URL is required' });
    });

    it('returns 400 when URL is not a string', async () => {
      const req = createMockRequest('POST', { url: 12345 });
      const { res, getStatus, getJson } = createMockResponse();

      await handler(req as VercelRequest, res as VercelResponse);

      expect(getStatus()).toBe(400);
      expect(getJson()).toEqual({ error: 'URL is required' });
    });

    it('returns 400 when URL is empty string', async () => {
      const req = createMockRequest('POST', { url: '' });
      const { res, getStatus, getJson } = createMockResponse();

      await handler(req as VercelRequest, res as VercelResponse);

      expect(getStatus()).toBe(400);
      expect(getJson()).toEqual({ error: 'URL is required' });
    });

    it('returns 400 for non-FFE URL (google.com)', async () => {
      const req = createMockRequest('POST', { url: 'https://google.com' });
      const { res, getStatus, getJson } = createMockResponse();

      await handler(req as VercelRequest, res as VercelResponse);

      expect(getStatus()).toBe(400);
      expect(getJson()).toEqual({ error: 'Only FFE URLs are allowed' });
    });

    it('accepts FFE URL even with path containing echecs.asso.fr', async () => {
      // Note: Current validation uses .includes() so this passes
      // This test documents current behavior - not necessarily desired
      const req = createMockRequest('POST', { url: 'https://echecs.asso.fr/path' });
      const { res, getStatus } = createMockResponse();

      (global.fetch as any).mockResolvedValue({
        ok: true,
        statusText: 'OK',
        text: async () => '<html></html>',
      });

      await handler(req as VercelRequest, res as VercelResponse);

      expect(getStatus()).toBe(200);
    });

    it('accepts valid FFE URL with Action=Ga', async () => {
      const validUrl = 'https://echecs.asso.fr/Resultats.aspx?Action=Ga&Id=123';
      const req = createMockRequest('POST', { url: validUrl });
      const { res } = createMockResponse();

      (global.fetch as any).mockResolvedValue({
        ok: true,
        statusText: 'OK',
        text: async () => '<html>FFE page</html>',
      });

      await handler(req as VercelRequest, res as VercelResponse);

      expect(global.fetch).toHaveBeenCalledWith(
        validUrl,
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('Mozilla'),
            'Accept': expect.stringContaining('text/html'),
            'Accept-Language': expect.stringContaining('fr-FR'),
          }),
        })
      );
    });

    it('accepts valid FFE URL with Action=Ls', async () => {
      const validUrl = 'https://echecs.asso.fr/Resultats.aspx?Action=Ls&Id=123';
      const req = createMockRequest('POST', { url: validUrl });
      const { res } = createMockResponse();

      (global.fetch as any).mockResolvedValue({
        ok: true,
        statusText: 'OK',
        text: async () => '<html>FFE page</html>',
      });

      await handler(req as VercelRequest, res as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Fetch FFE Success', () => {
    it('returns HTML when fetch succeeds', async () => {
      const validUrl = 'https://echecs.asso.fr/Resultats.aspx?Action=Ga';
      const mockHtml = '<html><body>FFE Tournament Results</body></html>';

      const req = createMockRequest('POST', { url: validUrl });
      const { res, getStatus, getJson } = createMockResponse();

      (global.fetch as any).mockResolvedValue({
        ok: true,
        statusText: 'OK',
        text: async () => mockHtml,
      });

      await handler(req as VercelRequest, res as VercelResponse);

      expect(getStatus()).toBe(200);
      expect(getJson()).toEqual({ html: mockHtml });
    });

    it('includes correct User-Agent header', async () => {
      const validUrl = 'https://echecs.asso.fr/Resultats.aspx?Action=Ga';
      const req = createMockRequest('POST', { url: validUrl });
      const { res } = createMockResponse();

      (global.fetch as any).mockResolvedValue({
        ok: true,
        statusText: 'OK',
        text: async () => '<html></html>',
      });

      await handler(req as VercelRequest, res as VercelResponse);

      expect(global.fetch).toHaveBeenCalledWith(
        validUrl,
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          }),
        })
      );
    });
  });

  describe('Fetch FFE Errors', () => {
    it('returns 404 when FFE page not found', async () => {
      const validUrl = 'https://echecs.asso.fr/Resultats.aspx?Action=Ga&Id=999999';
      const req = createMockRequest('POST', { url: validUrl });
      const { res, getStatus, getJson } = createMockResponse();

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await handler(req as VercelRequest, res as VercelResponse);

      expect(getStatus()).toBe(404);
      expect(getJson()).toEqual({
        error: 'Failed to fetch FFE page: Not Found',
      });
    });

    it('returns 500 when FFE server error', async () => {
      const validUrl = 'https://echecs.asso.fr/Resultats.aspx?Action=Ga';
      const req = createMockRequest('POST', { url: validUrl });
      const { res, getStatus, getJson } = createMockResponse();

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await handler(req as VercelRequest, res as VercelResponse);

      expect(getStatus()).toBe(500);
      expect(getJson()).toEqual({
        error: 'Failed to fetch FFE page: Internal Server Error',
      });
    });

    it('returns 500 when network error occurs', async () => {
      const validUrl = 'https://echecs.asso.fr/Resultats.aspx?Action=Ga';
      const req = createMockRequest('POST', { url: validUrl });
      const { res, getStatus, getJson } = createMockResponse();

      (global.fetch as any).mockRejectedValue(new Error('Network timeout'));

      await handler(req as VercelRequest, res as VercelResponse);

      expect(getStatus()).toBe(500);
      expect(getJson()).toEqual({
        error: 'Failed to scrape FFE page',
        details: 'Network timeout',
      });
    });

    it('returns 500 when unknown error occurs', async () => {
      const validUrl = 'https://echecs.asso.fr/Resultats.aspx?Action=Ga';
      const req = createMockRequest('POST', { url: validUrl });
      const { res, getStatus, getJson } = createMockResponse();

      (global.fetch as any).mockRejectedValue('Unknown error string');

      await handler(req as VercelRequest, res as VercelResponse);

      expect(getStatus()).toBe(500);
      expect(getJson()).toEqual({
        error: 'Failed to scrape FFE page',
        details: 'Unknown error',
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles very long HTML response', async () => {
      const validUrl = 'https://echecs.asso.fr/Resultats.aspx?Action=Ga';
      const longHtml = '<html>' + 'a'.repeat(100000) + '</html>';

      const req = createMockRequest('POST', { url: validUrl });
      const { res, getStatus, getJson } = createMockResponse();

      (global.fetch as any).mockResolvedValue({
        ok: true,
        statusText: 'OK',
        text: async () => longHtml,
      });

      await handler(req as VercelRequest, res as VercelResponse);

      expect(getStatus()).toBe(200);
      expect(getJson()).toEqual({ html: longHtml });
      expect(getJson().html.length).toBe(100013);
    });

    it('handles special characters in URL', async () => {
      const urlWithSpecialChars = 'https://echecs.asso.fr/Resultats.aspx?Action=Ga&Name=Test%20Tournament&Id=123';
      const req = createMockRequest('POST', { url: urlWithSpecialChars });
      const { res } = createMockResponse();

      (global.fetch as any).mockResolvedValue({
        ok: true,
        statusText: 'OK',
        text: async () => '<html></html>',
      });

      await handler(req as VercelRequest, res as VercelResponse);

      expect(global.fetch).toHaveBeenCalledWith(urlWithSpecialChars, expect.any(Object));
    });
  });
});
