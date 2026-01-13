/**
 * AuNouri - Feature Access Service
 * Manages feature access based on user tier (Guest, Registered, Premium)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// User subscription tiers
export type UserTier = 'guest' | 'registered' | 'premium';

// Features that have tiered access
export type TieredFeature =
    | 'cycle_tracking'
    | 'meal_recommendations'
    | 'meal_history'
    | 'meal_logging'
    | 'health_sync'
    | 'friends'
    | 'meal_plans'
    | 'analytics';

// Access limits by tier (in days, or count for meal_logging)
interface TierLimits {
    cycle_tracking: number;      // days of history
    meal_recommendations: number; // days of access
    meal_history: number;        // days of history
    meal_logging: number;        // meals per day
    health_sync: boolean;
    friends: boolean;
    meal_plans: boolean;
    analytics: boolean;
}

const TIER_LIMITS: Record<UserTier, TierLimits> = {
    guest: {
        cycle_tracking: 3,
        meal_recommendations: 3,
        meal_history: 3,
        meal_logging: 3,
        health_sync: false,
        friends: false,
        meal_plans: false,
        analytics: false,
    },
    registered: {
        cycle_tracking: 7,
        meal_recommendations: 7,
        meal_history: 7,
        meal_logging: -1, // unlimited
        health_sync: true,
        friends: true,
        meal_plans: false,
        analytics: false,
    },
    premium: {
        cycle_tracking: -1, // unlimited
        meal_recommendations: -1,
        meal_history: -1,
        meal_logging: -1,
        health_sync: true,
        friends: true,
        meal_plans: true,
        analytics: true,
    },
};

// Storage keys
const USAGE_KEY = '@aunouri_feature_usage';
const TIER_KEY = '@aunouri_user_tier';

interface FeatureUsage {
    meal_logging_today: number;
    meal_logging_date: string; // ISO date string
    first_use_date: string;    // When user first started using features
}

class FeatureAccessService {
    private cachedTier: UserTier | null = null;

    /**
     * Get the user's current tier
     */
    async getUserTier(): Promise<UserTier> {
        if (this.cachedTier) return this.cachedTier;

        try {
            const tier = await AsyncStorage.getItem(TIER_KEY);
            this.cachedTier = (tier as UserTier) || 'guest';
            return this.cachedTier;
        } catch {
            return 'guest';
        }
    }

    /**
     * Set the user's tier (called on login/upgrade)
     */
    async setUserTier(tier: UserTier): Promise<void> {
        this.cachedTier = tier;
        await AsyncStorage.setItem(TIER_KEY, tier);
    }

    /**
     * Get limits for a specific tier
     */
    getLimitsForTier(tier: UserTier): TierLimits {
        return TIER_LIMITS[tier];
    }

    /**
     * Check if a feature is fully accessible (boolean features)
     */
    async hasAccess(feature: 'health_sync' | 'friends' | 'meal_plans' | 'analytics'): Promise<boolean> {
        const tier = await this.getUserTier();
        return TIER_LIMITS[tier][feature];
    }

    /**
     * Get the day limit for a time-limited feature
     * Returns -1 for unlimited, or number of days
     */
    async getDayLimit(feature: 'cycle_tracking' | 'meal_recommendations' | 'meal_history'): Promise<number> {
        const tier = await this.getUserTier();
        return TIER_LIMITS[tier][feature];
    }

    /**
     * Get the cutoff date for time-limited features
     * Data older than this date should not be accessible
     */
    async getCutoffDate(feature: 'cycle_tracking' | 'meal_recommendations' | 'meal_history'): Promise<Date | null> {
        const limit = await this.getDayLimit(feature);
        if (limit === -1) return null; // No limit

        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - limit);
        cutoff.setHours(0, 0, 0, 0);
        return cutoff;
    }

    /**
     * Check if user can log another meal today
     */
    async canLogMeal(): Promise<{ allowed: boolean; remaining: number; limit: number }> {
        const tier = await this.getUserTier();
        const limit = TIER_LIMITS[tier].meal_logging;

        if (limit === -1) {
            return { allowed: true, remaining: -1, limit: -1 };
        }

        const usage = await this.getUsage();
        const today = new Date().toISOString().split('T')[0];

        // Reset count if it's a new day
        if (usage.meal_logging_date !== today) {
            usage.meal_logging_today = 0;
            usage.meal_logging_date = today;
            await this.saveUsage(usage);
        }

        const remaining = limit - usage.meal_logging_today;
        return {
            allowed: remaining > 0,
            remaining: Math.max(0, remaining),
            limit,
        };
    }

    /**
     * Record a meal log (call after successful meal logging)
     */
    async recordMealLog(): Promise<void> {
        const usage = await this.getUsage();
        const today = new Date().toISOString().split('T')[0];

        if (usage.meal_logging_date !== today) {
            usage.meal_logging_today = 1;
            usage.meal_logging_date = today;
        } else {
            usage.meal_logging_today++;
        }

        await this.saveUsage(usage);
    }

    /**
     * Get feature usage data
     */
    private async getUsage(): Promise<FeatureUsage> {
        try {
            const data = await AsyncStorage.getItem(USAGE_KEY);
            if (data) return JSON.parse(data);
        } catch { }

        const today = new Date().toISOString().split('T')[0];
        return {
            meal_logging_today: 0,
            meal_logging_date: today,
            first_use_date: today,
        };
    }

    /**
     * Save feature usage data
     */
    private async saveUsage(usage: FeatureUsage): Promise<void> {
        await AsyncStorage.setItem(USAGE_KEY, JSON.stringify(usage));
    }

    /**
     * Get upgrade message for a feature
     */
    getUpgradeMessage(feature: TieredFeature, currentTier: UserTier): string {
        if (currentTier === 'guest') {
            switch (feature) {
                case 'meal_logging':
                    return 'Create a free account for unlimited meal logging!';
                case 'meal_history':
                case 'cycle_tracking':
                case 'meal_recommendations':
                    return 'Create a free account to access 7 days of history!';
                case 'health_sync':
                case 'friends':
                    return 'Create a free account to unlock this feature!';
                default:
                    return 'Upgrade to Premium for full access!';
            }
        } else if (currentTier === 'registered') {
            switch (feature) {
                case 'meal_history':
                case 'cycle_tracking':
                case 'meal_recommendations':
                    return 'Upgrade to Premium for unlimited history!';
                case 'meal_plans':
                case 'analytics':
                    return 'Upgrade to Premium to unlock this feature!';
                default:
                    return 'Upgrade to Premium for the full experience!';
            }
        }
        return '';
    }

    /**
     * Get tier display name
     */
    getTierName(tier: UserTier): string {
        switch (tier) {
            case 'guest': return 'Guest';
            case 'registered': return 'Free';
            case 'premium': return 'Premium';
        }
    }

    /**
     * Clear all cached data (call on logout)
     */
    clearCache(): void {
        this.cachedTier = null;
    }
}

export const featureAccess = new FeatureAccessService();
export default featureAccess;
