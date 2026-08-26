import React, { useState, useEffect } from 'react';
import { Product, ProductReview, UserProfile } from '../types';
import { getProductReviews, addProductReview, getProductRatingStats, subscribeToReviews } from '../reviews';
import { Star, CheckCircle2, MessageSquare, ThumbsUp, User, Sparkles, AlertCircle, Plus, Send } from 'lucide-react';

interface ProductReviewsSectionProps {
  product: Product;
  userProfile?: UserProfile | null;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  product,
  userProfile,
}) => {
  const [reviews, setReviews] = useState<ProductReview[]>(getProductReviews(product.id));
  const [stats, setStats] = useState(getProductRatingStats(product.id, product.rating, product.reviewsCount));
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Review Form State
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [userNameInput, setUserNameInput] = useState(userProfile?.name || '');
  const [titleInput, setTitleInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    setReviews(getProductReviews(product.id));
    setStats(getProductRatingStats(product.id, product.rating, product.reviewsCount));

    const unsub = subscribeToReviews((all) => {
      setReviews(getProductReviews(product.id));
      setStats(getProductRatingStats(product.id, product.rating, product.reviewsCount));
    });
    return () => unsub();
  }, [product.id]);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userNameInput.trim()) {
      setFormError('Please enter your name.');
      return;
    }
    if (!commentInput.trim() || commentInput.trim().length < 5) {
      setFormError('Please write a brief review comment (min 5 characters).');
      return;
    }

    const newRev = addProductReview({
      productId: product.id,
      userId: userProfile?.uid,
      userName: userNameInput.trim(),
      rating: ratingInput,
      title: titleInput.trim() || undefined,
      comment: commentInput.trim(),
      verifiedPurchase: true,
      helpfulVotes: 0,
    });

    setFormSuccess(true);
    setFormError('');
    setTitleInput('');
    setCommentInput('');
    setTimeout(() => {
      setFormSuccess(false);
      setShowReviewForm(false);
    }, 2000);
  };

  return (
    <div className="space-y-4 pt-4 border-t border-zinc-200 text-left font-sans">
      {/* Header & Stats Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50 border border-zinc-200 p-3.5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="text-center px-2 py-1 bg-white border border-zinc-200 rounded-xl shadow-2xs">
            <div className="text-2xl font-black font-mono text-zinc-900 leading-none">
              {stats.averageRating.toFixed(1)}
            </div>
            <div className="flex text-amber-400 justify-center mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${
                    star <= Math.round(stats.averageRating)
                      ? 'fill-amber-400 text-amber-500'
                      : 'text-zinc-200'
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-extrabold text-sm text-zinc-900 font-mono uppercase tracking-tight">
              Collector Ratings & Reviews
            </h4>
            <p className="text-xs text-zinc-500 font-mono">
              Based on {stats.totalReviews} verified collector appraisals
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowReviewForm(!showReviewForm)}
          className="inline-flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-black text-white px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition shadow-xs cursor-pointer min-h-[38px] active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showReviewForm ? 'Cancel Review' : 'Write a Review'}</span>
        </button>
      </div>

      {/* Review Submission Form */}
      {showReviewForm && (
        <form
          onSubmit={handleSubmitReview}
          className="bg-white border-2 border-red-200 rounded-2xl p-4 space-y-3 font-mono text-xs shadow-md animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <h5 className="font-extrabold text-xs uppercase text-zinc-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-red-600" />
              <span>Share Your Die-Cast Feedback</span>
            </h5>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
              ✓ Verified Collector Review
            </span>
          </div>

          {formSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Review submitted successfully! Thank you for supporting the garage.</span>
            </div>
          )}

          {formError && (
            <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Star Rating Selector */}
          <div>
            <label className="block text-[10px] uppercase text-zinc-500 mb-1 font-bold">
              Your Rating: {ratingInput} / 5 Stars
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingInput(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 hover:scale-125 transition-transform cursor-pointer"
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= (hoverRating || ratingInput)
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-zinc-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] uppercase text-zinc-500 mb-1 font-bold">
                Your Name / Collector Tag
              </label>
              <input
                type="text"
                required
                value={userNameInput}
                onChange={(e) => setUserNameInput(e.target.value)}
                placeholder="e.g. Vikram R."
                className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs text-zinc-900 focus:border-red-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase text-zinc-500 mb-1 font-bold">
                Review Headline (Optional)
              </label>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="e.g. Mint card condition & fast delivery!"
                className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs text-zinc-900 focus:border-red-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-zinc-500 mb-1 font-bold">
              Review Details
            </label>
            <textarea
              required
              rows={3}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Tell other collectors about paint finish, blister card protection, packaging quality..."
              className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-2.5 text-xs text-zinc-900 focus:border-red-600 focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-500 text-white font-extrabold py-2.5 rounded-xl text-xs uppercase tracking-wider transition shadow-md shadow-red-600/20 flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px]"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Collector Review</span>
          </button>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {reviews.length === 0 ? (
          <div className="text-center py-6 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500 font-mono">
            No reviews yet for this casting. Be the first collector to review!
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-zinc-50/70 border border-zinc-200/80 rounded-xl p-3 space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-100 border border-red-200 text-red-600 flex items-center justify-center font-bold text-[10px] uppercase">
                    {rev.userName.charAt(0)}
                  </div>
                  <span className="font-bold text-zinc-900">{rev.userName}</span>
                  {rev.verifiedPurchase && (
                    <span className="text-[9px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                    </span>
                  )}
                </div>

                <div className="flex text-amber-400 gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3 h-3 ${
                        s <= rev.rating ? 'fill-amber-400 text-amber-500' : 'text-zinc-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {rev.title && (
                <div className="font-bold text-zinc-900 text-xs font-mono">
                  {rev.title}
                </div>
              )}

              <p className="text-zinc-600 text-xs leading-relaxed font-sans">
                {rev.comment}
              </p>

              <div className="text-[10px] text-zinc-400 font-mono">
                {new Date(rev.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
