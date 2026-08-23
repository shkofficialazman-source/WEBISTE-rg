import { FAQItem, GalleryItem, Testimonial } from '../types';

export const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'How fast do you ship Redline Garage items?',
    answer: 'Standard items (Bouquets, Frames, Scale Sets) ship within 24-48 hours. Custom Photo Cards take 2-3 business days to allow for photo proofing and high-DPI cardstock printing. Express priority shipping options are available at checkout.',
    category: 'delivery'
  },
  {
    id: 'faq-2',
    question: 'How do I upload my photo for Customized Hot Wheels Cards?',
    answer: 'You can upload your photo directly on our website using the "Custom Card Builder" or during checkout. Alternatively, if you order via WhatsApp, simply send your high-res photo directly to our WhatsApp concierge after placing your order!',
    category: 'customization'
  },
  {
    id: 'faq-3',
    question: 'Are the Hot Wheels cars authentic Mattel products?',
    answer: 'Yes, 100%! We only use official, licensed Mattel Hot Wheels die-cast cars and premium licensed scale models. All cars are genuine, pristine metal castings.',
    category: 'care'
  },
  {
    id: 'faq-4',
    question: 'Can I choose specific Hot Wheels model cars for my bouquet or frame?',
    answer: 'Absolutely! You can choose themes (JDM Icons, European Supercars, American Muscle, Retro Classics) or message us on WhatsApp with specific casting requests. We maintain an inventory of over 1,000+ sealed Hot Wheels cars.',
    category: 'customization'
  },
  {
    id: 'faq-5',
    question: 'What payment options and COD options do you support?',
    answer: 'We accept Credit/Debit Cards, Apple Pay, Google Pay, and UPI. Cash on Delivery (COD) is available for all standard non-customized bouquets, frames, and scale model sets. For customized photo cards, a small partial deposit is required prior to printing.',
    category: 'payment'
  },
  {
    id: 'faq-6',
    question: 'How are bouquets and frames packed to avoid damage in transit?',
    answer: 'Every piece is packed inside a heavy-duty reinforced corrugated box with form-fitted bubble cushioning and a clear protective sleeve. Frames come with corner edge guards and shatter-proof acrylic faces.',
    category: 'delivery'
  }
];

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'gal-1',
    title: '30th Birthday Redline Apex Bouquet Surprise',
    image: 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&w=600&q=80',
    category: 'bouquets',
    likes: 342,
    customerTag: 'Gift for Husband',
    description: '“He gasped when he opened this instead of regular flowers! 6 supercars in a satin wrap!”'
  },
  {
    id: 'gal-2',
    title: 'Custom Photo Card with Coupe in Blister',
    image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=600&q=80',
    category: 'custom-cards',
    likes: 512,
    customerTag: 'Anniversary Surprise',
    description: '“Our photo on an actual Hot Wheels card! Framed it next to our desk immediately.”'
  },
  {
    id: 'gal-3',
    title: 'GT-R Skyline Heritage Wall Frame in Man Cave',
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=600&q=80',
    category: 'frames',
    likes: 289,
    customerTag: 'Garage Decor',
    description: '“Mounted above my tool chest. Clean blueprint graphics and mint castings.”'
  },
  {
    id: 'gal-4',
    title: 'JDM Founders 4-Car Collector Box Display',
    image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=600&q=80',
    category: 'scale-models',
    likes: 421,
    customerTag: 'Die-Cast Collector',
    description: '“Real rubber tires and opening hoods. The acrylic display case is crystal clear.”'
  },
  {
    id: 'gal-5',
    title: 'Midnight Stealth Edition Bouquet with Warm LED',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
    category: 'bouquets',
    likes: 670,
    customerTag: 'Valentine’s Special',
    description: '“The stealth carbon wrap with LED strip glowing underneath looks unreal at night.”'
  },
  {
    id: 'gal-6',
    title: 'Couples "Driven By Love" Dual Blister Card',
    image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=600&q=80',
    category: 'custom-cards',
    likes: 388,
    customerTag: 'First Year Together',
    description: '“Our initial custom card with two matching red and white die-cast cars!”'
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'test-1',
    name: 'Sarah Jenkins',
    role: 'Gifted to Boyfriend for 25th Birthday',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    rating: 5,
    comment: 'My boyfriend is a huge Hot Wheels collector and he was completely speechless when the Apex Bouquet arrived! The packaging quality is 10/10. It looks like a high-end luxury gift.',
    productName: 'The Redline Apex Bouquet',
    verified: true,
    date: '2 days ago'
  },
  {
    id: 'test-2',
    name: 'Marcus Vance',
    role: 'Die-Cast Collector & Car Enthusiast',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    rating: 5,
    comment: 'I was worried about the condition of the cars inside the frames, but Redline Garage uses pristine mint castings! The GT-R Heritage frame is currently the highlight of my office space.',
    productName: 'Legendary GT-R Heritage Wall Frame',
    verified: true,
    date: '1 week ago'
  },
  {
    id: 'test-3',
    name: 'Elena Rostova',
    role: 'Anniversary Gift',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    rating: 5,
    comment: 'Ordering on WhatsApp was super seamless! I uploaded our photo from our trip to Tokyo, and within 3 days I had a custom blister card sealed in a protective case. So creative!',
    productName: 'Custom Photo Blister Card',
    verified: true,
    date: '3 days ago'
  }
];
