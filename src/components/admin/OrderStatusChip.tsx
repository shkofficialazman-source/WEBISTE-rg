import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OrderStatus } from '../../types';
import {
  Clock,
  CheckCircle2,
  Truck,
  CheckCheck,
  ChevronDown,
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react';

export interface OrderStatusChipProps {
  status: OrderStatus;
  orderId?: string;
  orderNumber?: string;
  isUpdating?: boolean;
  onStatusChange?: (newStatus: OrderStatus) => void;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  showDropdown?: boolean;
  className?: string;
}

interface StatusConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeClasses: string;
  bgRgba: string;
  glowColor: string;
  borderClass: string;
  textClass: string;
  accentIconColor: string;
  description: string;
}

const STATUS_CONFIGS: Record<OrderStatus, StatusConfig> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    badgeClasses: 'bg-amber-50/90 text-amber-800 border-amber-300 shadow-amber-500/10',
    bgRgba: 'rgba(254, 243, 199, 0.95)',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    borderClass: 'border-amber-300',
    textClass: 'text-amber-800',
    accentIconColor: 'text-amber-600',
    description: 'Awaiting payment verification or packing',
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle2,
    badgeClasses: 'bg-blue-50/90 text-blue-800 border-blue-300 shadow-blue-500/10',
    bgRgba: 'rgba(239, 246, 255, 0.95)',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    borderClass: 'border-blue-300',
    textClass: 'text-blue-800',
    accentIconColor: 'text-blue-600',
    description: 'Payment verified & order queued for packaging',
  },
  shipped: {
    label: 'Shipped',
    icon: Truck,
    badgeClasses: 'bg-purple-50/90 text-purple-800 border-purple-300 shadow-purple-500/15',
    bgRgba: 'rgba(250, 245, 255, 0.95)',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    borderClass: 'border-purple-300',
    textClass: 'text-purple-800',
    accentIconColor: 'text-purple-600',
    description: 'Dispatched with tracking / AWB assigned',
  },
  delivered: {
    label: 'Delivered',
    icon: CheckCheck,
    badgeClasses: 'bg-emerald-50/90 text-emerald-800 border-emerald-300 shadow-emerald-500/15',
    bgRgba: 'rgba(236, 253, 245, 0.95)',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    borderClass: 'border-emerald-300',
    textClass: 'text-emerald-800',
    accentIconColor: 'text-emerald-600',
    description: 'Successfully delivered to customer doorstep',
  },
};

const ALL_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered'];

export const OrderStatusChip: React.FC<OrderStatusChipProps> = ({
  status,
  isUpdating = false,
  onStatusChange,
  size = 'md',
  interactive = false,
  showDropdown = false,
  className = '',
}) => {
  const prevStatusRef = useRef<OrderStatus>(status);
  const [justChanged, setJustChanged] = useState<boolean>(false);
  const [transitionEffect, setTransitionEffect] = useState<'shipped' | 'delivered' | 'confirmed' | 'general' | null>(null);
  const [isOpenMenu, setIsOpenMenu] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prevStatusRef.current !== status) {
      setJustChanged(true);

      if (status === 'shipped') {
        setTransitionEffect('shipped');
      } else if (status === 'delivered') {
        setTransitionEffect('delivered');
      } else if (status === 'confirmed') {
        setTransitionEffect('confirmed');
      } else {
        setTransitionEffect('general');
      }

      prevStatusRef.current = status;

      const timer = setTimeout(() => {
        setJustChanged(false);
        setTransitionEffect(null);
      }, 2200);

      return () => clearTimeout(timer);
    }
  }, [status]);

  // Click outside to close dropdown if interactive menu is open
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpenMenu(false);
      }
    };
    if (isOpenMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpenMenu]);

  const currentConfig = STATUS_CONFIGS[status] || STATUS_CONFIGS.pending;
  const IconComponent = currentConfig.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 font-mono tracking-wider',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-mono tracking-wider',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-mono tracking-wide',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      <motion.div
        layout
        initial={false}
        animate={{
          scale: justChanged ? [1, 1.08, 0.97, 1] : 1,
          boxShadow: justChanged
            ? [
                `0 0 0 0px ${currentConfig.glowColor}`,
                `0 0 0 6px ${currentConfig.glowColor}`,
                `0 0 0 0px transparent`,
              ]
            : '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        }}
        transition={{
          duration: 0.7,
          ease: [0.34, 1.56, 0.64, 1],
        }}
        className={`relative group inline-flex items-center justify-between rounded-full border font-bold uppercase transition-colors duration-500 select-none ${
          currentConfig.badgeClasses
        } ${sizeClasses} ${interactive ? 'cursor-pointer hover:shadow-md' : ''}`}
        onClick={() => {
          if (interactive && onStatusChange && !isUpdating) {
            setIsOpenMenu(prev => !prev);
          }
        }}
        title={currentConfig.description}
      >
        {/* Subtle background pulse highlight on transition */}
        <AnimatePresence>
          {justChanged && (
            <motion.span
              initial={{ opacity: 0.8, scale: 0.8 }}
              animate={{ opacity: 0, scale: 1.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                backgroundColor: currentConfig.glowColor,
              }}
            />
          )}
        </AnimatePresence>

        {/* Icon with animated rotation / slide on update */}
        <div className="relative flex items-center justify-center shrink-0">
          {isUpdating ? (
            <Loader2 className={`${iconSizes} animate-spin text-red-600`} />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={status}
                initial={{ rotate: -30, scale: 0.5, opacity: 0 }}
                animate={{
                  rotate: 0,
                  scale: justChanged ? [1, 1.25, 1] : 1,
                  opacity: 1,
                }}
                exit={{ rotate: 30, scale: 0.5, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 25,
                }}
                className="flex items-center"
              >
                <IconComponent className={`${iconSizes} ${currentConfig.accentIconColor}`} />
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Status text label with slide & fade */}
        <AnimatePresence mode="wait">
          <motion.span
            key={status}
            initial={{ y: 4, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -4, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`whitespace-nowrap ${currentConfig.textClass}`}
          >
            {currentConfig.label}
          </motion.span>
        </AnimatePresence>

        {/* Special Celebration Sparkle for Delivered & Shipped */}
        <AnimatePresence>
          {transitionEffect === 'delivered' && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="flex items-center text-emerald-600 pl-0.5"
            >
              <Sparkles className="w-3 h-3 animate-bounce" />
            </motion.span>
          )}
          {transitionEffect === 'shipped' && (
            <motion.span
              initial={{ x: -4, opacity: 0 }}
              animate={{ x: [0, 2, 0], opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="flex items-center text-purple-600 pl-0.5"
            >
              <Zap className="w-3 h-3" />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Optional Interactive Chevron */}
        {interactive && (
          <ChevronDown
            className={`w-3 h-3 ml-0.5 opacity-60 group-hover:opacity-100 transition-transform duration-200 ${
              isOpenMenu ? 'rotate-180' : ''
            }`}
          />
        )}
      </motion.div>

      {/* Interactive Dropdown Menu Popover */}
      <AnimatePresence>
        {isOpenMenu && onStatusChange && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute left-0 top-full mt-1.5 z-50 min-w-[170px] bg-white border border-zinc-200 rounded-xl shadow-xl p-1.5 font-mono text-xs overflow-hidden backdrop-blur-md"
          >
            <div className="px-2 py-1 text-[10px] font-bold uppercase text-zinc-400 border-b border-zinc-100 mb-1">
              Update Status
            </div>
            {ALL_STATUSES.map(s => {
              const cfg = STATUS_CONFIGS[s];
              const ItemIcon = cfg.icon;
              const isSelected = s === status;

              return (
                <button
                  key={s}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpenMenu(false);
                    if (s !== status) {
                      onStatusChange(s);
                    }
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    isSelected
                      ? `${cfg.badgeClasses} font-bold`
                      : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 font-medium'
                  }`}
                >
                  <ItemIcon className={`w-3.5 h-3.5 ${cfg.accentIconColor}`} />
                  <span className="capitalize text-[11px]">{cfg.label}</span>
                  {isSelected && (
                    <span className="ml-auto text-[10px] text-zinc-400 font-mono">✓</span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
