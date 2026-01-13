/**
 * AuNouri - useFeatureAccess Hook
 * React hook for checking feature access and showing upgrade prompts
 */

import { useAuth } from '@/contexts/AuthContext';
import { featureAccess, TieredFeature, UserTier } from '@/services/featureAccess';
import { useEffect, useState } from 'react';

interface MealLoggingStatus {
    allowed: boolean;
    remaining: number;
    limit: number;
}

interface FeatureAccessState {
    tier: UserTier;
    loading: boolean;

    // Feature access checks
    canAccessHealthSync: boolean;
    canAccessFriends: boolean;
    canAccessMealPlans: boolean;
    canAccessAnalytics: boolean;

    // Day limits
    cycleTrackingDays: number;
    mealRecommendationsDays: number;
    mealHistoryDays: number;

    // Meal logging
    mealLoggingStatus: MealLoggingStatus;

    // Helpers
    isGuest: boolean;
    isRegistered: boolean;
    isPremium: boolean;

    // Methods
    getCutoffDate: (feature: 'cycle_tracking' | 'meal_recommendations' | 'meal_history') => Date | null;
    getUpgradeMessage: (feature: TieredFeature) => string;
    recordMealLog: () => Promise<void>;
    refreshMealLoggingStatus: () => Promise<void>;
}

export function useFeatureAccess(): FeatureAccessState {
    const { user } = useAuth();
    const [tier, setTier] = useState<UserTier>('guest');
    const [loading, setLoading] = useState(true);
    const [mealLoggingStatus, setMealLoggingStatus] = useState<MealLoggingStatus>({
        allowed: true,
        remaining: 3,
        limit: 3,
    });
    const [cutoffDates, setCutoffDates] = useState<Record<string, Date | null>>({});

    useEffect(() => {
        loadAccess();
    }, [user]);

    const loadAccess = async () => {
        setLoading(true);

        // Determine tier based on auth state
        // In a real app, you'd also check for premium subscription
        const newTier: UserTier = user ? 'registered' : 'guest';
        await featureAccess.setUserTier(newTier);
        setTier(newTier);

        // Load meal logging status
        const mealStatus = await featureAccess.canLogMeal();
        setMealLoggingStatus(mealStatus);

        // Pre-calculate cutoff dates
        const cycleCutoff = await featureAccess.getCutoffDate('cycle_tracking');
        const mealRecCutoff = await featureAccess.getCutoffDate('meal_recommendations');
        const historyCutoff = await featureAccess.getCutoffDate('meal_history');

        setCutoffDates({
            cycle_tracking: cycleCutoff,
            meal_recommendations: mealRecCutoff,
            meal_history: historyCutoff,
        });

        setLoading(false);
    };

    const limits = featureAccess.getLimitsForTier(tier);

    const getCutoffDate = (feature: 'cycle_tracking' | 'meal_recommendations' | 'meal_history'): Date | null => {
        return cutoffDates[feature] || null;
    };

    const getUpgradeMessage = (feature: TieredFeature): string => {
        return featureAccess.getUpgradeMessage(feature, tier);
    };

    const recordMealLog = async (): Promise<void> => {
        await featureAccess.recordMealLog();
        await refreshMealLoggingStatus();
    };

    const refreshMealLoggingStatus = async (): Promise<void> => {
        const status = await featureAccess.canLogMeal();
        setMealLoggingStatus(status);
    };

    return {
        tier,
        loading,

        // Feature access
        canAccessHealthSync: limits.health_sync,
        canAccessFriends: limits.friends,
        canAccessMealPlans: limits.meal_plans,
        canAccessAnalytics: limits.analytics,

        // Day limits (-1 means unlimited)
        cycleTrackingDays: limits.cycle_tracking,
        mealRecommendationsDays: limits.meal_recommendations,
        mealHistoryDays: limits.meal_history,

        // Meal logging
        mealLoggingStatus,

        // Helpers
        isGuest: tier === 'guest',
        isRegistered: tier === 'registered',
        isPremium: tier === 'premium',

        // Methods
        getCutoffDate,
        getUpgradeMessage,
        recordMealLog,
        refreshMealLoggingStatus,
    };
}

export default useFeatureAccess;
