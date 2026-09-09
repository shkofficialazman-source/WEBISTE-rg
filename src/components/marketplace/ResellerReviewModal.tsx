import React, { useState } from 'react';
import { X, Star, CheckCircle2 } from 'lucide-react';
import { ResellerListing } from '../../types';
import { submitResellerReview } from '../../marketplace';

interface ResellerReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: ResellerListing;
  onReviewSubmitted?: () => void;
}

export const ResellerReviewModal: React.FC<ResellerReviewModalProps> = ({
  isOpen,
  onClose,
  listing,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim() || !comment.trim()) return;

    setIsSubmitting(true);
    try {
      await submitResellerReview({
        listing_id: listing.id,
        reseller_id: listing.reseller_id,
        buyer_name: buyerName.trim(),
        buyer_phone: buyerPhone.trim() || undefined,
        rating,
        comment: comment.trim(),
      });
      setIsSuccess(true);
      if (onReviewSubmitted) onReviewSubmitted();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full border border-zinc-200 shadow-2xl overflow-hidden">
        <div className="bg-zinc-950 text-white p-4 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <h3 className="text-sm font-black uppercase font-mono tracking-wider">
              Rate Reseller: {listing.reseller_name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-full transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-zinc-900 uppercase font-mono">
              Review Submitted
            </h4>
            <p className="text-xs text-zinc-600 font-sans">
              Your feedback helps other collectors trade safely on Redline Garage!
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
            <div className="text-xs text-zinc-600">
              Purchased: <span className="font-bold text-zinc-900">{listing.car_name}</span>
            </div>

            {/* Star Rating Selector */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1.5">
                Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-zinc-300 hover:text-amber-400 transition cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-200'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold font-mono text-zinc-700 ml-2">
                  {rating} / 5 Stars
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                Your Review *
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                required
                rows={3}
                placeholder="How was the packaging, communication, and car condition?"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium outline-hidden focus:ring-2 focus:ring-red-600 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={e => setBuyerName(e.target.value)}
                  placeholder="Collector Name"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium outline-hidden focus:ring-2 focus:ring-red-600"
                />
              </div>
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={buyerPhone}
                  onChange={e => setBuyerPhone(e.target.value)}
                  placeholder="+91..."
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium outline-hidden focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-mono font-bold uppercase text-zinc-500 hover:text-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !buyerName.trim() || !comment.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Posting...' : 'Post Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
