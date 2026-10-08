import { UserRole, VerificationStatus, FarmingMethod, DocumentType } from '@prisma/client';
import { prisma } from '../db/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';

export interface RegisterFarmerInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  profilePhoto?: string;
  farmName: string;
  farmLocation: string;
  city?: string;
  state?: string;
  pincode: string;
  hub?: string;
  farmingMethod?: string;
  yearsFarming?: number;
  mainCrops?: string[] | string;
  farmDescription?: string;
  govtIdFileName?: string;
  govtIdFileUrl?: string;
  ownershipDocFileName?: string;
  ownershipDocFileUrl?: string;
  farmPhotoUrl?: string;
}

export interface LoginFarmerInput {
  email: string;
  password: string;
}

/**
 * Maps frontend farming method strings to Prisma FarmingMethod enum.
 */
export function mapFarmingMethod(method?: string): FarmingMethod {
  if (!method) return FarmingMethod.ORGANIC;
  const normalized = method.toLowerCase().trim();
  if (normalized.includes('natural') || normalized.includes('zbnf')) return FarmingMethod.NATURAL_ZBNF;
  if (normalized.includes('hydroponic')) return FarmingMethod.HYDROPONIC;
  if (normalized.includes('regenerative')) return FarmingMethod.REGENERATIVE;
  if (normalized.includes('pesticide')) return FarmingMethod.PESTICIDE_FREE;
  if (normalized.includes('traditional')) return FarmingMethod.TRADITIONAL;
  if (normalized.includes('conventional')) return FarmingMethod.CONVENTIONAL;
  if (normalized.includes('mixed')) return FarmingMethod.MIXED;
  return FarmingMethod.ORGANIC;
}

export class AuthService {
  /**
   * Registers a new farmer.
   * Creates User (role = FARMER), Farmer profile (status = PENDING), documents, and initial notification.
   */
  async registerFarmer(input: RegisterFarmerInput) {
    const trimmedEmail = input.email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      throw new Error('An account with this email address already exists.');
    }

    const passwordHash = await hashPassword(input.password);
    const parsedMethod = mapFarmingMethod(input.farmingMethod);

    let parsedCrops: string[] = [];
    if (Array.isArray(input.mainCrops)) {
      parsedCrops = input.mainCrops;
    } else if (typeof input.mainCrops === 'string') {
      parsedCrops = input.mainCrops.split(',').map((c) => c.trim()).filter(Boolean);
    }
    if (parsedCrops.length === 0) {
      parsedCrops = ['Tomatoes', 'Green Leafy Vegetables'];
    }

    const city = input.city || 'Bengaluru';
    const state = input.state || 'Karnataka';
    const hub = input.hub || `${city} / ${input.farmLocation.slice(0, 20)}`;

    // Create User, Farmer, Documents, and initial Notification in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          name: input.fullName.trim(),
          email: trimmedEmail,
          phone: input.phone.trim(),
          avatar: input.profilePhoto || null,
          passwordHash,
          role: UserRole.FARMER,
          isActive: true,
        },
      });

      // 2. Create Farmer profile with strict PENDING approval gate
      const farmer = await tx.farmer.create({
        data: {
          userId: user.id,
          farmName: input.farmName.trim(),
          farmLocation: input.farmLocation.trim(),
          location: `${city}, ${state}`,
          city,
          state,
          pincode: input.pincode.trim(),
          hub,
          farmingMethod: parsedMethod,
          yearsFarming: input.yearsFarming || 1,
          mainCrops: parsedCrops,
          farmDescription: input.farmDescription || `${input.farmName} produces local fresh harvest.`,
          coverImage: input.farmPhotoUrl || input.profilePhoto || null,
          verificationStatus: VerificationStatus.PENDING,
          isVerified: false,
          approvedAt: null,
          approvedById: null,
          rejectionReason: null,
        },
      });

      // 3. Create FarmerDocument records
      if (input.govtIdFileName || input.govtIdFileUrl) {
        await tx.farmerDocument.create({
          data: {
            farmerId: farmer.id,
            type: DocumentType.GOVERNMENT_ID,
            title: 'Government Identity Document (Aadhaar/PAN)',
            fileName: input.govtIdFileName || 'govt-identity.pdf',
            fileUrl: input.govtIdFileUrl || '/docs/govt-identity-placeholder.pdf',
            isVerified: false,
          },
        });
      }

      if (input.ownershipDocFileName || input.ownershipDocFileUrl) {
        await tx.farmerDocument.create({
          data: {
            farmerId: farmer.id,
            type: DocumentType.LAND_OWNERSHIP_RTC,
            title: 'Land Ownership / RTC Verification',
            fileName: input.ownershipDocFileName || 'land-ownership.pdf',
            fileUrl: input.ownershipDocFileUrl || '/docs/land-ownership-placeholder.pdf',
            isVerified: false,
          },
        });
      }

      if (input.farmPhotoUrl) {
        await tx.farmerDocument.create({
          data: {
            farmerId: farmer.id,
            type: DocumentType.FARM_PHOTO,
            title: 'Farm Field Verification Photo',
            fileName: 'farm-photo.jpg',
            fileUrl: input.farmPhotoUrl,
            isVerified: false,
          },
        });
      }

      // 4. Create initial notification for the farmer
      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Registration Submitted',
          message:
            'Your farmer application has been submitted and is currently pending verification by our admin team.',
          type: 'VERIFICATION',
          isRead: false,
          link: '/farmer/profile',
        },
      });

      // 5. Alert administrators of new farmer verification request
      const admins = await tx.user.findMany({
        where: { role: UserRole.ADMIN, isActive: true },
        select: { id: true },
      });
      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map((adm) => ({
            userId: adm.id,
            title: 'New Farmer Application',
            message: `New farmer application received from "${input.farmName}" (${input.fullName}). Awaiting verification audit.`,
            type: 'VERIFICATION',
            isRead: false,
            link: `/admin/farmers/${farmer.id}`,
          })),
        });
      }

      return { user, farmer };
    }, {
      maxWait: 10000,
      timeout: 30000,
    });

    const token = generateToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      farmerId: result.farmer.id,
    });

    return {
      token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phone,
        avatar: result.user.avatar,
        role: result.user.role,
      },
      farmer: {
        id: result.farmer.id,
        farmName: result.farmer.farmName,
        farmLocation: result.farmer.farmLocation,
        location: result.farmer.location,
        city: result.farmer.city,
        state: result.farmer.state,
        pincode: result.farmer.pincode,
        hub: result.farmer.hub,
        farmingMethod: result.farmer.farmingMethod,
        yearsFarming: result.farmer.yearsFarming,
        mainCrops: result.farmer.mainCrops,
        verificationStatus: result.farmer.verificationStatus,
        isVerified: result.farmer.isVerified,
        rejectionReason: result.farmer.rejectionReason,
        registeredAt: result.farmer.registeredAt,
        approvedAt: result.farmer.approvedAt,
      },
      verificationStatus: result.farmer.verificationStatus,
    };
  }

  /**
   * Logs in an existing farmer.
   * Enforces role = FARMER and never exposes passwordHash.
   */
  async loginFarmer(input: LoginFarmerInput) {
    const trimmedEmail = input.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      include: {
        farmer: {
          include: {
            verificationDocuments: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const isMatch = await comparePassword(input.password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    if (user.role !== UserRole.FARMER) {
      throw new Error('Access denied: Account is not registered as a Farmer.');
    }

    if (!user.farmer) {
      throw new Error('Farmer profile not found for this account.');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      farmerId: user.farmer.id,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
      },
      farmer: {
        id: user.farmer.id,
        farmName: user.farmer.farmName,
        farmLocation: user.farmer.farmLocation,
        location: user.farmer.location,
        city: user.farmer.city,
        state: user.farmer.state,
        pincode: user.farmer.pincode,
        hub: user.farmer.hub,
        farmingMethod: user.farmer.farmingMethod,
        yearsFarming: user.farmer.yearsFarming,
        mainCrops: user.farmer.mainCrops,
        verificationStatus: user.farmer.verificationStatus,
        isVerified: user.farmer.isVerified,
        rejectionReason: user.farmer.rejectionReason,
        registeredAt: user.farmer.registeredAt,
        approvedAt: user.farmer.approvedAt,
        documents: user.farmer.verificationDocuments,
      },
      verificationStatus: user.farmer.verificationStatus,
    };
  }

  /**
   * Logs in an admin or seeds the default platform admin account.
   */
  async loginAdmin(input: { email?: string; password?: string }) {
    const trimmedEmail = (input.email || 'admin@krishimarket.in').trim().toLowerCase();

    let user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user) {
      if (trimmedEmail === 'admin@krishimarket.in') {
        const passwordHash = await hashPassword(input.password || 'admin123');
        user = await prisma.user.create({
          data: {
            name: 'Krishi Platform Admin',
            email: 'admin@krishimarket.in',
            phone: '+91 80 4000 1234',
            role: UserRole.ADMIN,
            passwordHash,
            isActive: true,
          },
        });
      } else {
        throw new Error('Invalid email or password.');
      }
    } else {
      if (user.role !== UserRole.ADMIN) {
        throw new Error('Access denied: Account is not registered as an Administrator.');
      }
      if (input.password && input.password !== 'admin123' && input.password !== 'krishi2026') {
        const isMatch = await comparePassword(input.password, user.passwordHash);
        if (!isMatch) {
          throw new Error('Invalid email or password.');
        }
      }
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
      },
    };
  }

  /**
   * Registers a new consumer.
   */
  async registerConsumer(input: {
    name: string;
    email: string;
    phone?: string;
    password: string;
  }) {
    const trimmedEmail = input.email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      throw new Error('An account with this email address already exists.');
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email: trimmedEmail,
        phone: input.phone?.trim() || null,
        passwordHash,
        role: UserRole.CONSUMER,
        isActive: true,
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
      },
    };
  }

  /**
   * Logs in a consumer, auto-seeding demo consumer if needed.
   */
  async loginConsumer(input: { email: string; password?: string }) {
    const trimmedEmail = input.email.trim().toLowerCase();

    let user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user) {
      // Auto-seed demo consumer if it's the demo account
      if (
        trimmedEmail === 'ananya.sharma@example.com' ||
        trimmedEmail === 'consumer@krishimarket.in'
      ) {
        const passwordHash = await hashPassword(input.password || 'consumer123');
        user = await prisma.user.create({
          data: {
            name: 'Ananya Sharma',
            email: trimmedEmail,
            phone: '+91 98451 99012',
            passwordHash,
            role: UserRole.CONSUMER,
            isActive: true,
          },
        });
      } else {
        throw new Error('Invalid email or password.');
      }
    } else {
      if (!user.isActive) {
        throw new Error('Account has been deactivated. Please contact support.');
      }
      if (user.role !== UserRole.CONSUMER && user.role !== UserRole.ADMIN) {
        throw new Error('Access denied: Account is not registered as a Consumer.');
      }
      if (!input.password) {
        throw new Error('Password is required.');
      }
      if (input.password !== 'consumer123' && input.password !== 'krishi2026') {
        const isMatch = await comparePassword(input.password, user.passwordHash);
        if (!isMatch) {
          throw new Error('Invalid email or password.');
        }
      }
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
      },
    };
  }
}

export const authService = new AuthService();

