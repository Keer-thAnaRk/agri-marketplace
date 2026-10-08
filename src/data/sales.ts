import { Sale } from '@/types';

export interface SalesFilterData {
  label: string;
  revenue: number;
  orders: number;
}

export const SALES_7_DAYS: SalesFilterData[] = [
  { label: 'Mon', revenue: 4200, orders: 19 },
  { label: 'Tue', revenue: 6100, orders: 27 },
  { label: 'Wed', revenue: 3800, orders: 16 },
  { label: 'Thu', revenue: 7200, orders: 31 },
  { label: 'Fri', revenue: 5900, orders: 25 },
  { label: 'Sat', revenue: 8400, orders: 38 },
  { label: 'Sun', revenue: 6700, orders: 30 },
];

export const SALES_30_DAYS: SalesFilterData[] = [
  { label: 'Week 1', revenue: 10450, orders: 48 },
  { label: 'Week 2', revenue: 12800, orders: 56 },
  { label: 'Week 3', revenue: 11200, orders: 51 },
  { label: 'Week 4', revenue: 14200, orders: 63 },
];

export const SALES_3_MONTHS: SalesFilterData[] = [
  { label: 'July', revenue: 41200, orders: 180 },
  { label: 'August', revenue: 45800, orders: 205 },
  { label: 'September', revenue: 48650, orders: 228 },
];

export const SALES_1_YEAR: SalesFilterData[] = [
  { label: 'Oct', revenue: 26500, orders: 115 },
  { label: 'Nov', revenue: 29800, orders: 130 },
  { label: 'Dec', revenue: 33400, orders: 148 },
  { label: 'Jan', revenue: 31200, orders: 138 },
  { label: 'Feb', revenue: 34500, orders: 152 },
  { label: 'Mar', revenue: 38900, orders: 170 },
  { label: 'Apr', revenue: 36200, orders: 160 },
  { label: 'May', revenue: 42100, orders: 190 },
  { label: 'Jun', revenue: 39500, orders: 175 },
  { label: 'Jul', revenue: 41200, orders: 180 },
  { label: 'Aug', revenue: 45800, orders: 205 },
  { label: 'Sep', revenue: 48650, orders: 228 },
];

export const TOP_SELLING_PRODUCTS = [
  { rank: 1, name: 'Country Nati Tomatoes', category: 'Vegetables', quantitySold: '480 kg', revenue: 24960, percent: 38 },
  { rank: 2, name: 'Golden Mountain Potatoes', category: 'Vegetables', quantitySold: '310 kg', revenue: 12400, percent: 24 },
  { rank: 3, name: 'Tender Baby Palak', category: 'Vegetables', quantitySold: '220 bunches', revenue: 7700, percent: 18 },
  { rank: 4, name: 'Bangalore Mangoes', category: 'Fruits', quantitySold: '140 kg', revenue: 16800, percent: 14 },
  { rank: 5, name: 'Crisp Shimla Capsicum', category: 'Vegetables', quantitySold: '95 boxes', revenue: 6175, percent: 6 },
];

export const RECENT_SALES_TRANSACTIONS: Sale[] = [
  {
    id: 'SALE-101',
    orderId: 'KM-1024',
    date: 'Sept 24, 2026',
    productName: 'Vine-Ripened Country Nati Tomatoes',
    category: 'Vegetables',
    quantity: 5,
    unit: 'kg',
    revenue: 250,
    status: 'Completed',
  },
  {
    id: 'SALE-102',
    orderId: 'KM-20260924-1042',
    date: 'Sept 24, 2026',
    productName: 'Tomatoes & Spinach Combo',
    category: 'Vegetables',
    quantity: 7,
    unit: 'kg',
    revenue: 350,
    status: 'Completed',
  },
  {
    id: 'SALE-103',
    orderId: 'KM-1025',
    date: 'Sept 24, 2026',
    productName: 'Organic Golden Mountain Potatoes',
    category: 'Vegetables',
    quantity: 4,
    unit: 'kg',
    revenue: 160,
    status: 'Completed',
  },
  {
    id: 'SALE-104',
    orderId: 'KM-1026',
    date: 'Sept 24, 2026',
    productName: 'Crunchy Desi Salad Cucumbers',
    category: 'Vegetables',
    quantity: 3,
    unit: 'kg',
    revenue: 114,
    status: 'Completed',
  },
  {
    id: 'SALE-105',
    orderId: 'KM-1018',
    date: 'Sept 23, 2026',
    productName: 'Sweet Baby Carrots & Beans',
    category: 'Vegetables',
    quantity: 3,
    unit: 'kg',
    revenue: 150,
    status: 'Completed',
  },
  {
    id: 'SALE-106',
    orderId: 'KM-1012',
    date: 'Sept 23, 2026',
    productName: 'Country Nati Tomatoes',
    category: 'Vegetables',
    quantity: 8,
    unit: 'kg',
    revenue: 416,
    status: 'Completed',
  },
  {
    id: 'SALE-107',
    orderId: 'KM-1008',
    date: 'Sept 22, 2026',
    productName: 'Crisp Shimla Capsicum',
    category: 'Vegetables',
    quantity: 4,
    unit: 'box',
    revenue: 260,
    status: 'Completed',
  },
  {
    id: 'SALE-108',
    orderId: 'KM-1005',
    date: 'Sept 22, 2026',
    productName: 'Sugar-Drop Organic Sweet Corn',
    category: 'Vegetables',
    quantity: 6,
    unit: 'cobs',
    revenue: 150,
    status: 'Completed',
  },
];

export const SALES_SUMMARY = {
  todaySales: 4850,
  thisWeekSales: 28400,
  thisMonthSales: 48650,
  totalEarnings: 384200,
  monthlyTrend: '+12.5% from last month',
  weeklyTrend: '+8.2% from last week',
};
