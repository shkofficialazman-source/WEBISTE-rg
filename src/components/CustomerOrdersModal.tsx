import React, { useState, useEffect } from 'react';
import { FirestoreOrder, UserProfile } from '../types';
import { fetchCustomerOrdersFromFirestore } from '../firebase';
import { fetchOrdersFromSupabase } from '../supabase';
import { OrderHistoryStatus } from './OrderHistoryStatus';
import { ReferCollectorSection } from './ReferCollectorSection';
import { X, Package, Gift, RefreshCw } from 'lucide-react';

interface CustomerOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  initialTab?: 'orders' | 'referrals';
}

/**
 * Derive courier tracking URL from tracking number, courier name, or order number
 * Supports known courier templates: DTDC, BlueDart, Delhivery, India Post, Xpressbees, Ecom Express, Shadowfax, FedEx, DHL, etc.
 */
export const getCourierTrackingUrl = (
  trackingNumber?: string,
  courierName?: string,
  trackingUrl?: string,
  orderNumber?: string
): { url: string; courierDisplay: string; awb: string } => {
  const awb = (trackingNumber || orderNumber || '').trim();
  const courier = (courierName || '').trim();

  // If a direct tracking URL was provided/configured, prioritize it
  if (trackingUrl && (trackingUrl.startsWith('http://') || trackingUrl.startsWith('https://'))) {
    return {
      url: trackingUrl,
      courierDisplay: courier || 'Courier Service',
      awb,
    };
  }

  const cLower = courier.toLowerCase();

  // 1. DTDC Courier
  if (cLower.includes('dtdc')) {
    return {
      url: `https://www.dtdc.in/tracking/shipment-tracking.asp?trkid=${encodeURIComponent(awb)}`,
      courierDisplay: 'DTDC Courier',
      awb,
    };
  }

  // 2. BlueDart Express
  if (cLower.includes('bluedart') || cLower.includes('blue dart') || cLower.includes('blue-dart')) {
    return {
      url: `https://www.bluedart.com/tracking?trackNumber=${encodeURIComponent(awb)}`,
      courierDisplay: 'Blue Dart Express',
      awb,
    };
  }

  // 3. Delhivery Express
  if (cLower.includes('delhivery') || cLower.includes('delhivary')) {
    return {
      url: `https://www.delhivery.com/track/package/${encodeURIComponent(awb)}`,
      courierDisplay: 'Delhivery Express',
      awb,
    };
  }

  // 4. India Post / Speed Post
  if (cLower.includes('indiapost') || cLower.includes('india post') || cLower.includes('speed post') || cLower.includes('speedpost') || cLower.includes('post')) {
    return {
      url: `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`,
      courierDisplay: 'India Post Speed Post',
      awb,
    };
  }

  // 5. Xpressbees Logistics
  if (cLower.includes('xpressbees') || cLower.includes('xpress bees') || cLower.includes('xpressbee')) {
    return {
      url: `https://www.xpressbees.com/track?isawb=Yes&trackid=${encodeURIComponent(awb)}`,
      courierDisplay: 'Xpressbees Logistics',
      awb,
    };
  }

  // 6. Ecom Express
  if (cLower.includes('ecom') || cLower.includes('ecom express')) {
    return {
      url: `https://ecomexpress.in/tracking/?awb_number=${encodeURIComponent(awb)}`,
      courierDisplay: 'Ecom Express',
      awb,
    };
  }

  // 7. Shadowfax
  if (cLower.includes('shadowfax') || cLower.includes('shadow fax')) {
    return {
      url: `https://tracker.shadowfax.in/#/track/${encodeURIComponent(awb)}`,
      courierDisplay: 'Shadowfax',
      awb,
    };
  }

  // 8. FedEx
  if (cLower.includes('fedex') || cLower.includes('fed ex')) {
    return {
      url: `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(awb)}`,
      courierDisplay: 'FedEx Express',
      awb,
    };
  }

  // 9. DHL Express
  if (cLower.includes('dhl')) {
    return {
      url: `https://www.dhl.com/in-en/home/tracking/tracking-express.html?submit=1&tracking-id=${encodeURIComponent(awb)}`,
      courierDisplay: 'DHL Express',
      awb,
    };
  }

  // 10. Trackon
  if (cLower.includes('trackon')) {
    return {
      url: `http://trackon.in/Track.aspx?awb=${encodeURIComponent(awb)}`,
      courierDisplay: 'Trackon Courier',
      awb,
    };
  }

  // 11. The Professional Couriers (TPC)
  if (cLower.includes('professional') || cLower.includes('tpc')) {
    return {
      url: `https://www.tpcindia.com/tracking.aspx`,
      courierDisplay: 'The Professional Couriers',
      awb,
    };
  }

  // Pattern detection for India Post Consignment Number (e.g. EM123456789IN, EK123456789IN, RT123456789IN)
  if (/^[A-Z]{2}[0-9]{9}[A-Z]{2}$/i.test(awb) || /^[A-Z]{2}[0-9]{9}IN$/i.test(awb)) {
    return {
      url: `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`,
      courierDisplay: 'India Post Speed Post',
      awb,
    };
  }

  // Pattern detection for DTDC AWB (e.g. D12345678, Z12345678, B12345678, W12345678)
  if (/^[A-Z][0-9]{8,9}$/i.test(awb)) {
    return {
      url: `https://www.dtdc.in/tracking/shipment-tracking.asp?trkid=${encodeURIComponent(awb)}`,
      courierDisplay: 'DTDC Courier',
      awb,
    };
  }

  // Pattern detection for Delhivery (12-14 digits numeric)
  if (/^[0-9]{13,14}$/.test(awb)) {
    return {
      url: `https://www.delhivery.com/track/package/${encodeURIComponent(awb)}`,
      courierDisplay: 'Delhivery Express',
      awb,
    };
  }

  // Pattern detection for BlueDart (8-11 digits numeric)
  if (/^[0-9]{8,11}$/.test(awb)) {
    return {
      url: `https://www.bluedart.com/tracking?trackNumber=${encodeURIComponent(awb)}`,
      courierDisplay: 'Blue Dart Express',
      awb,
    };
  }

  // Universal fallback via Shiprocket tracking aggregator
  return {
    url: `https://shiprocket.co/tracking/${encodeURIComponent(awb)}`,
    courierDisplay: courier || 'Live Courier Tracking',
    awb,
  };
};

/**
 * Helper to get the tracking URL for any order object with tracking_number or trackingNumber
 */
export const getOrderTrackingUrl = (order: Partial<FirestoreOrder>): string | null => {
  const trackingNumber = order.tracking_number || order.trackingNumber;
  if (!trackingNumber || !trackingNumber.trim()) {
    return null;
  }
  const courierName = order.courier_name || order.courierName;
  const trackingUrl = order.tracking_url || order.trackingUrl;
  const orderNumber = order.orderNumber;
  return getCourierTrackingUrl(trackingNumber, courierName, trackingUrl, orderNumber).url;
};

export const CustomerOrdersModal: React.FC<CustomerOrdersModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  initialTab = 'orders',
}) => {
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'referrals'>(initialTab);

  const loadUserOrders = () => {
    if (!userProfile) return;
    setLoading(true);
    fetchOrdersFromSupabase()
      .then((allOrders) => {
        const matching = allOrders.filter(o =>
          (userProfile.uid && o.userId === userProfile.uid) ||
          (userProfile.email && o.customerEmail?.toLowerCase() === userProfile.email.toLowerCase())
        );
        if (matching.length > 0) {
          setOrders(matching);
          return;
        }
        // Fallback to firestore query
        return fetchCustomerOrdersFromFirestore(userProfile.uid, userProfile.email).then(data => {
          setOrders(data);
        });
      })
      .catch((err) => {
        console.error('Error fetching user orders from Supabase:', err);
        fetchCustomerOrdersFromFirestore(userProfile.uid, userProfile.email)
          .then(data => setOrders(data))
          .catch(() => setOrders([]));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen && userProfile) {
      loadUserOrders();
      setActiveTab(initialTab);
    }
  }, [isOpen, userProfile, initialTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white border border-zinc-200 text-zinc-900 rounded-t-3xl sm:rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative font-sans flex flex-col max-h-[92vh] sm:max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
              {activeTab === 'orders' ? <Package className="w-5 h-5" /> : <Gift className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-base uppercase font-mono tracking-tight text-zinc-900">
                {userProfile
                  ? activeTab === 'orders' ? 'Collector Garage & Orders' : 'Refer a Collector'
                  : 'Track My Orders'}
              </h3>
              <p className="text-xs text-zinc-500 font-mono truncate max-w-[200px] sm:max-w-md">
                {userProfile ? `${userProfile.name} • ${userProfile.email}` : 'Look up order status & live courier tracking'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {activeTab === 'orders' && userProfile && (
              <button
                onClick={loadUserOrders}
                disabled={loading}
                className="p-2 text-zinc-500 hover:text-red-600 rounded-lg hover:bg-zinc-200 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Refresh Orders"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-600' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Only if user is logged in, else orders view only) */}
        {userProfile && (
          <div className="grid grid-cols-2 p-2 bg-zinc-100/80 border-b border-zinc-200 font-mono text-xs gap-1.5 shrink-0">
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[40px] ${
                activeTab === 'orders'
                  ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Package className="w-4 h-4 text-red-600" />
              <span>Order History & Status</span>
            </button>
            <button
              onClick={() => setActiveTab('referrals')}
              className={`py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[40px] ${
                activeTab === 'referrals'
                  ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Gift className="w-4 h-4 text-red-600" />
              <span>Refer a Collector</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'orders' ? (
            <OrderHistoryStatus
              orders={orders}
              userProfile={userProfile}
              loading={loading}
            />
          ) : (
            <ReferCollectorSection
              userProfile={userProfile}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-zinc-200 bg-zinc-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-mono text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer min-h-[44px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
