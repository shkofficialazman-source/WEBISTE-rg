import React, { useRef } from 'react';
import { FirestoreOrder, OrderItem } from '../types';
import { X, Printer, Download, Share2, ShieldCheck, CheckCircle2, IndianRupee, Truck, Calendar, Sparkles } from 'lucide-react';
import { RedlineLogo } from './RedlineLogo';

interface InvoiceModalProps {
  order: FirestoreOrder;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const invoiceNumber = `INV-${order.orderNumber.replace(/[^a-zA-Z0-9]/g, '')}`;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const rawPhone = (order.customerPhone || '').replace(/\D/g, '');
    const phone = rawPhone.length >= 10 ? (rawPhone.startsWith('91') ? rawPhone : `91${rawPhone.slice(-10)}`) : '';
    
    let itemsSummary = (order.items || [])
      .map(i => `• ${i.productName || (i as any).name || 'Hot Wheels'} (x${i.quantity || 1}) - ₹${((i.price || 0) * (i.quantity || 1)).toFixed(2)}`)
      .join('\n');

    const msg = `*REDLINE GARAGE - OFFICIAL INVOICE*\n` +
      `Invoice #: ${invoiceNumber}\n` +
      `Order #: #${order.orderNumber}\n` +
      `Date: ${formattedDate}\n` +
      `Customer: ${order.customerName}\n\n` +
      `*Items:*\n${itemsSummary}\n\n` +
      `*Subtotal:* ₹${Number(order.subtotal || order.total).toFixed(2)}\n` +
      (order.referralDiscount ? `*Discount:* -₹${Number(order.referralDiscount).toFixed(2)}\n` : '') +
      (order.loyaltyDiscount ? `*Loyalty Discount:* -₹${Number(order.loyaltyDiscount).toFixed(2)}\n` : '') +
      (order.shipping ? `*Shipping:* ₹${Number(order.shipping).toFixed(2)}\n` : '') +
      `*Grand Total:* ₹${Number(order.total).toFixed(2)}\n` +
      `*Payment:* ${order.paymentMethod || 'WhatsApp / UPI'}\n` +
      `*Status:* ${order.status.toUpperCase()}\n\n` +
      `Thank you for collecting with Redline Garage! 🏁`;

    const waUrl = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static print:z-auto">
      {/* Container */}
      <div className="bg-white border border-zinc-200 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden font-sans text-zinc-900 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-0 print:rounded-none">
        
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="bg-zinc-900 text-white px-5 py-3.5 flex items-center justify-between print:hidden shrink-0 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <span className="font-bold uppercase tracking-wider">Official Invoice Preview</span>
            <span className="text-zinc-400">({order.orderNumber})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
              title="Share Invoice on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document Body */}
        <div ref={invoiceRef} className="p-6 sm:p-10 overflow-y-auto print:p-0 space-y-8 text-zinc-800">
          
          {/* Header & Logo */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-zinc-900 pb-6">
            <div>
              <RedlineLogo variant="full" theme="light" />
              <p className="text-xs text-zinc-500 font-mono mt-1">
                Official Die-Cast &amp; Collector Gift Studio India
              </p>
            </div>

            <div className="text-left sm:text-right font-mono text-xs space-y-0.5">
              <div className="text-lg font-black text-red-600">{invoiceNumber}</div>
              <div className="text-zinc-500">Order ID: #{order.orderNumber}</div>
              <div className="text-zinc-500">Date: {formattedDate}</div>
              <div className="inline-block mt-1 bg-zinc-100 text-zinc-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                Status: {order.status.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Customer & Garage Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-mono text-xs">
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                Billed & Shipped To:
              </div>
              <div className="font-bold text-sm text-zinc-900 font-sans">{order.customerName}</div>
              <div className="text-zinc-600">Phone: {order.customerPhone || 'N/A'}</div>
              {order.customerEmail && <div className="text-zinc-600">Email: {order.customerEmail}</div>}
              {order.customerAddress && (
                <div className="text-zinc-600 font-sans pt-1 border-t border-zinc-200/60 mt-1">
                  {order.customerAddress}
                </div>
              )}
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                Fulfilled By:
              </div>
              <div className="font-bold text-sm text-zinc-900 font-sans">Redline Garage Studio</div>
              <div className="text-zinc-600">Support: WhatsApp & UPI Verified</div>
              <div className="text-zinc-600">Web: redlinegarage.store</div>
              <div className="text-zinc-600 pt-1 border-t border-zinc-200/60 mt-1">
                Payment: <strong className="text-zinc-900">{order.paymentMethod || 'UPI / WhatsApp Pay'}</strong>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto border border-zinc-200 rounded-xl">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-zinc-900 text-white uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Item & Specification</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {(order.items || []).map((item: any, idx: number) => {
                  const name = item.productName || item.name || item.product?.name || 'Die-Cast Vehicle';
                  const qty = Number(item.quantity || 1);
                  const price = Number(item.price || item.product?.price || 0);
                  const total = price * qty;
                  const custom = item.customization;

                  return (
                    <tr key={idx} className="hover:bg-zinc-50/50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-900 font-sans">{name}</div>
                        {custom && (
                          <div className="text-[10px] text-red-600 font-mono mt-0.5 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>
                              Custom Blister: {custom.driverName} ({custom.carTitle}) - {custom.cardTheme}
                            </span>
                          </div>
                        )}
                        <div className="text-[10px] text-zinc-400 font-mono">
                          Authentic 1:64 Scale Die-Cast & Premium Presentation Pack
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-zinc-700">{qty}</td>
                      <td className="py-3 px-4 text-right text-zinc-700">₹{price.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-bold text-zinc-900">₹{total.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="font-mono text-xs space-y-2 max-w-sm text-zinc-500">
              <div className="flex items-center gap-1.5 text-zinc-800 font-bold">
                <ShieldCheck className="w-4 h-4 text-red-600" />
                <span>Genuine Die-Cast Guarantee</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                All castings sold by Redline Garage are 100% genuine licensed die-cast vehicles. Keep this invoice for collector provenance and tracking.
              </p>
              {order.trackingNumber && (
                <div className="bg-sky-50 border border-sky-200 text-sky-900 p-2.5 rounded-lg text-[10px] flex items-center gap-2">
                  <Truck className="w-4 h-4 text-sky-600 shrink-0" />
                  <div>
                    <strong>Courier:</strong> {order.courierName || 'Express Logistics'} • <strong>AWB:</strong> {order.trackingNumber}
                  </div>
                </div>
              )}
            </div>

            {/* Calculations Box */}
            <div className="w-full sm:w-72 bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-2 font-mono text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal:</span>
                <span>₹{Number(order.subtotal || order.total).toFixed(2)}</span>
              </div>

              {Number(order.referralDiscount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Referral Discount:</span>
                  <span>-₹{Number(order.referralDiscount).toFixed(2)}</span>
                </div>
              )}

              {Number(order.loyaltyDiscount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Loyalty Discount:</span>
                  <span>-₹{Number(order.loyaltyDiscount).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-zinc-600">
                <span>Shipping:</span>
                <span>{Number(order.shipping || 0) === 0 ? 'FREE' : `₹${Number(order.shipping).toFixed(2)}`}</span>
              </div>

              <div className="border-t-2 border-zinc-900 pt-2 flex justify-between font-black text-base text-zinc-900">
                <span>Grand Total:</span>
                <span className="text-red-600">₹{Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Signoff */}
          <div className="pt-6 border-t border-zinc-200 text-center font-mono text-[11px] text-zinc-400 space-y-1">
            <div>Thank you for building your collection with Redline Garage India.</div>
            <div className="text-[10px] text-zinc-300">Generated securely by Redline Garage Invoice Engine</div>
          </div>

        </div>

      </div>
    </div>
  );
};
