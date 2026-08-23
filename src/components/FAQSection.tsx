import React, { useState } from 'react';
import { FAQS } from '../data/extraData';
import { ChevronDown, HelpCircle, Search } from 'lucide-react';

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
    <section id="faq" className="py-20 bg-zinc-50 text-zinc-900 relative border-b border-zinc-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
        
        {/* Title */}
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-red-600 uppercase tracking-widest bg-red-50 px-3.5 py-1.5 rounded-full border border-red-200">
            <HelpCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tight font-sans text-zinc-900">
            Frequently Asked <span className="text-red-600">Questions</span>
          </h2>
          <p className="text-zinc-600 text-sm font-normal">
            Everything you need to know about delivery times, customization, care, and payment options.
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="space-y-4 mb-8">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search FAQ (e.g. delivery time, photo upload, COD)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white border border-zinc-300 rounded-xl pl-11 pr-4 py-3 text-xs text-zinc-900 font-mono focus:border-red-600 focus:outline-hidden shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: 'all', label: 'All FAQs' },
              { id: 'delivery', label: 'Delivery & Shipping' },
              { id: 'customization', label: 'Customization Process' },
              { id: 'care', label: 'Authenticity & Care' },
              { id: 'payment', label: 'Payment & COD' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase whitespace-nowrap transition-all border cursor-pointer ${
                  activeCategory === tab.id
                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:text-zinc-900 hover:border-zinc-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.map((faq) => {
            const isOpen = openId === faq.id;

            return (
              <div
                key={faq.id}
                className="bg-white border border-zinc-200 rounded-xl overflow-hidden transition-all shadow-xs"
              >
                <button
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  className="w-full p-5 text-left font-bold text-sm sm:text-base text-zinc-900 flex items-center justify-between gap-4 font-sans hover:text-red-600 transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-red-600 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-zinc-600 font-normal leading-relaxed border-t border-zinc-100">
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
