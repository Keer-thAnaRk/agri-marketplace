'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser, UserRole, VerificationStatus, FarmerSignupData, ConsumerSignupData } from '@/types';
import { CURRENT_DEMO_FARMER, INITIAL_REGISTERED_FARMERS } from '@/data/farmers';
import {
  api,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  getAdminToken,
  setAdminToken,
  clearAdminToken,
} from '@/lib/api';

export const DEMO_CONSUMER_USER: AuthUser = {
  id: 'consumer-1',
  name: 'Ananya Sharma',
  email: 'ananya.sharma@example.com',
  phone: '+91 98450 12345',
  role: 'consumer',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  verificationStatus: 'Verified',
};

export const DEMO_FARMER_USER: AuthUser = {
  id: CURRENT_DEMO_FARMER.id,
  name: CURRENT_DEMO_FARMER.name,
  email: CURRENT_DEMO_FARMER.email,
  role: 'farmer',
  phone: CURRENT_DEMO_FARMER.phone,
  avatar: CURRENT_DEMO_FARMER.avatar,
  farmId: CURRENT_DEMO_FARMER.id,
  farmName: CURRENT_DEMO_FARMER.farmName,
  location: CURRENT_DEMO_FARMER.location,
  verificationStatus: 'Verified',
};

export const DEMO_ADMIN_USER: AuthUser = {
  id: 'admin-1',
  name: 'Krishi Platform Admin',
  email: 'admin@krishimarket.in',
  role: 'admin',
  phone: '+91 80 4000 1234',
  verificationStatus: 'Verified',
};

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  role: UserRole | null;
  verificationStatus: VerificationStatus;
  isLoading: boolean;

  // General login / demo
  login: (email: string, password?: string, roleHint?: UserRole, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  loginConsumer: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginFarmer: (
    email: string,
    password?: string
  ) => Promise<{ success: boolean; user?: AuthUser; verificationStatus?: VerificationStatus; error?: string }>;
  demoLoginConsumer: () => void;
  demoLoginFarmer: () => void;
  demoLogin: (role?: UserRole) => void;

  // Signups
  signupConsumer: (data: ConsumerSignupData) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  signupFarmer: (data: FarmerSignupData) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  signup: (data: FarmerSignupData) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;

  // Admin & Approval Actions
  approveFarmer: (farmerId: string, adminId?: string) => Promise<boolean> | void;
  rejectFarmer: (farmerId: string, reason: string) => Promise<boolean> | void;
  resubmitFarmer: (farmerId: string, updatedData?: Record<string, unknown>) => void;

  // Session management
  logout: () => void;
  switchRole: (role: UserRole | null) => void;
  updateVerificationStatus: (status: VerificationStatus) => void;
  updateUser: (updated: Partial<AuthUser>) => void;
  requestPasswordReset: (email: string) => Promise<boolean>;
  resetPassword: (email: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AUTH_STORAGE_KEY = 'krishi_auth_state_v1';
export const REGISTERED_FARMERS_KEY = 'krishi_registered_farmers_v1';
export const REGISTERED_CONSUMERS_KEY = 'krishi_registered_consumers_v1';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Initial state: Default is Public Visitor (NOT authenticated, no user, no role)
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('Verified');

  // Load persisted session on initial mount safely and synchronously
  useEffect(() => {
    try {
      // 1. Ensure seed farmers exist in persistent store
      const regStr = localStorage.getItem(REGISTERED_FARMERS_KEY);
      if (!regStr) {
        localStorage.setItem(REGISTERED_FARMERS_KEY, JSON.stringify(INITIAL_REGISTERED_FARMERS));
      } else {
        try {
          const list: any[] = JSON.parse(regStr);
          // If empty or missing Ramesh, merge seed
          const hasRamesh = list.some((f) => f.id === 'farmer-ramesh' || f.email === 'ramesh.gowda@krishifarm.in');
          if (!hasRamesh) {
            localStorage.setItem(REGISTERED_FARMERS_KEY, JSON.stringify([...list, ...INITIAL_REGISTERED_FARMERS]));
          }
        } catch {}
      }

      // 2. Load auth state
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.isAuthenticated === 'boolean') {
          let currentStatus: VerificationStatus = parsed.verificationStatus || (parsed.user?.verificationStatus ?? 'pending');
          let currentUser: AuthUser | null = parsed.user || null;

          // Always synchronize latest verificationStatus & rejectionReason for registered farmers from primary store
          if (currentUser && currentUser.role === 'farmer' && currentUser.id !== 'farmer-1') {
            try {
              const currentRegStr = localStorage.getItem(REGISTERED_FARMERS_KEY);
              if (currentRegStr) {
                const regList = JSON.parse(currentRegStr);
                const matched = regList.find((f: AuthUser) => f.id === currentUser?.id || f.email.toLowerCase() === currentUser?.email.toLowerCase());
                if (matched) {
                  currentStatus = (matched.verificationStatus as VerificationStatus) || 'pending';
                  currentUser = {
                    ...currentUser,
                    ...matched,
                    verificationStatus: currentStatus,
                  };
                }
              }
            } catch {}
          }

          setIsAuthenticated(parsed.isAuthenticated);
          setUser(currentUser);
          setRole(parsed.role || null);
          setVerificationStatus(currentStatus);

          // 3. Synchronize status from PostgreSQL backend if auth token exists
          const token = getAuthToken();
          if (token && (parsed.role === 'farmer' || currentUser?.role === 'farmer')) {
            api
              .getFarmerStatus(token)
              .then((res) => {
                if (res.success && res.data) {
                  const vStatus = res.data.verificationStatus.toLowerCase() as VerificationStatus;
                  setVerificationStatus(vStatus);
                  setUser((prev) => {
                    if (!prev) return null;
                    const updated: AuthUser = {
                      ...prev,
                      verificationStatus: vStatus,
                      isVerified: res.data.isVerified,
                      rejectionReason: res.data.rejectionReason || '',
                      approvedAt: res.data.approvedAt || '',
                    };
                    persistAuthState(true, updated, 'farmer', vStatus);
                    return updated;
                  });
                }
              })
              .catch(() => {});
          }
        }
      }
    } catch {
      // LocalStorage blocked or parsing error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persistAuthState = (
    authed: boolean,
    u: AuthUser | null,
    r: UserRole | null,
    vStatus: VerificationStatus
  ) => {
    try {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          isAuthenticated: authed,
          user: u,
          role: r,
          verificationStatus: vStatus,
        })
      );
      // Synchronize legacy krishi_role for backwards compatibility with any non-auth hooks
      if (r) {
        localStorage.setItem('krishi_role', r);
      }
    } catch {
      // LocalStorage blocked
    }
  };

  const demoLoginConsumer = () => {
    api.loginConsumer('consumer@krishimarket.in', 'consumer123').catch(() => {});
    setIsAuthenticated(true);
    setUser(DEMO_CONSUMER_USER);
    setRole('consumer');
    setVerificationStatus('Verified');
    setIsLoading(false);
    persistAuthState(true, DEMO_CONSUMER_USER, 'consumer', 'Verified');
  };

  const demoLoginFarmer = () => {
    setIsAuthenticated(true);
    setUser(DEMO_FARMER_USER);
    setRole('farmer');
    setVerificationStatus('Verified');
    setIsLoading(false);
    persistAuthState(true, DEMO_FARMER_USER, 'farmer', 'Verified');
  };

  const demoLogin = (targetRole: UserRole = 'farmer') => {
    if (targetRole === 'consumer') {
      demoLoginConsumer();
    } else if (targetRole === 'admin') {
      // Don't call api.loginAdmin() here - it's already called during login
      // Just set the auth state
      setIsAuthenticated(true);
      setUser(DEMO_ADMIN_USER);
      setRole('admin');
      setVerificationStatus('Verified');
      setIsLoading(false);
      persistAuthState(true, DEMO_ADMIN_USER, 'admin', 'Verified');
    } else {
      demoLoginFarmer();
    }
  };

  const loginConsumer = async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const res = await api.loginConsumer(normalizedEmail, password || 'consumer123');
      if (res.success && res.data?.user) {
        const authUser: AuthUser = {
          id: res.data.user.id,
          name: res.data.user.name,
          email: res.data.user.email,
          phone: res.data.user.phone || '',
          avatar: res.data.user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          role: 'consumer',
          verificationStatus: 'Verified',
        };

        setIsAuthenticated(true);
        setUser(authUser);
        setRole('consumer');
        setVerificationStatus('Verified');
        setIsLoading(false);
        persistAuthState(true, authUser, 'consumer', 'Verified');
        return { success: true };
      }
    } catch (apiErr: any) {
      setIsLoading(false);
      return { success: false, error: apiErr.message || 'Invalid email or password.' };
    }

    setIsLoading(false);
    return { success: false, error: 'Authentication failed. Please check your credentials.' };
  };

  const loginFarmer = async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; user?: AuthUser; verificationStatus?: VerificationStatus; error?: string }> => {
    setIsLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Authenticate with real PostgreSQL Backend API
    try {
      if (password) {
        const apiRes = await api.loginFarmer(normalizedEmail, password);
        if (apiRes.success && apiRes.data) {
          const { user: apiUser, farmer: apiFarmer, verificationStatus: rawStatus } = apiRes.data;
          const vStatus = rawStatus.toLowerCase() as VerificationStatus;
          const authUser: AuthUser = {
            id: apiFarmer.id || apiUser.id,
            name: apiUser.name,
            email: apiUser.email,
            role: 'farmer',
            phone: apiUser.phone || '',
            avatar: apiUser.avatar || '',
            profilePhoto: apiUser.avatar || '',
            farmId: apiFarmer.id,
            farmName: apiFarmer.farmName,
            location: apiFarmer.location || `${apiFarmer.city || ''}, ${apiFarmer.state || ''}`,
            verificationStatus: vStatus,
            isVerified: apiFarmer.isVerified,
            rejectionReason: apiFarmer.rejectionReason || '',
            registeredAt: apiFarmer.registeredAt || '',
            approvedAt: apiFarmer.approvedAt || '',
            approvedBy: apiFarmer.approvedBy || '',
          };

          setIsAuthenticated(true);
          setUser(authUser);
          setRole('farmer');
          setVerificationStatus(vStatus);
          setIsLoading(false);
          persistAuthState(true, authUser, 'farmer', vStatus);
          return { success: true, user: authUser, verificationStatus: vStatus };
        }
      }
    } catch (apiErr: any) {
      if (apiErr.status === 401) {
        setIsLoading(false);
        return { success: false, error: 'Invalid email or password.' };
      }
      if (apiErr.status === 403) {
        setIsLoading(false);
        return { success: false, error: apiErr.message || 'Access denied: Account is not registered as a Farmer.' };
      }
      // If 404 or other network error, fall back to checking demo/local accounts below
    }

    // 2. Check demo farmer (Ravi Kumar)
    const isDemoEmail =
      normalizedEmail === DEMO_FARMER_USER.email.toLowerCase() ||
      normalizedEmail === 'ravi@krishimarket.demo' ||
      normalizedEmail === 'ravi@example.com' ||
      normalizedEmail === 'ravi.kumar@greenvalleyfarm.in';

    if (isDemoEmail) {
      // Validate demo password if provided
      if (password && password !== 'krishi2026' && password !== 'ravi123' && password !== 'demo123') {
        setIsLoading(false);
        return { success: false, error: 'Incorrect password. Please try again.' };
      }
      demoLoginFarmer();
      return { success: true, user: DEMO_FARMER_USER, verificationStatus: 'approved' };
    }

    // 3. Check registered farmers in persistent store fallback
    try {
      let regStr = localStorage.getItem(REGISTERED_FARMERS_KEY);
      let regList: any[] = [];
      if (regStr) {
        try {
          regList = JSON.parse(regStr);
        } catch {}
      }
      if (!regList || regList.length === 0) {
        regList = [...INITIAL_REGISTERED_FARMERS];
        try {
          localStorage.setItem(REGISTERED_FARMERS_KEY, JSON.stringify(regList));
        } catch {}
      }

      let matched = regList.find((u) => u.email?.toLowerCase() === normalizedEmail);
      if (!matched) {
        const seedMatched = INITIAL_REGISTERED_FARMERS.find((u) => u.email?.toLowerCase() === normalizedEmail);
        if (seedMatched) {
          regList.push(seedMatched);
          try {
            localStorage.setItem(REGISTERED_FARMERS_KEY, JSON.stringify(regList));
          } catch {}
          matched = seedMatched;
        }
      }

      if (matched) {
        if (password && matched.password && matched.password !== password) {
          setIsLoading(false);
          return { success: false, error: 'Incorrect password. Please try again.' };
        }

        const currentVStatus: VerificationStatus = (matched.verificationStatus as VerificationStatus) || 'pending';
        const authUser: AuthUser = {
          id: matched.id,
          name: matched.fullName || matched.name,
          email: matched.email,
          role: 'farmer',
          phone: matched.phone,
          avatar: matched.profilePhoto || matched.avatar || '',
          profilePhoto: matched.profilePhoto || matched.avatar || '',
          farmId: matched.farmId,
          farmName: matched.farmName,
          location: matched.location,
          verificationStatus: currentVStatus,
          rejectionReason: (matched as any).rejectionReason || '',
          registeredAt: (matched as any).registeredAt || '',
          approvedAt: (matched as any).approvedAt || '',
          approvedBy: (matched as any).approvedBy || '',
        };

        setIsAuthenticated(true);
        setUser(authUser);
        setRole('farmer');
        setVerificationStatus(currentVStatus);
        setIsLoading(false);
        persistAuthState(true, authUser, 'farmer', currentVStatus);
        return { success: true, user: authUser, verificationStatus: currentVStatus };
      }
    } catch {}

    // Not found in demo or registered farmers
    setIsLoading(false);
    return { success: false, error: 'Farmer account not found. Please register first.' };
  };

  const login = async (
    email: string,
    password?: string,
    roleHint?: UserRole,
    rememberMe: boolean = true
  ): Promise<{ success: boolean; error?: string }> => {
    if (roleHint === 'farmer') {
      return loginFarmer(email, password);
    }
    return loginConsumer(email, password);
  };

  const signupConsumer = async (
    data: ConsumerSignupData
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
    setIsLoading(true);
    const normalizedEmail = data.email.trim().toLowerCase();

    try {
      const res = await api.registerConsumer({
        name: data.fullName,
        email: normalizedEmail,
        phone: data.phone,
        password: data.password || 'consumer123',
      });

      if (res.success && res.data?.user) {
        const authUser: AuthUser = {
          id: res.data.user.id,
          name: res.data.user.name,
          email: res.data.user.email,
          phone: res.data.user.phone || '',
          avatar: res.data.user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          role: 'consumer',
          verificationStatus: 'Verified',
        };

        setIsAuthenticated(true);
        setUser(authUser);
        setRole('consumer');
        setVerificationStatus('Verified');
        setIsLoading(false);
        persistAuthState(true, authUser, 'consumer', 'Verified');
        return { success: true, user: authUser };
      }
    } catch (apiErr: any) {
      setIsLoading(false);
      return { success: false, error: apiErr.message || 'Registration failed. Please try again.' };
    }

    setIsLoading(false);
    return { success: false, error: 'Failed to create consumer account.' };
  };

  const signupFarmer = async (
    data: FarmerSignupData
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
    setIsLoading(true);
    const normalizedEmail = data.email.trim().toLowerCase();

    try {
      const apiResult = await api.registerFarmer({
        fullName: data.fullName,
        email: normalizedEmail,
        phone: data.phone,
        password: data.password || 'krishi2026',
        profilePhoto: data.profilePhoto,
        farmName: data.farmName,
        farmLocation: data.farmLocation,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        hub: `${data.city} Central`,
        farmingMethod: data.farmingMethod,
        yearsFarming: Number(data.yearsFarming) || 1,
        mainCrops: data.mainCrops,
        farmDescription: data.farmDescription,
        govtIdFileName: data.govtIdFileName,
        ownershipDocFileName: data.ownershipDocFileName,
        farmPhotoUrl: data.farmPhotoUrl,
      });

      if (apiResult.success && apiResult.data) {
        const { user: apiUser, farmer: apiFarmer, verificationStatus: rawStatus } = apiResult.data;
        const vStatus = rawStatus.toLowerCase() as VerificationStatus;
        const newFarmerRecord: AuthUser = {
          id: apiFarmer.id,
          name: apiUser.name,
          email: apiUser.email,
          role: 'farmer',
          phone: apiUser.phone || '',
          avatar: apiUser.avatar || '',
          profilePhoto: apiUser.avatar || '',
          farmId: apiFarmer.id,
          farmName: apiFarmer.farmName,
          location: apiFarmer.location,
          verificationStatus: vStatus,
          isVerified: apiFarmer.isVerified,
          registeredAt: apiFarmer.registeredAt,
        };

        try {
          const registeredStr = localStorage.getItem(REGISTERED_FARMERS_KEY);
          const registeredList = registeredStr ? JSON.parse(registeredStr) : [];
          registeredList.push({
            ...newFarmerRecord,
            farmLocation: apiFarmer.farmLocation,
            farmingMethod: apiFarmer.farmingMethod,
            mainCrops: apiFarmer.mainCrops,
            yearsFarming: apiFarmer.yearsFarming,
            pincode: apiFarmer.pincode,
            city: apiFarmer.city,
            state: apiFarmer.state,
            hub: apiFarmer.hub,
          });
          localStorage.setItem(REGISTERED_FARMERS_KEY, JSON.stringify(registeredList));
        } catch {}

        setIsLoading(false);
        return { success: true, user: newFarmerRecord };
      }
    } catch (apiErr: any) {
      setIsLoading(false);
      console.error('Farmer registration error:', apiErr);
      
      // Provide more specific error messages based on error type
      if (apiErr.status === 0) {
        // Network error
        return { 
          success: false, 
          error: 'Unable to connect to the server. Please check your internet connection and ensure the backend is running.' 
        };
      }
      if (apiErr.status === 409) {
        // Conflict - likely duplicate email
        return { 
          success: false, 
          error: 'An account with this email already exists. Please use a different email or try logging in.' 
        };
      }
      if (apiErr.status === 400) {
        // Bad request - validation error
        return { 
          success: false, 
          error: apiErr.message || 'Invalid registration data. Please check your details and try again.' 
        };
      }
      if (apiErr.status === 500) {
        // Server error
        return { 
          success: false, 
          error: 'Server error occurred. Please try again later or contact support.' 
        };
      }
      
      return { success: false, error: apiErr.message || 'Registration failed. Please try again.' };
    }

    setIsLoading(false);
    return { success: false, error: 'Failed to create farmer account.' };
  };

  const signup = async (data: FarmerSignupData) => signupFarmer(data);

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setRole(null);
    setVerificationStatus('Verified');
    setIsLoading(false);

    try {
      clearAuthToken();
      clearAdminToken();
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          isAuthenticated: false,
          user: null,
          role: null,
          verificationStatus: 'Verified',
        })
      );
      localStorage.removeItem('krishi_role');
      localStorage.removeItem('krishi_farmer_auth');
    } catch {}

    router.push('/farmer/login');
  };

  const switchRole = (newRole: UserRole | null) => {
    if (newRole === 'consumer') {
      demoLoginConsumer();
    } else if (newRole === 'farmer') {
      demoLoginFarmer();
    } else if (newRole === 'admin') {
      setIsAuthenticated(true);
      setUser(DEMO_ADMIN_USER);
      setRole('admin');
      setVerificationStatus('Verified');
      setIsLoading(false);
      persistAuthState(true, DEMO_ADMIN_USER, 'admin', 'Verified');
    } else {
      // Visitor mode - logout without redirecting to login page
      setIsAuthenticated(false);
      setUser(null);
      setRole(null);
      setVerificationStatus('Verified');
      setIsLoading(false);

      try {
        clearAuthToken();
        clearAdminToken();
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({
            isAuthenticated: false,
            user: null,
            role: null,
            verificationStatus: 'Verified',
          })
        );
        localStorage.removeItem('krishi_role');
        localStorage.removeItem('krishi_farmer_auth');
      } catch {}
    }
  };

  const updateVerificationStatus = (newStatus: VerificationStatus) => {
    setVerificationStatus(newStatus);
    if (user) {
      const updatedUser = { ...user, verificationStatus: newStatus };
      setUser(updatedUser);
      persistAuthState(isAuthenticated, updatedUser, role, newStatus);
    }
  };

  const updateUser = (updated: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updated };
      persistAuthState(isAuthenticated, next, role, next.verificationStatus);

      // If registered farmer, also update in REGISTERED_FARMERS_KEY
      try {
        const regStr = localStorage.getItem(REGISTERED_FARMERS_KEY);
        if (regStr) {
          const list: any[] = JSON.parse(regStr);
          const idx = list.findIndex((f) => f.id === next.id);
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...updated };
            localStorage.setItem(REGISTERED_FARMERS_KEY, JSON.stringify(list));
          }
        }
      } catch {}

      return next;
    });
  };

  const requestPasswordReset = async (email: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return true;
  };

  const resetPassword = async (email: string, newPass: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return true;
  };

  const approveFarmer = async (farmerId: string, adminId: string = 'admin-1'): Promise<boolean> => {
    try {
      if (!getAdminToken()) {
        await api.loginAdmin();
      }
      await api.approveFarmer(farmerId);
    } catch (e) {
      console.warn('Backend approveFarmer call note:', e);
    }

    try {
      const regStr = localStorage.getItem(REGISTERED_FARMERS_KEY);
      if (regStr) {
        const list: any[] = JSON.parse(regStr);
        const idx = list.findIndex((f) => f.id === farmerId || f.farmId === farmerId || f.userId === farmerId);
        if (idx !== -1) {
          list[idx].verificationStatus = 'approved';
          list[idx].approvedAt = new Date().toISOString();
          list[idx].approvedBy = adminId;
          list[idx].rejectionReason = '';
          list[idx].isVerified = true;
          localStorage.setItem(REGISTERED_FARMERS_KEY, JSON.stringify(list));
        }
      }
    } catch {}

    // If currently logged-in user is this farmer, update immediately
    setUser((prev) => {
      if (prev && (prev.id === farmerId || prev.farmId === farmerId)) {
        const updated: AuthUser = {
          ...prev,
          verificationStatus: 'approved',
          approvedAt: new Date().toISOString(),
          approvedBy: adminId,
          rejectionReason: '',
          isVerified: true,
        };
        setVerificationStatus('approved');
        persistAuthState(isAuthenticated, updated, role, 'approved');
        return updated;
      }
      return prev;
    });

    return true;
  };

  const rejectFarmer = async (farmerId: string, reason: string): Promise<boolean> => {
    try {
      if (!getAdminToken()) {
        await api.loginAdmin();
      }
      await api.rejectFarmer(farmerId, reason);
    } catch (e) {
      console.warn('Backend rejectFarmer call note:', e);
    }

    try {
      const regStr = localStorage.getItem(REGISTERED_FARMERS_KEY);
      if (regStr) {
        const list: any[] = JSON.parse(regStr);
        const idx = list.findIndex((f) => f.id === farmerId || f.farmId === farmerId || f.userId === farmerId);
        if (idx !== -1) {
          list[idx].verificationStatus = 'rejected';
          list[idx].rejectionReason = reason;
          list[idx].isVerified = false;
          localStorage.setItem(REGISTERED_FARMERS_KEY, JSON.stringify(list));
        }
      }
    } catch {}

    // If currently logged-in user is this farmer, update immediately
    setUser((prev) => {
      if (prev && (prev.id === farmerId || prev.farmId === farmerId)) {
        const updated: AuthUser = {
          ...prev,
          verificationStatus: 'rejected',
          rejectionReason: reason,
          isVerified: false,
        };
        setVerificationStatus('rejected');
        persistAuthState(isAuthenticated, updated, role, 'rejected');
        return updated;
      }
      return prev;
    });

    return true;
  };

  const resubmitFarmer = (farmerId: string, updatedData?: Record<string, unknown>) => {
    try {
      const regStr = localStorage.getItem(REGISTERED_FARMERS_KEY);
      if (regStr) {
        const list: any[] = JSON.parse(regStr);
        const idx = list.findIndex((f) => f.id === farmerId);
        if (idx !== -1) {
          list[idx] = {
            ...list[idx],
            ...(updatedData || {}),
            verificationStatus: 'pending',
            rejectionReason: '',
            resubmittedAt: new Date().toISOString(),
          };
          localStorage.setItem(REGISTERED_FARMERS_KEY, JSON.stringify(list));
        }
      }
    } catch {}

    // If currently logged-in user is this farmer, update immediately
    setUser((prev) => {
      if (prev && prev.id === farmerId) {
        const updated: AuthUser = {
          ...prev,
          ...(updatedData || {}),
          verificationStatus: 'pending',
          rejectionReason: '',
        };
        setVerificationStatus('pending');
        persistAuthState(isAuthenticated, updated, role, 'pending');
        return updated;
      }
      return prev;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        role,
        verificationStatus,
        isLoading,
        login,
        loginConsumer,
        loginFarmer,
        demoLoginConsumer,
        demoLoginFarmer,
        demoLogin,
        signupConsumer,
        signupFarmer,
        signup,
        approveFarmer,
        rejectFarmer,
        resubmitFarmer,
        logout,
        switchRole,
        updateVerificationStatus,
        updateUser,
        requestPasswordReset,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
