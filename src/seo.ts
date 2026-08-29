import { Product, Collection } from './types';
import { FAQS } from './data/extraData';
import { BRAND_ASSETS, BRAND_LOGO_PATH, BRAND_NAME, BRAND_TAGLINE, BRAND_SITE_URL } from './brandAssets';

export type PageType = 
  | 'home' 
  | 'shop' 
  | 'collection'
  | 'product' 
  | 'scanner' 
  | 'customizer' 
  | 'track-order'
  | 'why-us' 
  | 'faq' 
  | 'login' 
  | 'admin';

export interface SEOConfig {
  pageType?: PageType;
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  product?: Product | null;
  categoryName?: string;
  collection?: Collection | null;
  collectionSlug?: string;
}

const DEFAULT_TITLE = 'Redline Garage | Buy Authentic Hot Wheels Online in India — Collector Cars, Gifts & Bouquets';
const DEFAULT_DESCRIPTION = 'Buy 100% authentic Hot Wheels, custom photo blister cards, luxury die-cast bouquets & acrylic frames online in India. Fast nationwide shipping from Mangalore.';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?q=80&w=1200&auto=format&fit=crop';
const BASE_ORIGIN = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost') && !window.location.origin.includes('run.app')
  ? window.location.origin 
  : BRAND_SITE_URL;

/**
 * Generates page-specific titles matching SEO standards
 */
export const getSEOTitle = (config: SEOConfig): string => {
  if (config.product) {
    return `${config.product.name} | Buy Hot Wheels Online in India — Redline Garage`;
  }
  if (config.title) return config.title;

  if (config.collection) {
    return `${config.collection.name} Collection | Buy Authentic Die-Cast Online in India — Redline Garage`;
  }

  if (config.categoryName) {
    return `${config.categoryName} — Buy Authentic Hot Wheels Online in India | Redline Garage`;
  }

  switch (config.pageType) {
    case 'shop':
    case 'collection':
      return 'Shop Hot Wheels Online | Mainline, Premium, Treasure Hunt & Vintage — Redline Garage';
    case 'scanner':
      return 'Hot Wheels Value Scanner — AI-Powered Price Estimator | Redline Garage';
    case 'customizer':
      return 'Custom Hot Wheels Card Maker | Personalized Blister Pack Photo Gift — Redline Garage';
    case 'track-order':
      return 'Track Your Order Live — Courier & Shipment Milestones | Redline Garage India';
    case 'why-us':
      return 'Why Redline Garage | India’s #1 Authentic Hot Wheels & Die-Cast Studio';
    case 'faq':
      return 'Hot Wheels FAQs — Shipping, Authenticity, Custom Cards & COD | Redline Garage';
    case 'login':
      return 'Customer Account & Order Tracking | Redline Garage India';
    case 'admin':
      return 'Admin Console | Redline Garage India';
    case 'home':
    default:
      return DEFAULT_TITLE;
  }
};

/**
 * Generates page-specific descriptions under 160 characters
 */
export const getSEODescription = (config: SEOConfig): string => {
  if (config.product) {
    const rawDesc = config.product.shortTagline || config.product.description || '';
    const cleanDesc = rawDesc.replace(/\s+/g, ' ').trim();
    if (cleanDesc.length > 20 && cleanDesc.length <= 155) {
      return `Buy ${config.product.name} online at Redline Garage. ${cleanDesc} 100% authentic die-cast, mint pack, fast delivery across India.`;
    }
    return `Buy ${config.product.name} online at Redline Garage India for ₹${config.product.price}. 100% genuine Mattel 1:64 die-cast car with mint packaging & express shipping.`;
  }
  if (config.description) return config.description;

  if (config.collection) {
    const desc = config.collection.description || config.collection.tagline || 'Curated 100% genuine die-cast models';
    return `${desc.slice(0, 120)}. 100% genuine die-cast models, mint collector packaging, fast nationwide dispatch across India.`;
  }

  if (config.categoryName) {
    return `Browse our curated collection of authentic ${config.categoryName}. 100% genuine Mattel die-cast cars, mint blister cards, fast dispatch & express delivery across India.`;
  }

  switch (config.pageType) {
    case 'shop':
      return 'Explore authentic Hot Wheels mainline cars, Car Culture premiums, Treasure Hunts, custom blister cards & collector gift boxes. Fast delivery across India.';
    case 'scanner':
      return 'Free AI Hot Wheels value scanner. Upload a photo of any blister card or loose casting to instantly check model details, rarity, and estimated market price in INR.';
    case 'customizer':
      return 'Design a personalized Hot Wheels blister card with your photo and custom name. Premium 350 GSM cardstock, official blister bubble, and die-cast car included.';
    case 'track-order':
      return 'Track your die-cast package live across India. Enter your mobile number to view DTDC, Blue Dart, Delhivery consignment status and dispatch milestones.';
    case 'why-us':
      return 'Discover why 2,500+ collectors trust Redline Garage for genuine Mattel die-cast cars, white-glove packaging, 24-48H express dispatch & COD options across India.';
    case 'faq':
      return 'Got questions about Redline Garage? Learn about our authentic Mattel sourcing, custom photo card proofing, express 24-48H delivery, and UPI/COD payments.';
    case 'login':
      return 'Track your Hot Wheels shipment live, view previous orders, and manage your Redline Garage collector profile and reward points.';
    case 'admin':
      return 'Secure garage manager dashboard for orders, products, inventory, referral codes, and Google Sheets sync.';
    case 'home':
    default:
      return DEFAULT_DESCRIPTION;
  }
};

/**
 * Updates document title, meta description, Open Graph, Twitter Cards, Canonical tag, and multi-graph Schema.org structured data
 */
export const updateSEO = (config: SEOConfig) => {
  if (typeof document === 'undefined') return;

  const title = getSEOTitle(config);
  const description = getSEODescription(config);
  const image = config.product?.image || config.image || DEFAULT_IMAGE;
  
  let pageUrl = config.url;
  if (!pageUrl && typeof window !== 'undefined') {
    if (config.product) {
      pageUrl = `${window.location.origin}/?product=${encodeURIComponent(config.product.id)}`;
    } else if (config.collection) {
      pageUrl = `${window.location.origin}/${encodeURIComponent(config.collection.slug)}`;
    } else {
      pageUrl = window.location.href;
    }
  }
  const canonicalUrl = pageUrl || BASE_ORIGIN;

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
  setMetaTag('meta[name="keywords"]', 'name', 'keywords', 'Hot Wheels India, buy hot wheels online, die cast cars, custom blister card hot wheels, hot wheels bouquet, hot wheels frame, mainline cars, super treasure hunt, Hot Wheels Mangalore, Hot Wheels Bangalore, diecast collector India');
  setMetaTag('meta[name="author"]', 'name', 'author', 'Redline Garage');
  setMetaTag('meta[name="robots"]', 'name', 'robots', config.pageType === 'admin' ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

  // Geographic Meta Tags (Local SEO for India / Karnataka)
  setMetaTag('meta[name="geo.region"]', 'name', 'geo.region', 'IN-KA');
  setMetaTag('meta[name="geo.placename"]', 'name', 'geo.placename', 'Mangalore, Karnataka, India');
  setMetaTag('meta[name="geo.position"]', 'name', 'geo.position', '12.8708;74.8430');
  setMetaTag('meta[name="ICBM"]', 'name', 'ICBM', '12.8708, 74.8430');

  // Canonical Link
  let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', canonicalUrl);

  // Open Graph Meta Tags (WhatsApp, Instagram, Facebook, LinkedIn rich previews)
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', title);
  setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
  setMetaTag('meta[property="og:image"]', 'property', 'og:image', image);
  setMetaTag('meta[property="og:image:alt"]', 'property', 'og:image:alt', config.product ? `${config.product.name} Hot Wheels Collector Die-Cast` : 'Redline Garage Hot Wheels & Die-Cast Studio');
  setMetaTag('meta[property="og:image:width"]', 'property', 'og:image:width', '1200');
  setMetaTag('meta[property="og:image:height"]', 'property', 'og:image:height', '630');
  setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
  setMetaTag('meta[property="og:type"]', 'property', 'og:type', config.product ? 'product' : 'website');
  setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Redline Garage');
  setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'en_IN');

  if (config.product) {
    setMetaTag('meta[property="product:price:amount"]', 'property', 'product:price:amount', config.product.price.toString());
    setMetaTag('meta[property="product:price:currency"]', 'property', 'product:price:currency', 'INR');
    setMetaTag('meta[property="product:availability"]', 'property', 'product:availability', (config.product.stockCount ?? 1) > 0 ? 'in stock' : 'out of stock');
    setMetaTag('meta[property="product:condition"]', 'property', 'product:condition', 'new');
    setMetaTag('meta[property="product:brand"]', 'property', 'product:brand', 'Hot Wheels');
  }

  // Twitter Card Tags
  setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title);
  setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
  setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', image);
  setMetaTag('meta[name="twitter:image:alt"]', 'name', 'twitter:image:alt', title);

  // Schema.org Structured Data (JSON-LD)
  let scriptEl = document.querySelector('script#schema-org-jsonld') as HTMLScriptElement;
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = 'schema-org-jsonld';
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }

  const siteUrl = BASE_ORIGIN;

  // Base Organization / LocalBusiness Schema
  const orgSchema = {
    '@type': 'Store',
    '@id': `${siteUrl}/#organization`,
    name: BRAND_NAME,
    alternateName: `${BRAND_NAME} India`,
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${siteUrl}${BRAND_LOGO_PATH}`,
      width: BRAND_ASSETS.logo.width,
      height: BRAND_ASSETS.logo.height,
    },
    image: DEFAULT_IMAGE,
    description: DEFAULT_DESCRIPTION,
    telephone: '+91-8431294886',
    email: 'shkofficialazman@gmail.com',
    priceRange: '₹149 - ₹4999',
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash on Delivery, UPI, Credit Card, Debit Card, Net Banking',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Redline Garage Studio, Hampankatta',
      addressLocality: 'Mangalore',
      addressRegion: 'Karnataka',
      postalCode: '575001',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 12.8708,
      longitude: 74.8430,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '09:00',
        closes: '22:00',
      },
    ],
    sameAs: [
      BRAND_ASSETS.storeContact.instagramUrl,
      `https://wa.me/${BRAND_ASSETS.storeContact.whatsappNumber}`,
    ],
  };

  // Base WebSite Schema with SearchAction
  const websiteSchema = {
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: siteUrl,
    name: `${BRAND_NAME} — Hot Wheels & Die-Cast Collector Store`,
    description: DEFAULT_DESCRIPTION,
    publisher: {
      '@id': `${siteUrl}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  // FAQ Schema from active FAQS list
  const faqSchema = {
    '@type': 'FAQPage',
    '@id': `${siteUrl}/#faqpage`,
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  const graphItems: any[] = [orgSchema, websiteSchema, faqSchema];

  // If viewing a specific product, add rich Product schema and BreadcrumbList
  if (config.product) {
    const p = config.product;
    const categoryTitle = p.category ? p.category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Die-Cast';

    const productSchema = {
      '@type': 'Product',
      '@id': `${canonicalUrl}/#product`,
      name: p.name,
      image: [p.image, ...(p.galleryImages || [])].filter(Boolean),
      description: p.description || p.shortTagline || `Authentic ${p.name} 1:64 scale die-cast model car.`,
      sku: `RG-${p.id}`,
      mpn: p.id,
      brand: {
        '@type': 'Brand',
        name: p.category === 'custom-cards' ? 'Redline Garage' : 'Hot Wheels',
      },
      category: categoryTitle,
      itemCondition: 'https://schema.org/NewCondition',
      offers: {
        '@type': 'Offer',
        url: canonicalUrl,
        priceCurrency: 'INR',
        price: p.price,
        priceValidUntil: '2027-12-31',
        itemCondition: 'https://schema.org/NewCondition',
        availability: (p.stockCount ?? 1) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: 'Redline Garage',
          url: siteUrl,
        },
        shippingDetails: {
          '@type': 'OfferShippingDetails',
          shippingRate: {
            '@type': 'MonetaryAmount',
            value: 0,
            currency: 'INR',
          },
          shippingDestination: {
            '@type': 'DefinedRegion',
            addressCountry: 'IN',
          },
          deliveryTime: {
            '@type': 'ShippingDeliveryTime',
            handlingTime: {
              '@type': 'QuantitativeValue',
              minValue: 1,
              maxValue: 2,
              unitCode: 'DAY',
            },
            transitTime: {
              '@type': 'QuantitativeValue',
              minValue: 2,
              maxValue: 5,
              unitCode: 'DAY',
            },
          },
        },
        hasMerchantReturnPolicy: {
          '@type': 'MerchantReturnPolicy',
          applicableCountry: 'IN',
          returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
          merchantReturnDays: 7,
          returnMethod: 'https://schema.org/ReturnByMail',
          returnFees: 'https://schema.org/FreeReturn',
        },
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: p.rating || 5.0,
        reviewCount: p.reviewsCount || 12,
        bestRating: 5,
        worstRating: 1,
      },
    };

    const breadcrumbsSchema = {
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}/#breadcrumbs`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: siteUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: categoryTitle,
          item: `${siteUrl}/#categories`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: p.name,
          item: canonicalUrl,
        },
      ],
    };

    graphItems.push(productSchema, breadcrumbsSchema);
  }

  // Inject full multi-graph structured data
  const fullSchema = {
    '@context': 'https://schema.org',
    '@graph': graphItems,
  };

  scriptEl.textContent = JSON.stringify(fullSchema, null, 2);
};

