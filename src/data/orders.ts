import { FarmerOrderStatus, DeliverySlot, DeliveryAddress } from '@/types';

export interface FarmerOrderItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  unit: string;
}

export interface FarmerOrder {
  id: string; // e.g. KM-1024 or KM-20260924-1042
  orderDate: string; // e.g. 'Sept 24, 2026 06:15 AM'
  customerName: string;
  customerPhone: string;
  deliveryAddress: DeliveryAddress;
  deliverySlot: DeliverySlot;
  items: FarmerOrderItem[];
  productsSummary: string; // e.g. 'Tomatoes, Spinach'
  totalQuantity: string; // e.g. '7 kg'
  amount: number; // in INR
  status: FarmerOrderStatus;
  paymentMethod: 'UPI' | 'Card' | 'Cash on Delivery';
  paymentStatus: 'Paid' | 'Pending';
  timeline: {
    status: string;
    label: string;
    timestamp: string;
    completed: boolean;
    current: boolean;
  }[];
}

export const MOCK_DELIVERY_SLOTS: DeliverySlot[] = [
  {
    id: 'slot-morning',
    name: 'Morning Slot',
    timeRange: '8:00 AM – 11:00 AM',
    description: 'Harvested predawn for morning cooking.',
  },
  {
    id: 'slot-midday',
    name: 'Midday Slot',
    timeRange: '12:00 PM – 3:30 PM',
    description: 'Fresh midday deliveries for lunch.',
  },
  {
    id: 'slot-evening',
    name: 'Evening Slot',
    timeRange: '5:30 PM – 8:30 PM',
    description: 'Dinner and next day pantry prep.',
  },
];

export const INITIAL_FARMER_ORDERS: FarmerOrder[] = [
  {
    id: 'KM-1024',
    orderDate: 'Sept 24, 2026, 06:15 AM',
    customerName: 'Ananya Sharma',
    customerPhone: '+91 98451 99012',
    deliveryAddress: {
      id: 'addr-hsr',
      name: 'Ananya Sharma',
      phone: '+91 98451 99012',
      addressLine: 'Flat 402, Green Glen Towers, 14th Main, HSR Sector 2',
      city: 'Bengaluru',
      pincode: '560102',
      hub: 'HSR Layout',
      isDefault: true,
    },
    deliverySlot: {
      id: 'slot-morning',
      name: 'Morning',
      timeRange: '8:00 AM – 11:00 AM',
      description: 'Morning fresh harvest slot',
    },
    items: [
      {
        productId: 'prod-1',
        productName: 'Vine-Ripened Country Nati Tomatoes',
        productImage: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=200&q=80',
        price: 50,
        quantity: 5,
        unit: 'kg',
      },
    ],
    productsSummary: 'Tomatoes',
    totalQuantity: '5 kg',
    amount: 250,
    status: 'Pending',
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    timeline: [
      { status: 'placed', label: 'Order Placed', timestamp: '06:15 AM, Sept 24', completed: true, current: false },
      { status: 'paid', label: 'Payment Confirmed', timestamp: '06:16 AM, Sept 24', completed: true, current: false },
      { status: 'confirmed', label: 'Farmer Confirmation', timestamp: 'Awaiting farmer response', completed: false, current: true },
      { status: 'preparing', label: 'Preparing', timestamp: 'Pending', completed: false, current: false },
      { status: 'ready', label: 'Ready', timestamp: 'Pending', completed: false, current: false },
      { status: 'completed', label: 'Delivered', timestamp: 'Pending', completed: false, current: false },
    ],
  },
  {
    id: 'KM-20260924-1042',
    orderDate: 'Sept 24, 2026, 06:40 AM',
    customerName: 'Ananya Sharma',
    customerPhone: '+91 98451 99012',
    deliveryAddress: {
      id: 'addr-hsr-2',
      name: 'Ananya Sharma',
      phone: '+91 98451 99012',
      addressLine: 'Villa 18, Ferns Meadows, HSR Layout Sector 1',
      city: 'Bengaluru',
      pincode: '560102',
      hub: 'HSR Layout',
      isDefault: true,
    },
    deliverySlot: {
      id: 'slot-morning',
      name: 'Morning',
      timeRange: '8:00 AM – 11:00 AM',
      description: 'Morning fresh harvest slot',
    },
    items: [
      {
        productId: 'prod-1',
        productName: 'Country Nati Tomatoes',
        productImage: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=200&q=80',
        price: 52,
        quantity: 5,
        unit: 'kg',
      },
      {
        productId: 'prod-spinach',
        productName: 'Tender Baby Palak (Spinach)',
        productImage: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=200&q=80',
        price: 45,
        quantity: 2,
        unit: 'kg',
      },
    ],
    productsSummary: 'Tomatoes, Spinach',
    totalQuantity: '7 kg',
    amount: 350,
    status: 'Confirmed',
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    timeline: [
      { status: 'placed', label: 'Order Placed', timestamp: '06:40 AM, Sept 24', completed: true, current: false },
      { status: 'paid', label: 'Payment Confirmed', timestamp: '06:41 AM, Sept 24', completed: true, current: false },
      { status: 'confirmed', label: 'Farmer Confirmation', timestamp: '06:50 AM, Sept 24', completed: true, current: false },
      { status: 'preparing', label: 'Preparing', timestamp: 'In progress', completed: false, current: true },
      { status: 'ready', label: 'Ready', timestamp: 'Pending', completed: false, current: false },
      { status: 'completed', label: 'Delivered', timestamp: 'Pending', completed: false, current: false },
    ],
  },
  {
    id: 'KM-1025',
    orderDate: 'Sept 24, 2026, 07:05 AM',
    customerName: 'Vikram Joshi',
    customerPhone: '+91 97412 88391',
    deliveryAddress: {
      id: 'addr-kor',
      name: 'Vikram Joshi',
      phone: '+91 97412 88391',
      addressLine: '12th Cross, 4th Block, Koramangala',
      city: 'Bengaluru',
      pincode: '560034',
      hub: 'Koramangala',
    },
    deliverySlot: {
      id: 'slot-midday',
      name: 'Midday',
      timeRange: '12:00 PM – 3:30 PM',
      description: 'Midday harvest slot',
    },
    items: [
      {
        productId: 'prod-potatoes',
        productName: 'Organic Golden Mountain Potatoes',
        productImage: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=200&q=80',
        price: 40,
        quantity: 4,
        unit: 'kg',
      },
      {
        productId: 'prod-capsicum',
        productName: 'Crisp Shimla Capsicum',
        productImage: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=200&q=80',
        price: 65,
        quantity: 2,
        unit: 'box',
      },
    ],
    productsSummary: 'Potatoes, Capsicum',
    totalQuantity: '5 kg',
    amount: 290,
    status: 'Preparing',
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    timeline: [
      { status: 'placed', label: 'Order Placed', timestamp: '07:05 AM, Sept 24', completed: true, current: false },
      { status: 'paid', label: 'Payment Confirmed', timestamp: '07:06 AM, Sept 24', completed: true, current: false },
      { status: 'confirmed', label: 'Farmer Confirmation', timestamp: '07:15 AM, Sept 24', completed: true, current: false },
      { status: 'preparing', label: 'Preparing', timestamp: '07:30 AM, Sept 24', completed: true, current: true },
      { status: 'ready', label: 'Ready', timestamp: 'Pending', completed: false, current: false },
      { status: 'completed', label: 'Delivered', timestamp: 'Pending', completed: false, current: false },
    ],
  },
  {
    id: 'KM-1026',
    orderDate: 'Sept 24, 2026, 07:20 AM',
    customerName: 'Pooja Hegde',
    customerPhone: '+91 99001 44521',
    deliveryAddress: {
      id: 'addr-ind',
      name: 'Pooja Hegde',
      phone: '+91 99001 44521',
      addressLine: '742, 100ft Road, Indiranagar',
      city: 'Bengaluru',
      pincode: '560038',
      hub: 'Indiranagar',
    },
    deliverySlot: {
      id: 'slot-morning',
      name: 'Morning',
      timeRange: '8:00 AM – 11:00 AM',
      description: 'Morning slot',
    },
    items: [
      {
        productId: 'prod-cucumbers',
        productName: 'Crunchy Desi Salad Cucumbers',
        productImage: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=200&q=80',
        price: 38,
        quantity: 3,
        unit: 'kg',
      },
    ],
    productsSummary: 'Cucumbers',
    totalQuantity: '3 kg',
    amount: 114,
    status: 'Ready',
    paymentMethod: 'Card',
    paymentStatus: 'Paid',
    timeline: [
      { status: 'placed', label: 'Order Placed', timestamp: '07:20 AM, Sept 24', completed: true, current: false },
      { status: 'paid', label: 'Payment Confirmed', timestamp: '07:21 AM, Sept 24', completed: true, current: false },
      { status: 'confirmed', label: 'Farmer Confirmation', timestamp: '07:25 AM, Sept 24', completed: true, current: false },
      { status: 'preparing', label: 'Preparing', timestamp: '07:40 AM, Sept 24', completed: true, current: false },
      { status: 'ready', label: 'Ready', timestamp: '08:00 AM, Sept 24', completed: true, current: true },
      { status: 'completed', label: 'Delivered', timestamp: 'Pending', completed: false, current: false },
    ],
  },
  {
    id: 'KM-1018',
    orderDate: 'Sept 23, 2026, 04:10 PM',
    customerName: 'Raghavan Iyer',
    customerPhone: '+91 98450 67123',
    deliveryAddress: {
      id: 'addr-sar',
      name: 'Raghavan Iyer',
      phone: '+91 98450 67123',
      addressLine: 'B-301, Rainbow Drive, Sarjapur Road',
      city: 'Bengaluru',
      pincode: '560035',
      hub: 'Sarjapur Road',
    },
    deliverySlot: {
      id: 'slot-evening',
      name: 'Evening',
      timeRange: '5:30 PM – 8:30 PM',
      description: 'Evening slot',
    },
    items: [
      {
        productId: 'prod-carrots',
        productName: 'Sweet Crunchy Baby Carrots',
        productImage: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?auto=format&fit=crop&w=200&q=80',
        price: 45,
        quantity: 2,
        unit: 'bunch',
      },
      {
        productId: 'prod-beans',
        productName: 'French Bush Beans',
        productImage: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=200&q=80',
        price: 60,
        quantity: 1,
        unit: 'pack',
      },
    ],
    productsSummary: 'Carrots, Beans',
    totalQuantity: '2 kg',
    amount: 150,
    status: 'Completed',
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    timeline: [
      { status: 'placed', label: 'Order Placed', timestamp: '04:10 PM, Sept 23', completed: true, current: false },
      { status: 'paid', label: 'Payment Confirmed', timestamp: '04:12 PM, Sept 23', completed: true, current: false },
      { status: 'confirmed', label: 'Farmer Confirmation', timestamp: '04:20 PM, Sept 23', completed: true, current: false },
      { status: 'preparing', label: 'Preparing', timestamp: '04:50 PM, Sept 23', completed: true, current: false },
      { status: 'ready', label: 'Ready', timestamp: '05:20 PM, Sept 23', completed: true, current: false },
      { status: 'completed', label: 'Delivered', timestamp: '06:15 PM, Sept 23', completed: true, current: true },
    ],
  },
  {
    id: 'KM-1015',
    orderDate: 'Sept 23, 2026, 02:00 PM',
    customerName: 'Divya Ramesh',
    customerPhone: '+91 97422 11984',
    deliveryAddress: {
      id: 'addr-ec',
      name: 'Divya Ramesh',
      phone: '+91 97422 11984',
      addressLine: 'Phase 1, Electronic City',
      city: 'Bengaluru',
      pincode: '560100',
      hub: 'Electronic City',
    },
    deliverySlot: {
      id: 'slot-evening',
      name: 'Evening',
      timeRange: '5:30 PM – 8:30 PM',
      description: 'Evening slot',
    },
    items: [
      {
        productId: 'prod-sweetcorn',
        productName: 'Sugar-Drop Organic Sweet Corn',
        productImage: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=200&q=80',
        price: 50,
        quantity: 2,
        unit: 'pack',
      },
    ],
    productsSummary: 'Sweet Corn',
    totalQuantity: '4 cobs',
    amount: 100,
    status: 'Cancelled',
    paymentMethod: 'UPI',
    paymentStatus: 'Pending',
    timeline: [
      { status: 'placed', label: 'Order Placed', timestamp: '02:00 PM, Sept 23', completed: true, current: false },
      { status: 'cancelled', label: 'Cancelled by Customer', timestamp: '02:15 PM, Sept 23', completed: true, current: true },
    ],
  },
  {
    id: 'KM-1027',
    orderDate: 'Sept 24, 2026, 07:45 AM',
    customerName: 'Kavitha Murthy',
    customerPhone: '+91 98860 33211',
    deliveryAddress: {
      id: 'addr-hsr-3',
      name: 'Kavitha Murthy',
      phone: '+91 98860 33211',
      addressLine: '22, 19th Main, Sector 4, HSR Layout',
      city: 'Bengaluru',
      pincode: '560102',
      hub: 'HSR Layout',
    },
    deliverySlot: {
      id: 'slot-morning',
      name: 'Morning',
      timeRange: '8:00 AM – 11:00 AM',
      description: 'Morning slot',
    },
    items: [
      {
        productId: 'prod-1',
        productName: 'Vine-Ripened Country Nati Tomatoes',
        productImage: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=200&q=80',
        price: 52,
        quantity: 3,
        unit: 'kg',
      },
      {
        productId: 'prod-cucumbers',
        productName: 'Crunchy Desi Salad Cucumbers',
        productImage: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=200&q=80',
        price: 38,
        quantity: 2,
        unit: 'kg',
      },
    ],
    productsSummary: 'Tomatoes, Cucumbers',
    totalQuantity: '5 kg',
    amount: 232,
    status: 'Pending',
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    timeline: [
      { status: 'placed', label: 'Order Placed', timestamp: '07:45 AM, Sept 24', completed: true, current: false },
      { status: 'paid', label: 'Payment Confirmed', timestamp: '07:46 AM, Sept 24', completed: true, current: false },
      { status: 'confirmed', label: 'Farmer Confirmation', timestamp: 'Awaiting confirmation', completed: false, current: true },
      { status: 'preparing', label: 'Preparing', timestamp: 'Pending', completed: false, current: false },
      { status: 'ready', label: 'Ready', timestamp: 'Pending', completed: false, current: false },
      { status: 'completed', label: 'Delivered', timestamp: 'Pending', completed: false, current: false },
    ],
  },
];
