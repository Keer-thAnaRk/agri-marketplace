'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  Product,
  Farmer,
  CartItem,
  Order,
  OrderStatus,
  Dispute,
  Notification,
  DeliveryLocation,
  DeliverySlot,
  DeliveryAddress,
  OrderItem,
  OrderTimelineItem,
} from '@/types';
import {
  MOCK_PRODUCTS,
  MOCK_FARMERS,
  BENGALURU_LOCATIONS,
  INITIAL_ORDERS,
  MOCK_DISPUTES,
  MOCK_NOTIFICATIONS,
  DELIVERY_SLOTS,
} from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
import { api, getAuthToken } from '@/lib/api';


export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

interface MarketplaceContextType {
  // Role & Persona Switcher
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;

  // Location
  activeLocation: DeliveryLocation;
  setActiveLocation: (loc: DeliveryLocation) => void;
  isLocationModalOpen: boolean;
  setIsLocationModalOpen: (open: boolean) => void;

  // Global Search Modal
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: (open: boolean) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  farmerEarnings: number;
  total: number;

  // Products
  products: Product[];
  addProduct: (productData: Omit<Product, 'id' | 'rating' | 'reviewsCount' | 'soldQuantity' | 'reservedQuantity' | 'traceability'>) => Product;
  updateProduct: (product: Product) => void;
  toggleProductStock: (productId: string) => void;

  // Farmers
  farmers: Farmer[];
  verifyFarmer: (farmerId: string, verified: boolean) => void;
  savedFarmerIds: string[];
  toggleSaveFarmer: (farmerId: string) => void;

  // Orders
  orders: Order[];
  placeOrder: (
    address: DeliveryAddress,
    slot: DeliverySlot,
    paymentMethod: 'UPI' | 'Card' | 'Cash on Delivery'
  ) => Promise<Order> | Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;


  // Disputes
  disputes: Dispute[];
  resolveDispute: (disputeId: string, resolution: string) => void;

  // Notifications
  notifications: Notification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  unreadNotificationsCount: number;

  // Toasts
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>('consumer');

  // Synchronize userRole with AuthContext role
  useEffect(() => {
    if (role) {
      setUserRole(role);
    }
  }, [role]);
  const [activeLocation, setActiveLocation] = useState<DeliveryLocation>(BENGALURU_LOCATIONS[0]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Entities
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [farmers, setFarmers] = useState<Farmer[]>(MOCK_FARMERS);
  const [orders, setOrders] = useState<Order[]>([]); // Start empty, load from PostgreSQL when authenticated
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [savedFarmerIds, setSavedFarmerIds] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Load from localStorage on mount (hydration safety)
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('krishi_cart');
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedRole = localStorage.getItem('krishi_role') as UserRole;
      if (savedRole) setUserRole(savedRole);

      const savedLoc = localStorage.getItem('krishi_location');
      if (savedLoc) setActiveLocation(JSON.parse(savedLoc));
    } catch {
      // ignore
    }
  }, []);

  // Sync back
  useEffect(() => {
    try {
      localStorage.setItem('krishi_cart', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('krishi_role', userRole);
    } catch {
      // ignore
    }
  }, [userRole]);

  // Load public products and farmers from PostgreSQL backend
  useEffect(() => {
    let isMounted = true;
    api
      .getPublicProducts({ limit: 100 })
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setProducts(res.data);
        }
      })
      .catch((err) => {
        console.warn('Failed to load marketplace products from backend, using fallback:', err);
      });

    api
      .getPublicFarmers({ limit: 100 })
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setFarmers(res.data);
        }
      })
      .catch((err) => {
        console.warn('Failed to load marketplace farmers from backend, using fallback:', err);
        // Filter mock farmers to only show verified ones as fallback
        const verifiedMockFarmers = MOCK_FARMERS.filter(f => f.isVerified === true);
        setFarmers(verifiedMockFarmers);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Load consumer cart & orders from PostgreSQL
  useEffect(() => {
    const token = getAuthToken();
    // Only load consumer-specific data if user is a consumer
    if (token && role === 'consumer') {
      // Hydrate cart from PostgreSQL
      api
        .getConsumerCart(token)
        .then((res) => {
          if (res.success && res.data && Array.isArray(res.data.items)) {
            const mapped: CartItem[] = res.data.items.map((it: any) => ({
              product: {
                id: it.productId,
                name: it.name,
                category: it.category,
                description: it.description,
                farmerId: it.farmerId,
                farmerName: it.farmerName,
                farmName: it.farmName,
                farmLocation: it.farmLocation,
                farmDistanceKm: it.farmDistanceKm,
                price: it.price,
                unit: it.unit,
                unitShort: it.unitShort,
                images: it.images,
                harvestDate: it.createdAt,
                harvestedAgo: 'Freshly harvested',
                freshnessScore: it.freshnessScore,
                shelfLifeDays: it.shelfLifeDays,
                isOrganic: it.isOrganic,
                farmingMethod: it.farmingMethod,
                inStock: it.inStock,
                availableQuantity: it.availableQuantity,
                reservedQuantity: 0,
                soldQuantity: 0,
                rating: 5.0,
                reviewsCount: 1,
                traceability: [],
              },
              quantity: it.quantity,
            }));
            setCart(mapped);
          }
        })
        .catch(() => {});

      // Hydrate orders from PostgreSQL (only for consumers)
      if (role === 'consumer') {
        api
          .getConsumerOrders(token)
          .then((res) => {
            if (res.success && Array.isArray(res.data) && res.data.length > 0) {
              setOrders(res.data);
            }
          })
          .catch(() => {});
      }
    }
  }, [role]);

  useEffect(() => {
    try {
      localStorage.setItem('krishi_location', JSON.stringify(activeLocation));
    } catch {
      // ignore
    }
  }, [activeLocation]);

  // Toast Helpers
  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = 'toast-' + Date.now() + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Cart operations
  const addToCart = (product: Product, quantity = 1) => {
    const token = getAuthToken();
    if (token) {
      api
        .addToConsumerCart(product.id, quantity, token)
        .then(() => api.getConsumerCart(token))
        .then((res) => {
          if (res.success && res.data && Array.isArray(res.data.items)) {
            const mapped: CartItem[] = res.data.items.map((it: any) => ({
              product: {
                id: it.productId,
                name: it.name,
                category: it.category,
                description: it.description,
                farmerId: it.farmerId,
                farmerName: it.farmerName,
                farmName: it.farmName,
                farmLocation: it.farmLocation,
                farmDistanceKm: it.farmDistanceKm,
                price: it.price,
                unit: it.unit,
                unitShort: it.unitShort,
                images: it.images,
                harvestDate: it.createdAt,
                harvestedAgo: 'Freshly harvested',
                freshnessScore: it.freshnessScore,
                shelfLifeDays: it.shelfLifeDays,
                isOrganic: it.isOrganic,
                farmingMethod: it.farmingMethod,
                inStock: it.inStock,
                availableQuantity: it.availableQuantity,
                reservedQuantity: 0,
                soldQuantity: 0,
                rating: 5.0,
                reviewsCount: 1,
                traceability: [],
              },
              quantity: it.quantity,
            }));
            setCart(mapped);
          }
          showToast(`Added ${quantity} × ${product.name} to cart!`, 'success');
        })
        .catch((err: any) => {
          showToast(err.message || 'Could not add item to cart', 'error');
        });
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast(`Added ${quantity} × ${product.name} to cart!`, 'success');
  };

  const removeFromCart = (productId: string) => {
    const token = getAuthToken();
    if (token) {
      api
        .removeConsumerCartItem(productId, token)
        .then(() => {
          setCart((prev) => prev.filter((item) => item.product.id !== productId));
          showToast('Item removed from cart', 'info');
        })
        .catch((err: any) => {
          showToast(err.message || 'Could not remove item', 'error');
        });
      return;
    }

    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('Item removed from cart', 'info');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const token = getAuthToken();
    if (token) {
      api
        .updateConsumerCartItem(productId, quantity, token)
        .then(() => {
          setCart((prev) =>
            prev.map((item) =>
              item.product.id === productId ? { ...item, quantity } : item
            )
          );
        })
        .catch((err: any) => {
          showToast(err.message || 'Could not update quantity', 'error');
        });
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    const token = getAuthToken();
    if (token) {
      api
        .clearConsumerCart(token)
        .then(() => {
          setCart([]);
        })
        .catch(() => {});
      return;
    }
    setCart([]);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = subtotal > 0 ? (subtotal > 499 ? 0 : 35) : 0;
  const platformFee = subtotal > 0 ? Math.round(subtotal * 0.1) : 0; // 10%
  const farmerEarnings = subtotal > 0 ? Math.round(subtotal * 0.75) : 0; // 75%
  const total = subtotal + deliveryFee + platformFee;

  // Products
  const addProduct = (
    productData: Omit<Product, 'id' | 'rating' | 'reviewsCount' | 'soldQuantity' | 'reservedQuantity' | 'traceability'>
  ): Product => {
    const newId = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      id: newId,
      rating: 5.0,
      reviewsCount: 1,
      reservedQuantity: 0,
      soldQuantity: 0,
      traceability: [
        {
          step: 'farm',
          title: 'Farm Origin',
          location: productData.farmLocation,
          timestamp: 'Today, Just Now',
          details: `Harvest scheduled by ${productData.farmerName}`,
          completed: true,
        },
        {
          step: 'harvest',
          title: 'Hand-Harvested',
          location: productData.farmLocation,
          timestamp: productData.harvestDate,
          details: 'Standard selective hand harvest',
          completed: true,
        },
        {
          step: 'pack',
          title: 'Eco-Packed & Sanitized',
          location: 'Farm Packhouse',
          timestamp: 'Scheduled',
          details: 'Packed in biodegradable crate',
          completed: false,
        },
        {
          step: 'dispatch',
          title: 'Dispatched to Local Hub',
          location: 'Bengaluru Agri Hub',
          timestamp: 'Pending Dispatch',
          details: 'Electric delivery van route',
          completed: false,
        },
        {
          step: 'delivery',
          title: 'Doorstep Handover',
          location: 'Consumer Address',
          timestamp: 'Slot Dependent',
          details: 'Direct to consumer',
          completed: false,
        },
      ],
    };

    setProducts((prev) => [newProduct, ...prev]);
    showToast(`Published "${newProduct.name}" successfully!`, 'success');

    // Add notification
    const newNotif: Notification = {
      id: 'notif-' + Date.now(),
      title: 'New Product Listed',
      message: `${newProduct.farmerName} listed fresh ${newProduct.name} at ₹${newProduct.price}/${newProduct.unit}.`,
      timestamp: 'Just now',
      type: 'new_order',
      isRead: false,
      link: `/products/${newProduct.id}`,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return newProduct;
  };

  const updateProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    showToast(`Updated "${updated.name}" details.`, 'success');
  };

  const toggleProductStock = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, inStock: !p.inStock } : p
      )
    );
    showToast('Product stock status toggled', 'info');
  };

  // Farmers
  const verifyFarmer = (farmerId: string, verified: boolean) => {
    setFarmers((prev) =>
      prev.map((f) => (f.id === farmerId ? { ...f, isVerified: verified } : f))
    );
    showToast(
      verified
        ? 'Farmer verified successfully! Badge activated.'
        : 'Farmer verification status updated.',
      'success'
    );
  };

  const toggleSaveFarmer = (farmerId: string) => {
    setSavedFarmerIds((prev) => {
      const exists = prev.includes(farmerId);
      if (exists) {
        showToast('Removed from favorite farmers', 'info');
        return prev.filter((id) => id !== farmerId);
      } else {
        showToast('Saved to favorite farmers ❤️', 'success');
        return [...prev, farmerId];
      }
    });
  };

  // Orders
  const placeOrder = async (
    address: DeliveryAddress,
    slot: DeliverySlot,
    paymentMethod: 'UPI' | 'Card' | 'Cash on Delivery'
  ): Promise<Order> => {
    const token = getAuthToken();

    // 1. Try PostgreSQL Backend
    if (token && cart.length > 0) {
      try {
        const isDbAddress = address.id && !address.id.startsWith('addr-custom') && !address.id.startsWith('addr-temp');
        const payload: any = {
          items: cart.map((it) => ({
            productId: it.product.id,
            quantity: it.quantity,
          })),
          deliverySlot: slot,
          paymentMethod,
        };

        if (isDbAddress) {
          payload.addressId = address.id;
        } else {
          payload.deliveryAddress = address;
        }

        const res: any = await api.createOrder(payload, token);
        if (res.success && res.data) {
          const placedOrder: Order = res.data;
          setOrders((prev) => [placedOrder, ...prev]);
          clearCart();
          showToast(`Order #${placedOrder.id} placed successfully!`, 'success');

          const notif: Notification = {
            id: 'notif-' + Date.now(),
            title: 'Order Placed Successfully',
            message: `Your order #${placedOrder.id} has been sent to farmers. Delivery slot: ${slot.timeRange}.`,
            timestamp: 'Just now',
            type: 'order_confirmed',
            isRead: false,
            link: `/orders/${placedOrder.id}`,
          };
          setNotifications((prev) => [notif, ...prev]);

          return placedOrder;
        } else if (res.error) {
          showToast(res.error, 'error');
          throw new Error(res.error);
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to place order.', 'error');
        throw err;
      }
    }

    // 2. Fallback local simulation
    const orderNumber = Math.floor(1000 + Math.random() * 9000);
    const orderId = `KM-20260922-${orderNumber}`;

    const orderItems: OrderItem[] = cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      productImage: item.product.images[0],
      farmerId: item.product.farmerId,
      farmerName: item.product.farmerName,
      price: item.product.price,
      quantity: item.quantity,
      unit: item.product.unit,
    }));

    const timeline: OrderTimelineItem[] = [
      {
        status: 'placed',
        label: 'Order Placed',
        timestamp: 'Just now',
        description: 'Order confirmed and routed to local farmer hubs',
        isCompleted: true,
        isCurrent: true,
      },
      {
        status: 'confirmed',
        label: 'Farmer Confirmed',
        timestamp: 'Pending',
        description: 'Farmer is notified to accept harvest schedule',
        isCompleted: false,
        isCurrent: false,
      },
      {
        status: 'harvesting',
        label: 'Harvesting Fresh',
        timestamp: 'Pending',
        description: 'Produce harvested at scheduled slot',
        isCompleted: false,
        isCurrent: false,
      },
      {
        status: 'packed',
        label: 'Eco-Packed & Sanitized',
        timestamp: 'Pending',
        description: 'Packed in breathable kraft containers',
        isCompleted: false,
        isCurrent: false,
      },
      {
        status: 'out_for_delivery',
        label: 'Out for Local Delivery',
        timestamp: 'Pending',
        description: 'Krishi eco-rider assigned to route',
        isCompleted: false,
        isCurrent: false,
      },
      {
        status: 'delivered',
        label: 'Delivered to Doorstep',
        timestamp: slot.timeRange,
        description: 'Delivery handover and crate return',
        isCompleted: false,
        isCurrent: false,
      },
    ];

    const newOrder: Order = {
      id: orderId,
      createdAt: new Date().toISOString(),
      status: 'placed',
      customerId: 'cust-current',
      customerName: address.name,
      customerPhone: address.phone,
      deliveryAddress: address,
      deliverySlot: slot,
      items: orderItems,
      subtotal,
      deliveryFee,
      platformFee,
      farmerEarnings,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
      estimatedDelivery: `Today, ${slot.timeRange}`,
      timeline,
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    showToast(`Order #${orderId} placed successfully!`, 'success');

    // Notify
    const notif: Notification = {
      id: 'notif-' + Date.now(),
      title: 'Order Placed Successfully',
      message: `Your order #${orderId} has been sent to farmers. Delivery slot: ${slot.timeRange}.`,
      timestamp: 'Just now',
      type: 'order_confirmed',
      isRead: false,
      link: `/orders/${orderId}`,
    };
    setNotifications((prev) => [notif, ...prev]);

    return newOrder;
  };


  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;

        const statusSequence: OrderStatus[] = [
          'placed',
          'confirmed',
          'harvesting',
          'packed',
          'out_for_delivery',
          'delivered',
        ];

        const targetIndex = statusSequence.indexOf(newStatus);

        const updatedTimeline = order.timeline.map((item) => {
          const itemIndex = statusSequence.indexOf(item.status);
          const isCompleted = itemIndex <= targetIndex && targetIndex !== -1;
          const isCurrent = item.status === newStatus;
          return {
            ...item,
            isCompleted,
            isCurrent,
            timestamp: isCompleted && item.timestamp === 'Pending' ? 'Updated now' : item.timestamp,
          };
        });

        return {
          ...order,
          status: newStatus,
          timeline: updatedTimeline,
        };
      })
    );
    showToast(`Order status updated to: ${newStatus.replace('_', ' ').toUpperCase()}`, 'info');
  };

  // Disputes
  const resolveDispute = (disputeId: string, resolution: string) => {
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === disputeId
          ? { ...d, status: 'Resolved', resolution }
          : d
      )
    );
    showToast(`Dispute ${disputeId} marked as Resolved!`, 'success');
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('All notifications marked as read', 'info');
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <MarketplaceContext.Provider
      value={{
        userRole,
        setUserRole,
        activeLocation,
        setActiveLocation,
        isLocationModalOpen,
        setIsLocationModalOpen,
        isSearchModalOpen,
        setIsSearchModalOpen,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        subtotal,
        deliveryFee,
        platformFee,
        farmerEarnings,
        total,
        products,
        addProduct,
        updateProduct,
        toggleProductStock,
        farmers,
        verifyFarmer,
        savedFarmerIds,
        toggleSaveFarmer,
        orders,
        placeOrder,
        updateOrderStatus,
        disputes,
        resolveDispute,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        unreadNotificationsCount,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
}
