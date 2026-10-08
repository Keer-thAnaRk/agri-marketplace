'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminTablePagination } from '@/components/admin/AdminTablePagination';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import {
  Users,
  UserCheck,
  UserX,
  Search,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Eye,
  Loader2,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  MapPin,
  ShoppingBag,
  Lock,
  Phone,
  Mail,
  Calendar,
  X,
  Store,
} from 'lucide-react';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: 'ADMIN' | 'FARMER' | 'CONSUMER';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  farmer: {
    id: string;
    farmName: string;
    hub: string;
    city: string;
    verificationStatus: string;
    isVerified: boolean;
  } | null;
  _count?: {
    orders: number;
    reviews: number;
  };
}

interface UserDetailRecord extends UserRecord {
  farmer: {
    id: string;
    farmName: string;
    location: string;
    city: string;
    state: string;
    hub: string;
    farmingMethod: string;
    acreage: number;
    verificationStatus: string;
    isVerified: boolean;
    approvedAt: string | null;
  } | null;
  addresses?: Array<{
    id: string;
    name: string;
    phone: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
    hub: string;
    isDefault: boolean;
  }>;
  orders?: Array<{
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
  _count?: {
    orders: number;
    reviews: number;
    disputes: number;
  };
}

function AdminUsersContent() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'FARMER' | 'CONSUMER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Status Action Modal State
  const [statusModalUser, setStatusModalUser] = useState<UserRecord | null>(null);
  const [targetStatus, setTargetStatus] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusActionError, setStatusActionError] = useState<string | null>(null);

  // User Details Modal State
  const [detailModalUserId, setDetailModalUserId] = useState<string | null>(null);
  const [detailUser, setDetailUser] = useState<UserDetailRecord | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Toast feedback
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    api
      .getAdminUsers({
        search: searchQuery.trim() || undefined,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        page: currentPage,
        limit: itemsPerPage,
      })
      .then((res) => {
        if (!isMounted) return;
        if (res && res.success) {
          setUsers(res.data || res.users || []);
          if (res.pagination) {
            setTotalCount(res.pagination.total);
          } else {
            setTotalCount((res.data || []).length);
          }
        } else {
          setUsers([]);
          setTotalCount(0);
        }
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        console.error('Failed to load users from PostgreSQL:', err);
        setLoadError(err instanceof Error ? err.message : 'Unable to load users. Please try again.');
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [searchQuery, roleFilter, statusFilter, currentPage, itemsPerPage, refreshTrigger]);

  // Load detailed user record when modal opens
  useEffect(() => {
    let isMounted = true;
    if (!detailModalUserId) {
      return;
    }

    api
      .getAdminUserById(detailModalUserId)
      .then((res) => {
        if (!isMounted) return;
        if (res && res.data) {
          setDetailUser(res.data);
        } else {
          setDetailError('User details could not be retrieved.');
        }
        setIsLoadingDetail(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        console.error('Failed to fetch user details:', err);
        setDetailError(err instanceof Error ? err.message : 'Failed to fetch details');
        setIsLoadingDetail(false);
      });

    return () => {
      isMounted = false;
    };
  }, [detailModalUserId]);

  const handleOpenStatusModal = (userItem: UserRecord, makeActive: boolean) => {
    if (currentUser?.id === userItem.id) {
      setFeedbackMessage({
        type: 'error',
        text: 'Self-protection: You cannot deactivate your own administrative account.',
      });
      return;
    }
    setStatusModalUser(userItem);
    setTargetStatus(makeActive);
    setStatusActionError(null);
  };

  const handleOpenDetailModal = (id: string) => {
    setDetailUser(null);
    setDetailError(null);
    setIsLoadingDetail(true);
    setDetailModalUserId(id);
  };

  const handleCloseDetailModal = () => {
    setDetailModalUserId(null);
    setDetailUser(null);
    setDetailError(null);
  };

  const handleConfirmStatusChange = async () => {
    if (!statusModalUser) return;

    if (currentUser?.id === statusModalUser.id) {
      setStatusActionError('Self-protection: Administrators cannot deactivate their own accounts.');
      return;
    }

    setIsUpdatingStatus(true);
    setStatusActionError(null);

    try {
      const res = await api.updateAdminUserStatus(statusModalUser.id, targetStatus);
      if (res && res.success) {
        setFeedbackMessage({
          type: 'success',
          text: `User ${statusModalUser.name} has been ${targetStatus ? 'activated' : 'deactivated'} successfully.`,
        });

        // Update list in place
        setUsers((prev) =>
          prev.map((u) => (u.id === statusModalUser.id ? { ...u, isActive: targetStatus } : u))
        );

        // Update detail modal if open
        if (detailUser && detailUser.id === statusModalUser.id) {
          setDetailUser((prev) => (prev ? { ...prev, isActive: targetStatus } : null));
        }

        setStatusModalUser(null);
        setRefreshTrigger((v) => v + 1);
      } else {
        setStatusActionError(res?.message || 'Failed to update user status.');
      }
    } catch (err: unknown) {
      console.error('Error changing user status:', err);
      setStatusActionError(err instanceof Error ? err.message : 'An error occurred while updating status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Quick stats calculation
  const stats = useMemo(() => {
    const total = totalCount;
    const active = users.filter((u) => u.isActive).length;
    const inactive = users.filter((u) => !u.isActive).length;
    const farmersCount = users.filter((u) => u.role === 'FARMER').length;
    const consumersCount = users.filter((u) => u.role === 'CONSUMER').length;
    return { total, active, inactive, farmersCount, consumersCount };
  }, [totalCount, users]);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            Admin
          </span>
        );
      case 'FARMER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Store className="w-3.5 h-3.5 text-emerald-600" />
            Farmer
          </span>
        );
      case 'CONSUMER':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
            Consumer
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-10 h-10 rounded-2xl bg-forest-50 text-forest-700 flex items-center justify-center shadow-2xs">
              <Users className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif tracking-tight">
                User Management
              </h1>
              <p className="text-xs text-slate-500">
                Audited identity and access governance for consumers, farmers, and administrative operators.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setRefreshTrigger((v) => v + 1);
            }}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-medium animate-in fade-in duration-200 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Registered Users"
          value={totalCount}
          subtext="Across all roles in database"
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <AdminStatCard
          title="Active Accounts"
          value={stats.active}
          subtext="Currently enabled access"
          icon={UserCheck}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <AdminStatCard
          title="Deactivated Accounts"
          value={stats.inactive}
          subtext="Revoked login access"
          icon={UserX}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
        />
        <AdminStatCard
          title="Superadmin Operators"
          value={users.filter((u) => u.role === 'ADMIN').length}
          subtext="Governance authority"
          icon={ShieldCheck}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or phone number..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
            {(
              [
                { label: 'All Roles', value: 'ALL' },
                { label: 'Consumers', value: 'CONSUMER' },
                { label: 'Farmers', value: 'FARMER' },
                { label: 'Admins', value: 'ADMIN' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setRoleFilter(tab.value);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  roleFilter === tab.value
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'ALL' | 'active' | 'inactive');
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-forest-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-forest-600 animate-spin" />
            <span className="text-xs font-bold text-slate-500">Loading platform users from PostgreSQL...</span>
          </div>
        ) : loadError ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900 mb-1">Failed to Load Users</h3>
            <p className="text-xs text-slate-500 mb-4">{loadError}</p>
            <button
              type="button"
              onClick={() => setRefreshTrigger((v) => v + 1)}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : users.length === 0 ? (
          <AdminEmptyState
            icon={Users}
            title="No Users Found"
            description={
              searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'No users match your search and filter criteria. Try clearing some filters.'
                : 'There are currently no registered users in the database.'
            }
            actionText={searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL' ? 'Clear Filters' : undefined}
            onAction={() => {
              setSearchQuery('');
              setRoleFilter('ALL');
              setStatusFilter('ALL');
              setCurrentPage(1);
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">User / Identity</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Profile & Activity</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {users.map((item) => {
                  const isCurrentAdmin = currentUser?.id === item.id;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Identity Column */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 overflow-hidden relative shadow-2xs">
                            {item.avatar ? (
                              <Image
                                src={item.avatar}
                                alt={item.name}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              item.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 truncate">{item.name}</span>
                              {isCurrentAdmin && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{item.email}</span>
                            </div>
                            {item.phone && (
                              <div className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{item.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role Column */}
                      <td className="py-4 px-4 whitespace-nowrap">{getRoleBadge(item.role)}</td>

                      {/* Status Column */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {item.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Associated Details Column */}
                      <td className="py-4 px-4">
                        {item.role === 'FARMER' && item.farmer ? (
                          <div className="text-xs space-y-0.5">
                            <div className="font-bold text-slate-800 flex items-center gap-1">
                              <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{item.farmer.farmName}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">
                                {item.farmer.city || item.farmer.hub || 'Hub unassigned'}
                              </span>
                            </div>
                          </div>
                        ) : item.role === 'CONSUMER' ? (
                          <div className="text-xs space-y-0.5 text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <ShoppingBag className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span>{item._count?.orders ?? 0} Orders placed</span>
                            </div>
                            {typeof item._count?.reviews === 'number' && item._count.reviews > 0 && (
                              <div className="text-[11px] text-slate-400">
                                {item._count.reviews} Reviews submitted
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-purple-700 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                            <span>System Administrator</span>
                          </div>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatDate(item.createdAt)}</span>
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* View details */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetailModal(item.id)}
                            className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                            title="View Full Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Toggle status */}
                          {item.isActive ? (
                            <button
                              type="button"
                              onClick={() => handleOpenStatusModal(item, false)}
                              disabled={isCurrentAdmin}
                              title={
                                isCurrentAdmin
                                  ? 'Self-protection: You cannot deactivate your own account'
                                  : 'Deactivate Account'
                              }
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ${
                                isCurrentAdmin
                                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer'
                              }`}
                            >
                              {isCurrentAdmin ? (
                                <>
                                  <Lock className="w-3 h-3" />
                                  <span>Protected</span>
                                </>
                              ) : (
                                <>
                                  <UserX className="w-3 h-3" />
                                  <span>Deactivate</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenStatusModal(item, true)}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Activate Account"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Activate</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Server Pagination */}
        {!isLoading && !loadError && users.length > 0 && (
          <AdminTablePagination
            currentPage={currentPage}
            totalItems={totalCount}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
          />
        )}
      </div>

      {/* Confirmation Modal: Activate / Deactivate */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 text-center">
              <button
                type="button"
                onClick={() => setStatusModalUser(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3.5 shadow-xs ${
                  targetStatus ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}
              >
                {targetStatus ? <UserCheck className="w-7 h-7" /> : <UserX className="w-7 h-7" />}
              </div>

              <h3 className="text-lg font-extrabold text-slate-900 font-serif">
                {targetStatus ? 'Activate User Account' : 'Deactivate User Account'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                You are about to {targetStatus ? 'activate' : 'deactivate'} access for{' '}
                <span className="font-bold text-slate-900">{statusModalUser.name}</span> (
                {statusModalUser.email}).
              </p>

              <div
                className={`mt-4 p-3.5 border rounded-2xl text-left text-xs space-y-1 ${
                  targetStatus
                    ? 'bg-emerald-50/70 border-emerald-100 text-emerald-900'
                    : 'bg-rose-50/70 border-rose-100 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {targetStatus ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
                  )}
                  <span>{targetStatus ? 'Account Access Restored' : 'Operational Implication'}</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {targetStatus
                    ? 'Upon activation, this user will regain full access to sign in, interact with marketplace orders, and manage inventory/listings.'
                    : 'Deactivating this user revokes their active sessions and prevents them from logging in. Historical records (harvests, orders, payouts) remain safely preserved in PostgreSQL.'}
                </p>
              </div>

              {statusActionError && (
                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs text-left flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{statusActionError}</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setStatusModalUser(null)}
                disabled={isUpdatingStatus}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={isUpdatingStatus}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                  targetStatus ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isUpdatingStatus ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Confirm {targetStatus ? 'Activation' : 'Deactivation'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Slide-over / Modal */}
      {detailModalUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-forest-50 border border-forest-100 text-forest-700 flex items-center justify-center font-bold text-sm shadow-2xs">
                  {detailUser?.avatar ? (
                    <Image
                      src={detailUser.avatar}
                      alt={detailUser.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    detailUser?.name.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 font-serif">
                    {detailUser?.name || 'User Profile'}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {detailUser && getRoleBadge(detailUser.role)}
                    {detailUser && (
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          detailUser.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {detailUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseDetailModal}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-700">
              {isLoadingDetail ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-forest-600 animate-spin" />
                  <span className="font-bold text-slate-500">Fetching comprehensive user records...</span>
                </div>
              ) : detailError ? (
                <div className="p-6 text-center">
                  <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                  <p className="text-rose-700 font-bold">{detailError}</p>
                </div>
              ) : detailUser ? (
                <>
                  {/* Basic Credentials Card */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Account & Contact Information
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] text-slate-400 block">User ID</span>
                        <span className="font-mono text-[11px] text-slate-800 break-all">{detailUser.id}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Email Address</span>
                        <span className="font-bold text-slate-900">{detailUser.email}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Phone Number</span>
                        <span className="font-medium text-slate-800">{detailUser.phone || 'Not provided'}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Joined Platform</span>
                        <span className="font-medium text-slate-800">{formatDate(detailUser.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Role Specific Section: FARMER */}
                  {detailUser.role === 'FARMER' && detailUser.farmer && (
                    <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 space-y-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                        <Store className="w-4 h-4 text-emerald-700" />
                        <span>Registered Farm Profile</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-emerald-950">
                        <div>
                          <span className="text-[11px] text-emerald-700 block">Farm Name</span>
                          <span className="font-bold">{detailUser.farmer.farmName}</span>
                        </div>
                        <div>
                          <span className="text-[11px] text-emerald-700 block">Assigned Hub / City</span>
                          <span className="font-bold">
                            {detailUser.farmer.hub || detailUser.farmer.city || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-emerald-700 block">Farming Method</span>
                          <span className="font-bold">{detailUser.farmer.farmingMethod || 'Standard Organic'}</span>
                        </div>
                        <div>
                          <span className="text-[11px] text-emerald-700 block">Verification Status</span>
                          <span className="inline-flex items-center gap-1 font-bold">
                            {detailUser.farmer.isVerified ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                            )}
                            {detailUser.farmer.verificationStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Role Specific Section: CONSUMER */}
                  {detailUser.role === 'CONSUMER' && (
                    <div className="space-y-4">
                      {/* Consumer Metrics */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-100 text-center">
                          <span className="text-[11px] font-bold uppercase text-blue-700 block">Total Orders</span>
                          <span className="text-xl font-extrabold text-blue-950">
                            {detailUser._count?.orders ?? 0}
                          </span>
                        </div>
                        <div className="bg-purple-50/60 p-3 rounded-2xl border border-purple-100 text-center">
                          <span className="text-[11px] font-bold uppercase text-purple-700 block">Reviews</span>
                          <span className="text-xl font-extrabold text-purple-950">
                            {detailUser._count?.reviews ?? 0}
                          </span>
                        </div>
                        <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-100 text-center">
                          <span className="text-[11px] font-bold uppercase text-amber-700 block">Disputes</span>
                          <span className="text-xl font-extrabold text-amber-950">
                            {detailUser._count?.disputes ?? 0}
                          </span>
                        </div>
                      </div>

                      {/* Recent Orders List */}
                      {detailUser.orders && detailUser.orders.length > 0 && (
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Recent Platform Orders
                          </div>
                          <div className="space-y-2">
                            {detailUser.orders.map((ord) => (
                              <div
                                key={ord.id}
                                className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                              >
                                <div>
                                  <span className="font-bold text-slate-900 block">{ord.orderNumber}</span>
                                  <span className="text-[11px] text-slate-400">{formatDate(ord.createdAt)}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-slate-900 block">₹{ord.total}</span>
                                  <span className="text-[10px] font-bold uppercase text-slate-500">
                                    {ord.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Addresses */}
                      {detailUser.addresses && detailUser.addresses.length > 0 && (
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Delivery Addresses
                          </div>
                          <div className="space-y-2">
                            {detailUser.addresses.map((addr) => (
                              <div
                                key={addr.id}
                                className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-slate-900">{addr.name}</span>
                                  {addr.isDefault && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-500 text-[11px]">
                                  {addr.addressLine}, {addr.city}, {addr.state} - {addr.pincode}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Role Specific Section: ADMIN */}
                  {detailUser.role === 'ADMIN' && (
                    <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-purple-800">
                        <ShieldCheck className="w-4 h-4 text-purple-700" />
                        <span>Administrator Privileges</span>
                      </div>
                      <p className="text-xs text-purple-900 leading-relaxed">
                        This operator possesses Superadmin access to Krishi Market Governance. Authorized for
                        farmer application approvals, dispute mediation, delivery dispatch verification, and user access management.
                      </p>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Footer with Quick Action */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Sensitive authentication hashes are strictly omitted.
              </span>
              <div className="flex items-center gap-2">
                {detailUser && currentUser?.id !== detailUser.id && (
                  <button
                    type="button"
                    onClick={() => {
                      const userToToggle = users.find((u) => u.id === detailUser.id) || {
                        ...detailUser,
                        _count: {
                          orders: detailUser._count?.orders ?? 0,
                          reviews: detailUser._count?.reviews ?? 0,
                        },
                      };
                      handleOpenStatusModal(userToToggle, !detailUser.isActive);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      detailUser.isActive
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {detailUser.isActive ? 'Deactivate User' : 'Activate User'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCloseDetailModal}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-forest-600 animate-spin" />
          <span className="text-xs font-bold text-slate-500">Loading Krishi Market Governance...</span>
        </div>
      }
    >
      <AdminUsersContent />
    </Suspense>
  );
}
