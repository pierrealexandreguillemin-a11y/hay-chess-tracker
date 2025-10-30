import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function to scrape FFE tournament pages
 * Bypasses CORS restrictions by acting as a proxy
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;

    // Validate URL
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL is from FFE domain
    if (!url.includes('echecs.asso.fr')) {
      return res.status(400).json({ error: 'Only FFE URLs are allowed' });
    }

    // Fetch the HTML from FFE
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch FFE page: ${response.statusText}`,
      });
    }

    const html = await response.text();

    // Return the HTML
    return res.status(200).json({ html });
  } catch (error) {
    console.error('Error scraping FFE:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return res.status(500).json({
      error: 'Failed to scrape FFE page',
      details: errorMessage,
    });
  }
}
