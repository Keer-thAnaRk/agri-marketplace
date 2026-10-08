import { FarmerNotification } from '@/types';

export const INITIAL_FARMER_NOTIFICATIONS: FarmerNotification[] = [
  {
    id: 'f-notif-1',
    title: 'New order received',
    message: 'Order KM-1024 requires confirmation for 5 kg Tomatoes.',
    timestamp: '10 minutes ago',
    type: 'order',
    isRead: false,
    link: '/farmer/orders/KM-1024',
  },
  {
    id: 'f-notif-2',
    title: 'Inventory alert',
    message: 'Spinach stock is below your threshold (0 bunches remaining).',
    timestamp: '1 hour ago',
    type: 'inventory',
    isRead: false,
    link: '/farmer/inventory',
  },
  {
    id: 'f-notif-3',
    title: 'New review',
    message: 'Ananya rated your tomatoes 5 stars: "Smells like grandmother’s farm!"',
    timestamp: '3 hours ago',
    type: 'review',
    isRead: false,
    link: '/farmer/profile',
  },
  {
    id: 'f-notif-4',
    title: 'Order completed',
    message: 'Order KM-1018 has been completed and payout of ₹150 scheduled.',
    timestamp: 'Yesterday',
    type: 'completed',
    isRead: true,
    link: '/farmer/orders/KM-1018',
  },
  {
    id: 'f-notif-5',
    title: 'Payout Dispatched',
    message: 'Weekly direct deposit of ₹14,820 scheduled for transfer this Friday.',
    timestamp: '2 days ago',
    type: 'system',
    isRead: true,
    link: '/farmer/sales',
  },
];
