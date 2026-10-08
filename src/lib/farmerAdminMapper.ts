import { AdminFarmerRecord, AdminDocument, VerificationHistoryEntry } from '@/data/admin';

export interface BackendFarmerRecord {
  id: string;
  userId?: string;
  farmName: string;
  farmLocation?: string;
  location?: string;
  city?: string;
  state?: string;
  pincode?: string;
  hub?: string;
  farmingMethod?: string;
  yearsFarming?: number;
  acreage?: number | string | { toString(): string };
  mainCrops?: string[];
  farmDescription?: string | null;
  story?: string | null;
  certifications?: string[];
  coverImage?: string | null;
  isVerified?: boolean;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
  registeredAt?: string;
  approvedAt?: string | null;
  approvedById?: string | null;
  approvedBy?: { id: string; name: string; email: string } | null;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    avatar?: string | null;
  } | null;
  verificationDocuments?: Array<{
    id: string;
    farmerId?: string;
    type?: string;
    title?: string;
    fileName?: string;
    fileUrl?: string;
    fileSize?: number | null;
    mimeType?: string | null;
    isVerified?: boolean;
    notes?: string | null;
    createdAt?: string;
  }>;
}

export function formatFarmingMethod(method?: string): string {
  if (!method) return 'Organic';
  const clean = method.replace(/_/g, ' ');
  return clean
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function mapBackendFarmerToAdminRecord(f: BackendFarmerRecord): AdminFarmerRecord {
  const documents: AdminDocument[] = (f.verificationDocuments || []).map((doc) => ({
    id: doc.id,
    name: doc.title || doc.fileName || 'Verification Document',
    type: doc.type || 'DOCUMENT',
    fileName: doc.fileName || 'document.pdf',
    fileSize: doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : 'PDF / Document',
    mimeType: doc.mimeType || 'application/pdf',
    uploadedAt: doc.createdAt || f.registeredAt || new Date().toISOString(),
    url: doc.fileUrl || '',
    verified: Boolean(doc.isVerified),
  }));

  const history: VerificationHistoryEntry[] = [];
  if (f.registeredAt) {
    history.push({
      id: `reg-${f.id}`,
      status: 'PENDING',
      actionDate: f.registeredAt,
      actedBy: 'System (Online Application)',
      notes: 'Grower registered and submitted profile details.',
    });
  }

  const rawStatus = String(f.verificationStatus || 'PENDING').toLowerCase();
  const status: 'pending' | 'approved' | 'rejected' =
    rawStatus === 'approved' ? 'approved' : rawStatus === 'rejected' ? 'rejected' : 'pending';

  if (f.approvedAt) {
    history.push({
      id: `app-${f.id}`,
      status: 'APPROVED',
      actionDate: f.approvedAt,
      actedBy: f.approvedBy?.name || 'Krishi Governance Admin',
      notes: 'Application approved. Marketplace accreditation granted.',
    });
  } else if (status === 'rejected') {
    history.push({
      id: `rej-${f.id}`,
      status: 'REJECTED',
      actionDate: f.registeredAt || new Date().toISOString(),
      actedBy: 'Krishi Governance Admin',
      reason: f.rejectionReason || 'Application rejected.',
      notes: 'Verification declined with feedback.',
    });
  }

  return {
    id: f.id,
    userId: f.userId || f.user?.id,
    name: f.user?.name || f.farmName || 'Unknown Farmer',
    fullName: f.user?.name || f.farmName || 'Unknown Farmer',
    email: f.user?.email || 'No email provided',
    phone: f.user?.phone || 'No phone provided',
    avatar: f.user?.avatar || f.coverImage || 'https://images.unsplash.com/photo-1544717305-2782549b5136',
    farmName: f.farmName || 'Krishi Partner Farm',
    location: f.location || `${f.city || 'Bengaluru'}, ${f.state || 'Karnataka'}`,
    city: f.city || 'Bengaluru',
    state: f.state || 'Karnataka',
    pincode: f.pincode || '',
    hub: f.hub || f.city || 'Bengaluru Hub',
    farmingMethod: formatFarmingMethod(f.farmingMethod),
    yearsFarming: Number(f.yearsFarming || 1),
    acreage: Number(f.acreage || 0),
    mainCrops: Array.isArray(f.mainCrops) ? f.mainCrops : [],
    description: f.farmDescription || f.story || 'Practicing sustainable farming in peri-urban Bengaluru.',
    isVerified: Boolean(f.isVerified),
    verificationStatus: status,
    rejectionReason: f.rejectionReason || undefined,
    registeredAt: f.registeredAt || new Date().toISOString(),
    approvedAt: f.approvedAt || undefined,
    approvedBy: f.approvedBy?.name || (f.approvedById ? 'Krishi Governance Admin' : undefined),
    certifications: Array.isArray(f.certifications) ? f.certifications : [],
    documents,
    history,
  };
}
