'use client';

import React from 'react';
import { useFarmer } from '@/context/FarmerContext';
import { SalesChart } from '@/components/farmer/SalesChart';
import { StatCard } from '@/components/farmer/StatCard';
import {
  TOP_SELLING_PRODUCTS,
  RECENT_SALES_TRANSACTIONS,
} from '@/data/sales';
import { useAuth } from '@/context/AuthContext';
import { isFarmerPending, isFarmerRejected } from '@/types';
import { VerificationPending } from '@/components/farmer/VerificationPending';
import { VerificationRejected } from '@/components/farmer/VerificationRejected';
import {
  TrendingUp,
  IndianRupee,
  Calendar,
  Award,
  CheckCircle2,
  Clock,
  Download,
  AlertCircle,
} from 'lucide-react';

export default function FarmerSalesPage() {
  const { sales, salesSummary } = useFarmer();
  const { user, verificationStatus } = useAuth();

  const currentStatus = user?.verificationStatus || verificationStatus;
  if (isFarmerPending(currentStatus)) {
    return <VerificationPending />;
  }
  if (isFarmerRejected(currentStatus)) {
    return <VerificationRejected />;
  }

  const isDemo = user?.id === 'demo-farmer' || user?.id === 'farmer-ravi';

  // Use real PostgreSQL data for authenticated farmers, fallback to mock only for demo
  const transactions = isDemo
    ? RECENT_SALES_TRANSACTIONS
    : (sales && sales.length > 0 ? sales : (salesSummary.recentTransactions || []));

  const topProducts = isDemo
    ? TOP_SELLING_PRODUCTS
    : (salesSummary.topProducts || []);

  const monthlyData = isDemo ? undefined : (salesSummary.monthlyRevenue || []);

  const formatStatusPill = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'PAID_OUT') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Paid Out</span>
        </span>
      );
    }
    if (s === 'PENDING_PAYOUT' || s === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>Pending Payout</span>
        </span>
      );
    }
    if (s === 'REFUNDED') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          <span>Refunded</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        <span>Completed</span>
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-earth-200/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
            Sales & Earnings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Transparent breakdown of your 75% farmer direct share with zero intermediary cuts
          </p>
        </div>

        <button
          onClick={() => alert('Payout Statement downloaded as CSV/PDF.')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-earth-200 bg-white hover:bg-earth-50 text-slate-700 text-xs font-bold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4 text-forest-700" />
          <span>Export Payout Statement</span>
        </button>
      </div>

      {/* 4 Sales Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <StatCard
          label="Today's Sales"
          value={`₹${(salesSummary.todaySales || 0).toLocaleString('en-IN')}`}
          icon={Calendar}
          trendText="+18% vs yesterday"
          trendDirection="up"
          accentColor="forest"
          subtitle="Direct daily harvest bookings"
        />

        {/* This Week */}
        <StatCard
          label="This Week"
          value={`₹${(salesSummary.thisWeekSales || 0).toLocaleString('en-IN')}`}
          icon={TrendingUp}
          trendText={salesSummary.weeklyTrend || '+0% vs last week'}
          trendDirection="up"
          accentColor="emerald"
          subtitle="Mon – Sun aggregate"
        />

        {/* This Month */}
        <StatCard
          label="This Month"
          value={`₹${(salesSummary.thisMonthSales || 0).toLocaleString('en-IN')}`}
          icon={IndianRupee}
          trendText={salesSummary.monthlyTrend || '+0% from last month'}
          trendDirection="up"
          accentColor="amber"
          subtitle="Direct farm earnings"
        />

        {/* Total Earnings */}
        <StatCard
          label="Total Earnings"
          value={`₹${(salesSummary.totalEarnings || salesSummary.totalRevenue || 0).toLocaleString('en-IN')}`}
          icon={Award}
          trendText="Lifetime direct payouts"
          trendDirection="neutral"
          accentColor="sky"
          subtitle="Since joining platform"
        />
      </div>

      {/* Charts Section: Revenue/Orders Over Time + Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Revenue & Orders Chart (7 Cols) */}
        <div className="lg:col-span-7">
          <SalesChart
            title="Revenue & Orders Over Time"
            subtitle="Real-time revenue velocity from delivered orders"
            monthlyData={monthlyData}
            isRealData={!isDemo}
          />
        </div>

        {/* Top-Selling Products Card (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-earth-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-earth-100">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-forest-700">
                Market Velocity
              </span>
              <h2 className="text-base font-bold text-slate-900 font-serif">
                Top-Selling Farm Produce
              </h2>
            </div>
            <Award className="w-5 h-5 text-amber-500" />
          </div>

          <div className="space-y-3.5">
            {topProducts.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-earth-200 rounded-2xl bg-earth-50/50 space-y-1">
                <p className="text-xs font-bold text-slate-700 font-serif">No sales recorded yet</p>
                <p className="text-[11px] text-slate-400">
                  Delivered orders will rank your best-performing farm crops here.
                </p>
              </div>
            ) : (
              topProducts.map((prod) => (
                <div
                  key={prod.rank}
                  className="p-3.5 rounded-2xl bg-earth-50/70 border border-earth-100 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-5 h-5 rounded-full bg-forest-800 text-white text-[10px] flex items-center justify-center font-bold">
                        {prod.rank}
                      </span>
                      <span>{prod.name}</span>
                    </div>
                    <div className="font-extrabold text-forest-950 text-sm">
                      ₹{prod.revenue.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                    <span>Sold: {prod.quantitySold}</span>
                    <span>{prod.percent}% of harvest revenue</span>
                  </div>

                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, prod.percent * 2)}%` }}
                      className="bg-forest-700 h-full rounded-full"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sales Transactions Table */}
      <div className="bg-white rounded-3xl border border-earth-200/80 shadow-xs overflow-hidden space-y-0">
        <div className="p-6 pb-4 border-b border-earth-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-serif">
              Recent Sales & Settlements
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Itemized ledger of consumer orders and credited earnings
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Next Settlement: Friday 10:00 AM
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-earth-200 bg-earth-50/60 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Quantity</th>
                <th className="py-3.5 px-4">Revenue</th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-earth-100 font-medium text-slate-700">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <p className="text-sm font-bold text-slate-700 font-serif">
                        No sales transactions recorded yet
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Sales records and payouts are automatically created when customer orders reach Delivered status.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id || (t as any).saleCode} className="hover:bg-earth-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {t.orderId}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{t.date}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {t.productName}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {t.quantity} {t.unit}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-forest-950 text-sm">
                      ₹{t.revenue}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {formatStatusPill(t.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
