import React, { useState } from 'react';
import { X, Flag, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { submitMarketplaceReport } from '../../marketplace';

interface MarketplaceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId?: string;
  conversationId?: string;
  reportedItemOrUser: string;
}

const REPORT_REASONS = [
  'Suspected counterfeit / fake casting',
  'Misrepresented condition (photos do not match)',
  'Demanding off-platform unsafe advance payments',
  'Abusive or harassing communication',
  'Item already sold elsewhere but listing kept active',
  'Non-delivery or scam report',
  'Other violation',
];

export const MarketplaceReportModal: React.FC<MarketplaceReportModalProps> = ({
  isOpen,
  onClose,
  listingId,
  conversationId,
  reportedItemOrUser,
}) => {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reporterName.trim()) return;

    setIsSubmitting(true);
    try {
      await submitMarketplaceReport({
        listing_id: listingId,
        conversation_id: conversationId,
        reporter_role: 'buyer',
        reporter_name: reporterName.trim(),
        reporter_phone: reporterPhone.trim() || undefined,
        reported_item_or_user: reportedItemOrUser,
        reason,
        details: details.trim() || undefined,
      });
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full border border-zinc-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-zinc-950 text-white p-4 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-black uppercase font-mono tracking-wider">
              Report Marketplace Listing / Seller
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
              Report Submitted
            </h4>
            <p className="text-xs text-zinc-600 font-sans">
              Thank you for keeping Redline Garage secure. Our moderation team will investigate this listing and take appropriate action.
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
              Reporting: <span className="font-bold text-zinc-900">{reportedItemOrUser}</span>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                Reason for Report *
              </label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-600 outline-hidden cursor-pointer"
              >
                {REPORT_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-zinc-700 mb-1">
                Additional Details
              </label>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                rows={3}
                placeholder="Explain the issue..."
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-600 outline-hidden resize-none"
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
                  value={reporterName}
                  onChange={e => setReporterName(e.target.value)}
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
                  value={reporterPhone}
                  onChange={e => setReporterPhone(e.target.value)}
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
                disabled={isSubmitting || !reporterName.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-mono font-bold uppercase transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
