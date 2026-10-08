import React from 'react';
import Link from 'next/link';
import { ShoppingBag, PackageOpen, SearchX, Users, Sprout, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  type?: 'cart' | 'orders' | 'products' | 'farmers' | 'search' | 'generic';
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  type = 'generic',
  title,
  description,
  actionText,
  actionHref,
  onAction,
}: EmptyStateProps) {
  let defaultTitle = 'Nothing found here yet';
  let defaultDesc = 'Check back later or try adjusting your filters.';
  let defaultAction = 'Explore Marketplace';
  let defaultHref = '/explore';
  let Icon = PackageOpen;
  let iconBg = 'bg-forest-50 text-forest-700';

  if (type === 'cart') {
    Icon = ShoppingBag;
    iconBg = 'bg-emerald-50 text-emerald-700';
    defaultTitle = 'Your harvest basket is empty';
    defaultDesc = 'Discover freshly picked produce directly from local verified farmers in Bengaluru.';
    defaultAction = 'Start Shopping Fresh';
    defaultHref = '/explore';
  } else if (type === 'orders') {
    Icon = PackageOpen;
    iconBg = 'bg-earth-100 text-earth-800';
    defaultTitle = 'No orders placed yet';
    defaultDesc = 'When you order directly from local farmers, your active deliveries and harvest tracking will appear here.';
    defaultAction = 'Explore Fresh Harvests';
    defaultHref = '/explore';
  } else if (type === 'search') {
    Icon = SearchX;
    iconBg = 'bg-amber-50 text-amber-700';
    defaultTitle = 'No matching produce or farmers';
    defaultDesc = 'Try searching with different keywords like "tomato", "milk", or "organic".';
    defaultAction = 'Clear Filters & Browse All';
    defaultHref = '/explore';
  } else if (type === 'farmers') {
    Icon = Users;
    iconBg = 'bg-emerald-50 text-emerald-800';
    defaultTitle = 'No farmers match this radius';
    defaultDesc = 'We are onboarding more local regenerative growers across Bengaluru weekly.';
    defaultAction = 'View All Verified Farmers';
    defaultHref = '/farmers';
  } else if (type === 'products') {
    Icon = Sprout;
    iconBg = 'bg-forest-50 text-forest-700';
    defaultTitle = 'No produce in this category right now';
    defaultDesc = 'Fresh crops are harvested based on seasonal schedules. Check other categories or subscribe for restock alerts.';
    defaultAction = 'View All Categories';
    defaultHref = '/explore';
  }

  const resolvedTitle = title || defaultTitle;
  const resolvedDesc = description || defaultDesc;
  const resolvedAction = actionText || defaultAction;
  const resolvedHref = actionHref || defaultHref;

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl bg-white/70 border border-earth-200/70 shadow-xs max-w-lg mx-auto my-6">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${iconBg} shadow-inner`}>
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-2">{resolvedTitle}</h3>
      <p className="text-sm text-slate-600 max-w-md leading-relaxed mb-6">{resolvedDesc}</p>

      {onAction ? (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-800 text-white font-medium text-sm hover:bg-forest-900 transition-colors shadow-xs"
        >
          <span>{resolvedAction}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      ) : (
        <Link
          href={resolvedHref}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-800 text-white font-medium text-sm hover:bg-forest-900 transition-colors shadow-xs"
        >
          <span>{resolvedAction}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
