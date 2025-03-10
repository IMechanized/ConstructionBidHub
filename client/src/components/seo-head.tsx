/**
 * SEO Head Component
 * 
 * A reusable component for managing page-specific SEO meta tags.
 * Dynamically updates meta tags, titles, and structured data based on current page content.
 */

import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  schema?: object;
}

export default function SEOHead({
  title = 'FindConstructionBids - Leading Construction Bid Management Platform',
  description = 'Streamline your construction bidding process with FindConstructionBids. Connect with qualified contractors, manage RFPs, and track project analytics all in one place.',
  keywords = 'construction bids, RFP management, contractor bidding, construction projects, bid platform, construction management',
  image = '/og-image.png',
  url = 'https://findconstructionbids.com',
  type = 'website',
  schema
}: SEOProps) {
  const defaultSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": title,
    "description": description,
    "url": url
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(schema || defaultSchema)}
      </script>
    </Helmet>
  );
}