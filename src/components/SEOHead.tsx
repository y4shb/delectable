import Head from 'next/head';

interface SEOHeadProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'restaurant' | 'profile';
  jsonLd?: Record<string, unknown>;
}

const SITE_NAME = 'Delectable';
const DEFAULT_IMAGE = '/images/og-default.png';

export default function SEOHead({
  title,
  description,
  image,
  url,
  type = 'website',
  jsonLd,
}: SEOHeadProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const ogImage = image || DEFAULT_IMAGE;
  const truncatedDescription =
    description.length > 160
      ? description.slice(0, 157) + '...'
      : description;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={truncatedDescription} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={truncatedDescription} />
      <meta property="og:image" content={ogImage} />
      {url && <meta property="og:url" content={url} />}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={truncatedDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/* Canonical */}
      {url && <link rel="canonical" href={url} />}

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </Head>
  );
}
