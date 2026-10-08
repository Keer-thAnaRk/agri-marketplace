import { prisma } from '../db/prisma';
import { comparePassword, hashPassword } from '../utils/password';

export interface FarmerSettingsData {
  account: {
    name: string;
    email: string;
    phone: string;
  };
  notifications: {
    orderAlerts: boolean;
    smsAlerts: boolean;
    inventoryWarnings: boolean;
    marketingEmail: boolean;
  };
  security: {
    twoFactorAuth: boolean;
  };
  preferences: {
    currency: string;
    payoutSchedule: string;
    autoPauseLowStock: boolean;
  };
  language: string;
}

export interface UpdateFarmerSettingsInput {
  account?: {
    name?: string;
    phone?: string;
  };
  notifications?: {
    orderAlerts?: boolean;
    smsAlerts?: boolean;
    inventoryWarnings?: boolean;
    marketingEmail?: boolean;
  };
  security?: {
    twoFactorAuth?: boolean;
  };
  preferences?: {
    payoutSchedule?: string;
    autoPauseLowStock?: boolean;
  };
  language?: string;
  [key: string]: any;
}

export interface ChangePasswordInput {
  currentPassword?: string;
  newPassword?: string;
}

export const DEFAULT_FARMER_SETTINGS = {
  notifications: {
    orderAlerts: true,
    smsAlerts: true,
    inventoryWarnings: true,
    marketingEmail: false,
  },
  security: {
    twoFactorAuth: true,
  },
  preferences: {
    currency: 'INR (₹)',
    payoutSchedule: 'Weekly (Every Friday)',
    autoPauseLowStock: true,
  },
  language: 'English',
};

const FORBIDDEN_FIELDS = [
  'role',
  'isActive',
  'verificationStatus',
  'isVerified',
  'approvedAt',
  'approvedBy',
  'rejectionReason',
  'passwordHash',
  'password',
  'userId',
  'farmerId',
];

export class FarmerSettingsService {
  /**
   * 1. GET FARMER SETTINGS
   * Returns current settings for authenticated farmer from User record.
   */
  async getFarmerSettings(userId: string): Promise<FarmerSettingsData> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        settings: true,
      },
    });

    if (!user) {
      const err = new Error('User account not found.');
      (err as any).status = 404;
      throw err;
    }

    const rawSettings = (user.settings as any) || {};

    return {
      account: {
        name: user.name,
        email: user.email,
        phone: user.phone || '',
      },
      notifications: {
        orderAlerts:
          typeof rawSettings.notifications?.orderAlerts === 'boolean'
            ? rawSettings.notifications.orderAlerts
            : DEFAULT_FARMER_SETTINGS.notifications.orderAlerts,
        smsAlerts:
          typeof rawSettings.notifications?.smsAlerts === 'boolean'
            ? rawSettings.notifications.smsAlerts
            : DEFAULT_FARMER_SETTINGS.notifications.smsAlerts,
        inventoryWarnings:
          typeof rawSettings.notifications?.inventoryWarnings === 'boolean'
            ? rawSettings.notifications.inventoryWarnings
            : DEFAULT_FARMER_SETTINGS.notifications.inventoryWarnings,
        marketingEmail:
          typeof rawSettings.notifications?.marketingEmail === 'boolean'
            ? rawSettings.notifications.marketingEmail
            : DEFAULT_FARMER_SETTINGS.notifications.marketingEmail,
      },
      security: {
        twoFactorAuth:
          typeof rawSettings.security?.twoFactorAuth === 'boolean'
            ? rawSettings.security.twoFactorAuth
            : DEFAULT_FARMER_SETTINGS.security.twoFactorAuth,
      },
      preferences: {
        currency: 'INR (₹)',
        payoutSchedule:
          typeof rawSettings.preferences?.payoutSchedule === 'string'
            ? rawSettings.preferences.payoutSchedule
            : DEFAULT_FARMER_SETTINGS.preferences.payoutSchedule,
        autoPauseLowStock:
          typeof rawSettings.preferences?.autoPauseLowStock === 'boolean'
            ? rawSettings.preferences.autoPauseLowStock
            : DEFAULT_FARMER_SETTINGS.preferences.autoPauseLowStock,
      },
      language:
        typeof rawSettings.language === 'string'
          ? rawSettings.language
          : DEFAULT_FARMER_SETTINGS.language,
    };
  }

  /**
   * 2. UPDATE FARMER SETTINGS
   * Updates account and preferences in PostgreSQL User record.
   * Strictly guards against protected fields tampering.
   */
  async updateFarmerSettings(
    userId: string,
    input: UpdateFarmerSettingsInput
  ): Promise<FarmerSettingsData> {
    // 1. Guard against any attempt to modify protected governance fields
    for (const field of FORBIDDEN_FIELDS) {
      if (input[field] !== undefined) {
        const err = new Error(`Modification of protected field "${field}" is prohibited.`);
        (err as any).status = 403;
        throw err;
      }
    }

    // 2. Fetch existing user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, phone: true, settings: true },
    });

    if (!user) {
      const err = new Error('User account not found.');
      (err as any).status = 404;
      throw err;
    }

    // 3. Prepare User columns update
    const userUpdateData: { name?: string; phone?: string } = {};
    if (input.account?.name !== undefined) {
      const trimmedName = String(input.account.name).trim();
      if (trimmedName.length === 0) {
        const err = new Error('Name cannot be empty.');
        (err as any).status = 400;
        throw err;
      }
      userUpdateData.name = trimmedName;
    }
    if (input.account?.phone !== undefined) {
      userUpdateData.phone = String(input.account.phone).trim();
    }

    // 4. Merge JSON settings
    const currentSettings = (user.settings as any) || {};
    const nextSettings = {
      ...currentSettings,
      notifications: {
        ...(currentSettings.notifications || DEFAULT_FARMER_SETTINGS.notifications),
        ...(input.notifications || {}),
      },
      security: {
        ...(currentSettings.security || DEFAULT_FARMER_SETTINGS.security),
        ...(input.security || {}),
      },
      preferences: {
        ...(currentSettings.preferences || DEFAULT_FARMER_SETTINGS.preferences),
        ...(input.preferences || {}),
      },
      language:
        input.language !== undefined
          ? String(input.language)
          : currentSettings.language || DEFAULT_FARMER_SETTINGS.language,
    };

    // 5. Persist to PostgreSQL
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...userUpdateData,
        settings: nextSettings,
      },
    });

    return this.getFarmerSettings(userId);
  }

  /**
   * 3. CHANGE PASSWORD
   * Verifies current password using bcrypt and atomically updates passwordHash.
   */
  async changePassword(userId: string, input: ChangePasswordInput) {
    // 1. Validation
    if (!input.currentPassword || typeof input.currentPassword !== 'string' || input.currentPassword.trim().length === 0) {
      const err = new Error('Current password is required.');
      (err as any).status = 400;
      throw err;
    }

    if (!input.newPassword || typeof input.newPassword !== 'string' || input.newPassword.trim().length === 0) {
      const err = new Error('New password is required.');
      (err as any).status = 400;
      throw err;
    }

    if (input.newPassword.length < 6) {
      const err = new Error('New password must be at least 6 characters long.');
      (err as any).status = 400;
      throw err;
    }

    if (input.currentPassword === input.newPassword) {
      const err = new Error('New password cannot be identical to the current password.');
      (err as any).status = 400;
      throw err;
    }

    // 2. Fetch current user passwordHash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      const err = new Error('User account not found.');
      (err as any).status = 404;
      throw err;
    }

    // 3. Verify current password
    const isMatch = await comparePassword(input.currentPassword, user.passwordHash);
    if (!isMatch) {
      const err = new Error('Incorrect current password.');
      (err as any).status = 400;
      throw err;
    }

    // 4. Hash new password & update
    const newHash = await hashPassword(input.newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return {
      success: true,
      message: 'Password updated successfully.',
    };
  }
}

export const farmerSettingsService = new FarmerSettingsService();
