import { FAQItem, GalleryItem, Testimonial } from '../types';

export const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'Are all Hot Wheels and die-cast cars authentic Mattel products?',
    answer: 'Yes, 100%! We strictly source official, licensed Mattel Hot Wheels mainline cars, Car Culture premiums, and certified scale models. Every casting is brand-new, factory mint, and authentic.',
    category: 'care'
  },
  {
    id: 'faq-2',
    question: 'How fast is shipping across India?',
    answer: 'Standard items (Bouquets, Shadowbox Frames, Scale Model Sets) ship within 24-48 hours. Custom Photo Cards take 2-3 business days for photo proofing and high-resolution cardstock printing. We deliver nationwide across India (Bangalore, Mumbai, Delhi, Hyderabad, Chennai, Mangalore and all PIN codes) within 2-5 business days via BlueDart, DTDC, and Delhivery with live tracking.',
    category: 'delivery'
  },
  {
    id: 'faq-3',
    question: 'What payment options and Cash on Delivery (COD) do you accept?',
    answer: 'We accept all major payment methods including UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and Cash on Delivery (COD). COD is supported on all standard bouquets, frames, and scale model sets. For customized photo blister cards, a small nominal booking deposit is required prior to printing.',
    category: 'payment'
  },
  {
    id: 'faq-4',
    question: 'How do I customize a Hot Wheels Blister Card with my photo?',
    answer: 'You can design your personalized card directly using our online "Custom Card Builder" or upload during checkout. You can also send your high-resolution photo and custom driver name directly to our WhatsApp concierge (+91-8431294886). We print on premium 350 GSM glossy cardstock and mount the car inside a crystal-clear factory blister bubble.',
    category: 'customization'
  },
  {
    id: 'faq-5',
    question: 'Can I choose specific Hot Wheels car castings or themes for my bouquet or frame?',
    answer: 'Absolutely! You can choose themes (JDM Icons, European Supercars, American Muscle, Vintage Classics, Fast & Furious) or message us on WhatsApp with specific casting requests. We maintain an inventory of over 1,000+ sealed Hot Wheels cars.',
    category: 'customization'
  },
  {
    id: 'faq-6',
    question: 'Where is Redline Garage based, and do you offer safe transit packaging?',
    answer: 'Redline Garage is based in Mangalore, Karnataka. Every order is packed inside a heavy-duty 5-ply reinforced corrugated box with form-fitted bubble cushioning and moisture barrier wraps. Wall frames include corner edge guards and shatterproof acrylic protection to guarantee 100% damage-free doorstep arrival.',
    category: 'delivery'
  },
  {
    id: 'faq-7',
    question: 'How does the free AI Hot Wheels Value Scanner work?',
    answer: 'Our AI Value Scanner uses Google Gemini vision models to analyze photos of any carded or loose die-cast car. It identifies the casting model, series release year, rarity tier, and provides an estimated secondary market collector valuation in Indian Rupees (INR) with collector tips.',
    category: 'care'
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
