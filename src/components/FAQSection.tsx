import React, { useState } from 'react';
import { FAQS } from '../data/extraData';
import { ChevronDown, Search } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('faq-1');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [query, setQuery] = useState('');

  const filteredFaqs = FAQS.filter(faq => {
    const matchesCat = activeCategory === 'all' || faq.category === activeCategory;
    const matchesQuery = query === '' || 
      faq.question.toLowerCase().includes(query.toLowerCase()) || 
      faq.answer.toLowerCase().includes(query.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <section id="faq" className="py-16 sm:py-24 bg-[#fafafa] text-zinc-900 border-b border-zinc-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-6 border-b border-zinc-200 text-left">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-zinc-500">
              COLLECTOR ADVISORY
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold uppercase tracking-tight text-zinc-950">
              Frequently Asked Questions
            </h2>
          </div>
          <p className="text-zinc-500 font-mono text-xs max-w-xs text-left md:text-right">
            Dispatch timelines, custom photo card orders, and authenticity verification.
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="space-y-3 mb-8">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search FAQs (e.g. delivery time, photo cards, tracking)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white border border-zinc-300 rounded-lg pl-10 pr-4 py-2.5 text-xs text-zinc-900 font-mono focus:border-zinc-900 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: 'all', label: 'All Inquiries' },
              { id: 'delivery', label: 'Shipping & Delivery' },
              { id: 'customization', label: 'Customization' },
              { id: 'care', label: 'Authenticity & Packaging' },
              { id: 'payment', label: 'Payment Options' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold uppercase whitespace-nowrap transition-all border cursor-pointer ${
                  activeCategory === tab.id
                    ? 'bg-zinc-950 text-white border-zinc-950 shadow-2xs'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:text-zinc-900 hover:border-zinc-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion List */}
        <div className="space-y-2.5">
          {filteredFaqs.map((faq) => {
            const isOpen = openId === faq.id;

            return (
              <div
                key={faq.id}
                className="bg-white border border-zinc-200 rounded-xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  className="w-full p-4 text-left font-bold text-xs sm:text-sm text-zinc-950 flex items-center justify-between gap-4 font-sans hover:text-red-600 transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-zinc-950' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-zinc-600 font-sans leading-relaxed border-t border-zinc-100">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
