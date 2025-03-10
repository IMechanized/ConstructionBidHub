/**
 * SEO Head Component Tests
 * 
 * Tests the functionality of the SEO head component, including:
 * - Dynamic meta tag generation
 * - Structured data injection
 * - Default values
 */

import { describe, it, expect } from 'vitest';
import { render, waitFor } from '../test/utils';
import SEOHead from './seo-head';

describe('SEOHead', () => {
  it('renders with default values', async () => {
    render(<SEOHead />);

    await waitFor(() => {
      // Check title
      const titleTag = document.querySelector('title');
      expect(titleTag?.textContent).toBe('FindConstructionBids - Leading Construction Bid Management Platform');

      // Check meta tags
      const descriptionTag = document.querySelector('meta[name="description"]');
      expect(descriptionTag?.getAttribute('content')).toContain('Streamline your construction bidding');

      const keywordsTag = document.querySelector('meta[name="keywords"]');
      expect(keywordsTag?.getAttribute('content')).toContain('construction bids');

      // Check OpenGraph tags
      const ogTitleTag = document.querySelector('meta[property="og:title"]');
      expect(ogTitleTag?.getAttribute('content')).toBe('FindConstructionBids - Leading Construction Bid Management Platform');

      const ogTypeTag = document.querySelector('meta[property="og:type"]');
      expect(ogTypeTag?.getAttribute('content')).toBe('website');
    });
  });

  it('renders with custom values', async () => {
    const customProps = {
      title: 'Custom Title',
      description: 'Custom description',
      keywords: 'custom, keywords',
      image: '/custom-image.png',
      url: 'https://example.com',
      type: 'article' as const,
    };

    render(<SEOHead {...customProps} />);

    await waitFor(() => {
      // Check custom title
      const titleTag = document.querySelector('title');
      expect(titleTag?.textContent).toBe('Custom Title');

      // Check custom meta tags
      const descriptionTag = document.querySelector('meta[name="description"]');
      expect(descriptionTag?.getAttribute('content')).toBe('Custom description');

      const keywordsTag = document.querySelector('meta[name="keywords"]');
      expect(keywordsTag?.getAttribute('content')).toBe('custom, keywords');

      // Check custom OpenGraph tags
      const ogTitleTag = document.querySelector('meta[property="og:title"]');
      expect(ogTitleTag?.getAttribute('content')).toBe('Custom Title');

      const ogTypeTag = document.querySelector('meta[property="og:type"]');
      expect(ogTypeTag?.getAttribute('content')).toBe('article');

      const ogImageTag = document.querySelector('meta[property="og:image"]');
      expect(ogImageTag?.getAttribute('content')).toBe('/custom-image.png');
    });
  });

  it('renders custom schema', async () => {
    const customSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Custom Org",
      "url": "https://example.com"
    };

    render(<SEOHead schema={customSchema} />);

    await waitFor(() => {
      const script = document.querySelector('script[type="application/ld+json"]');
      expect(script).toBeTruthy();

      if (script) {
        const parsedSchema = JSON.parse(script.innerHTML);
        expect(parsedSchema).toEqual(customSchema);
      }
    });
  });
});