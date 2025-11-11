/**
 * RevenueCat stub integration for in-app purchases
 * In production, use @revenuecat/purchases-react-native
 */

import Constants from 'expo-constants';

export type Entitlement = 'pro' | 'creator';

export interface CustomerInfo {
  activeSubscriptions: string[];
  entitlements: {
    active: Record<string, { productIdentifier: string }>;
  };
}

export interface Package {
  identifier: string;
  product: {
    identifier: string;
    priceString: string;
    title: string;
    description: string;
  };
}

/**
 * Mock RevenueCat interface for development
 * Replace with actual RevenueCat implementation for production
 */
class MockRevenueCat {
  private apiKey: string;
  private isConfigured = false;
  private mockSubscribed = false;

  constructor() {
    this.apiKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_REVENUECAT_API_KEY ||
                  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || '';
  }

  async configure(userId: string): Promise<void> {
    console.log('[RevenueCat Mock] Configuring for user:', userId);
    this.isConfigured = true;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    if (!this.isConfigured) {
      throw new Error('RevenueCat not configured');
    }

    // Return mock customer info
    return {
      activeSubscriptions: this.mockSubscribed ? ['pro_monthly'] : [],
      entitlements: {
        active: this.mockSubscribed
          ? {
              pro: {
                productIdentifier: 'pro_monthly',
              },
            }
          : {},
      },
    };
  }

  async getOfferings(): Promise<{ current?: { availablePackages: Package[] } }> {
    if (!this.isConfigured) {
      throw new Error('RevenueCat not configured');
    }

    // Return mock packages
    return {
      current: {
        availablePackages: [
          {
            identifier: 'monthly',
            product: {
              identifier: 'pro_monthly',
              priceString: '$4.99',
              title: 'Pro Monthly',
              description: 'Unlock all Pro features',
            },
          },
          {
            identifier: 'annual',
            product: {
              identifier: 'pro_annual',
              priceString: '$39.99',
              title: 'Pro Annual',
              description: 'Save 33% with annual billing',
            },
          },
        ],
      },
    };
  }

  async purchasePackage(pkg: Package): Promise<{ customerInfo: CustomerInfo }> {
    console.log('[RevenueCat Mock] Purchasing package:', pkg.identifier);

    // Simulate purchase flow
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock successful purchase
    this.mockSubscribed = true;

    return {
      customerInfo: await this.getCustomerInfo(),
    };
  }

  async restorePurchases(): Promise<{ customerInfo: CustomerInfo }> {
    console.log('[RevenueCat Mock] Restoring purchases');

    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      customerInfo: await this.getCustomerInfo(),
    };
  }

  async setEmail(email: string): Promise<void> {
    console.log('[RevenueCat Mock] Setting email:', email);
  }

  async setAttributes(attributes: Record<string, string>): Promise<void> {
    console.log('[RevenueCat Mock] Setting attributes:', attributes);
  }

  // Helper methods for checking entitlements
  async hasEntitlement(entitlement: Entitlement): Promise<boolean> {
    const customerInfo = await this.getCustomerInfo();
    return entitlement in customerInfo.entitlements.active;
  }

  async isProUser(): Promise<boolean> {
    return this.hasEntitlement('pro');
  }
}

// Export singleton instance
export const RevenueCat = new MockRevenueCat();

/**
 * Hook for accessing RevenueCat in React components
 */
export function useRevenueCat() {
  return {
    RevenueCat,
    hasEntitlement: RevenueCat.hasEntitlement.bind(RevenueCat),
    isProUser: RevenueCat.isProUser.bind(RevenueCat),
  };
}
