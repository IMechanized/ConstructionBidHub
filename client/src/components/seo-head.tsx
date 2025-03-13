import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile' | 'organization';
  schema?: object;
  noindex?: boolean;
  canonical?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  locale?: string;
}

export default function SEOHead({
  title = 'FindConstructionBids - Leading Construction Bid Management Platform',
  description = 'Streamline your construction bidding process with FindConstructionBids. Connect with qualified contractors, manage RFPs, and track project analytics all in one place.',
  keywords = 'construction bids, RFP management, contractor bidding, construction projects, bid platform, construction management',
  image = '/og-image.png',
  url = 'https://findconstructionbids.com',
  type = 'website',
  schema,
  noindex = false,
  canonical,
  publishedTime,
  modifiedTime,
  author = 'FindConstructionBids',
  locale = 'en_US'
}: SEOProps) {
  // Generate default schema based on page type
  const defaultSchema = {
    "@context": "https://schema.org",
    "@type": type === 'article' ? 'Article' : 'WebPage',
    "name": title,
    "description": description,
    "url": canonical || url,
    ...(type === 'article' && {
      "author": {
        "@type": "Person",
        "name": author
      },
      "datePublished": publishedTime,
      "dateModified": modifiedTime || publishedTime,
    }),
    "publisher": {
      "@type": "Organization",
      "name": "FindConstructionBids",
      "url": "https://findconstructionbids.com"
    }
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      <link rel="canonical" href={canonical || url} />
      <meta name="author" content={author} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical || url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content={locale} />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical || url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Mobile-specific */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="theme-color" content="#4338CA" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(schema || defaultSchema)}
      </script>
    </Helmet>
  );
}