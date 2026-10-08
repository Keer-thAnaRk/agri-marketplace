'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  SALES_7_DAYS,
  SALES_30_DAYS,
  SALES_3_MONTHS,
  SALES_1_YEAR,
  SalesFilterData,
} from '@/data/sales';
import { IndianRupee, ShoppingBag } from 'lucide-react';

interface SalesChartProps {
  title?: string;
  subtitle?: string;
  monthlyData?: { label: string; revenue: number; orders: number }[];
  isRealData?: boolean;
}

export function SalesChart({
  title = 'Sales Overview',
  subtitle = 'Revenue & Orders Fulfillment Velocity',
  monthlyData,
  isRealData = false,
}: SalesChartProps) {
  const [filter, setFilter] = useState<'7d' | '30d' | '3m' | '1y'>('7d');

  let currentData: SalesFilterData[] = SALES_7_DAYS;
  if (isRealData || monthlyData !== undefined) {
    currentData = (monthlyData || []) as any;
  } else {
    if (filter === '30d') currentData = SALES_30_DAYS;
    if (filter === '3m') currentData = SALES_3_MONTHS;
    if (filter === '1y') currentData = SALES_1_YEAR;
  }

  const totalPeriodRevenue = currentData.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalPeriodOrders = currentData.reduce((acc, curr) => acc + curr.orders, 0);

  return (
    <div className="bg-white rounded-3xl border border-earth-200/80 p-6 shadow-xs space-y-5">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-earth-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-forest-700">
              Live Farm Performance
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-serif mt-0.5">{title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        {/* Filter buttons - only if demo data */}
        {!isRealData && monthlyData === undefined && (
          <div className="flex items-center gap-1 bg-earth-100/80 p-1 rounded-2xl self-start sm:self-auto">
            {[
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: '3m', label: '3 Months' },
              { id: '1y', label: '1 Year' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as typeof filter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filter === tab.id
                    ? 'bg-white text-forest-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Snapshot badges */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold pb-1">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-forest-50 border border-forest-100 text-forest-900">
          <IndianRupee className="w-3.5 h-3.5 text-forest-700" />
          <span>Period Revenue: <strong className="text-sm font-extrabold text-forest-950">₹{totalPeriodRevenue.toLocaleString('en-IN')}</strong></span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-earth-50 border border-earth-200 text-slate-700">
          <ShoppingBag className="w-3.5 h-3.5 text-slate-600" />
          <span>Total Orders: <strong className="text-sm font-extrabold text-slate-900">{totalPeriodOrders}</strong></span>
        </div>
      </div>

      {/* Recharts Chart or Zero-State */}
      <div className="h-72 w-full pt-2">
        {currentData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-earth-200 rounded-2xl bg-earth-50/50 text-center p-6 space-y-2">
            <IndianRupee className="w-8 h-8 text-slate-300" />
            <p className="text-sm font-bold text-slate-700 font-serif">No sales data available yet.</p>
            <p className="text-xs text-slate-400 max-w-sm">
              Deliver customer orders to see live revenue velocity and monthly breakdown.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={currentData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="farmerRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#24583F" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#24583F" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECE6DC" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `${val} ord`}
              />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const rev = payload.find((p) => p.dataKey === 'revenue')?.value;
                    const ord = payload.find((p) => p.dataKey === 'orders')?.value;
                    return (
                      <div className="bg-forest-950 text-white p-3 rounded-2xl shadow-xl border border-forest-800 text-xs space-y-1">
                        <div className="font-bold text-forest-300 pb-1 border-b border-forest-800">{label}</div>
                        <div className="flex items-center justify-between gap-4 font-semibold">
                          <span className="text-emerald-400">Revenue:</span>
                          <span className="font-extrabold text-white">₹{Number(rev || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 font-semibold text-slate-300">
                          <span>Orders:</span>
                          <span className="font-bold text-white">{ord} orders</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
              />
              <Bar
                yAxisId="right"
                dataKey="orders"
                name="Orders"
                fill="#D8F3DC"
                radius={[6, 6, 0, 0]}
                barSize={20}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                name="Revenue (₹)"
                stroke="#24583F"
                strokeWidth={3}
              fillOpacity={1}
              fill="url(#farmerRevenueGrad)"
            />
          </ComposedChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
