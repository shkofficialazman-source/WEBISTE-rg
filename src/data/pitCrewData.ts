import { PitCrewMemberInfo, PitCrewRole } from '../types';

export const PIT_CREW_MEMBERS: Record<PitCrewRole, PitCrewMemberInfo> = {
  turbo: {
    id: 'turbo',
    name: 'Turbo',
    title: 'Chief Pit Mascot & Gift Concierge',
    avatar: '🏎️🐾',
    badge: 'Mascot & Gifts',
    specialty: 'Bouquet curation, birthday & anniversary surprises, shipping & garage discounts',
    description: 'Energetic, lovable, and knows exactly what car lover gift will make someone jump with joy!',
    welcomeMessage: `Hey there, driver! 🏎️💨 I'm **Turbo**, the Redline Garage Pit Mascot! Whether you need a jaw-dropping Hot Wheels bouquet with LED lights, a custom photo card surprise, or shipping details across India, I'm at your service! What are we racing toward today?`,
  },
  sparky: {
    id: 'sparky',
    name: 'Sparky',
    title: 'The Die-Cast Sage & STH Appraiser',
    avatar: '🔍🏆',
    badge: 'Collector & Valuation',
    specialty: 'Super Treasure Hunts ($TH), Treasure Hunts (TH), RLC rarity, casting history & values',
    description: 'Veteran die-cast collector with encyclopedic knowledge of Mattel mainline cases, rubber Real Riders, and rarity tiers.',
    welcomeMessage: `Greetings, collector! 🔍 Sparky here on the pit wall. Got questions about a rare casting, spotting a Super Treasure Hunt ($TH), Spectraflame paint, or current collector market prices in India? Ask away!`,
  },
  gearbox: {
    id: 'gearbox',
    name: 'Gearbox',
    title: 'Custom Gift Engineer & Designer',
    avatar: '🛠️📐',
    badge: 'Custom Cards & Frames',
    specialty: '350 GSM custom blister cards, AI comic art stylizing, acrylic shadowbox specs',
    description: 'Precision craftsman behind personalized blister card packaging and museum-grade wall frames.',
    welcomeMessage: `Hey maker! 🛠️ Gearbox at your drafting table. Want to know how to turn your car or couple photo into a real Hot Wheels blister pack card, or how our acrylic shadowbox frames mount to your wall? Let's build something epic!`,
  },
};

export interface QuickPrompt {
  id: string;
  label: string;
  icon: string;
  crewRole: PitCrewRole;
  prompt: string;
}

export const PIT_CREW_QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'qp-gift-under-2000',
    label: '🎁 Gift under ₹2,000',
    icon: '🎁',
    crewRole: 'turbo',
    prompt: 'What are your top recommended Hot Wheels gifts under ₹2,000 for a car lover or boyfriend?',
  },
  {
    id: 'qp-spot-sth',
    label: '🔍 How to spot a Super Treasure Hunt ($TH)',
    icon: '🔍',
    crewRole: 'sparky',
    prompt: 'How do I identify a real Super Treasure Hunt ($TH) vs a regular mainline Hot Wheels car?',
  },
  {
    id: 'qp-custom-card-photo',
    label: '📸 Custom Card Photo Guide',
    icon: '📸',
    crewRole: 'gearbox',
    prompt: 'How do I upload photos and customize a personalized Hot Wheels blister card with my name?',
  },
  {
    id: 'qp-shipping-timeline',
    label: '⚡ Shipping & Pan-India Delivery',
    icon: '🚚',
    crewRole: 'turbo',
    prompt: 'What are the delivery times and COD options for shipping across India?',
  },
  {
    id: 'qp-bouquets-led',
    label: '💐 Hot Wheels Bouquets with LEDs',
    icon: '💐',
    crewRole: 'turbo',
    prompt: 'Tell me about your Hot Wheels bouquets. How many cars come in each, and do they include LED lights?',
  },
  {
    id: 'qp-jdm-castings',
    label: '🚗 Best JDM & Supercar Castings',
    icon: '🏆',
    crewRole: 'sparky',
    prompt: 'What are the most popular JDM and Supercar castings you have in stock right now?',
  },
];
