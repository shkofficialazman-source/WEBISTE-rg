import { Product } from './types';

export interface SEOConfig {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product';
  product?: Product;
}

const DEFAULT_TITLE = 'Redline Garage — Buy Hot Wheels, Die-Cast Bouquets & Custom Cards in India';
const DEFAULT_DESCRIPTION = 'India\'s premier destination for rare Hot Wheels, custom die-cast bouquets, acrylic collector frames, personalized blister cards, and AI rarity scanner. Fast shipping across India with genuine authentic collectibles.';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?q=80&w=1200&auto=format&fit=crop';
const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://redlinegarage.in';

/**
 * Updates document title, meta description, Open Graph, Twitter Cards, and Schema.org Product markup
 */
export const updateSEO = (config: SEOConfig) => {
  if (typeof document === 'undefined') return;

  const title = config.product
    ? `${config.product.name} | Buy Hot Wheels Online in India — Redline Garage`
    : config.title || DEFAULT_TITLE;

  const description = config.product
    ? (config.product.shortTagline || config.product.description?.slice(0, 160) || `Buy ${config.product.name} online at Redline Garage India. Genuine 1:64 scale die-cast collector model with mint packaging and fast doorstep delivery.`)
    : config.description || DEFAULT_DESCRIPTION;

  const image = config.product?.image || config.image || DEFAULT_IMAGE;
  const url = config.url || (typeof window !== 'undefined' ? window.location.href : SITE_URL);

  // Set Document Title
  document.title = title;

  // Helper to set/update meta tag
  const setMetaTag = (selector: string, attrName: string, attrValue: string, content: string) => {
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrValue);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // Standard Meta Tags
  setMetaTag('meta[name="description"]', 'name', 'description', description);
  setMetaTag('meta[name="keywords"]', 'name', 'keywords', 'Hot Wheels India, buy hot wheels online, die cast cars, custom blister card hot wheels, hot wheels bouquet, hot wheels frame, mainline cars, super treasure hunt');

  // Open Graph Meta Tags (WhatsApp, Facebook, LinkedIn previews)
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', title);
  setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
  setMetaTag('meta[property="og:image"]', 'property', 'og:image', image);
  setMetaTag('meta[property="og:url"]', 'property', 'og:url', url);
  setMetaTag('meta[property="og:type"]', 'property', 'og:type', config.product ? 'product' : 'website');
  setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Redline Garage');

  // Twitter Card Tags
  setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title);
  setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
  setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', image);

  // Schema.org Structured Data (JSON-LD)
  let scriptEl = document.querySelector('script#schema-org-jsonld') as HTMLScriptElement;
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = 'schema-org-jsonld';
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }

  if (config.product) {
    const productSchema = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: config.product.name,
      image: [config.product.image, ...(config.product.galleryImages || [])],
      description: config.product.description || config.product.shortTagline,
      sku: `RG-${config.product.id}`,
      brand: {
        '@type': 'Brand',
        name: 'Hot Wheels',
      },
      offers: {
        '@type': 'Offer',
        url: url,
        priceCurrency: 'INR',
        price: config.product.price,
        priceValidUntil: '2027-12-31',
        itemCondition: 'https://schema.org/NewCondition',
        availability: (config.product.stockCount ?? 1) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: 'Redline Garage',
        },
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: config.product.rating || 5.0,
        reviewCount: config.product.reviewsCount || 1,
      },
    };
    scriptEl.textContent = JSON.stringify(productSchema);
  } else {
    // Store / Website Organization Schema
    const orgSchema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${SITE_URL}/#organization`,
          name: 'Redline Garage',
          url: SITE_URL,
          logo: `${SITE_URL}/assets/logo.png`,
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+91-8431294886',
            contactType: 'customer service',
            areaServed: 'IN',
            availableLanguage: ['English', 'Hindi'],
          },
        },
        {
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          url: SITE_URL,
          name: 'Redline Garage — Hot Wheels & Die-Cast Collector Store',
          description: DEFAULT_DESCRIPTION,
          publisher: {
            '@id': `${SITE_URL}/#organization`,
          },
        },
      ],
    };
    scriptEl.textContent = JSON.stringify(orgSchema);
  }
};
