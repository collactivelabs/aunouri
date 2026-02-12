/**
 * AuNouri - Unified Health Service
 * Abstracts platform-specific health integrations
 */

import { Platform } from 'react-native';
import { HealthData as AppleHealthData, appleHealthService } from './apple';
import { GoogleFitData, googleFitService } from './google';
import { HealthConnectData, samsungHealthService } from './samsung';

export type HealthProvider = 'apple' | 'google' | 'samsung' | 'none';

export interface UnifiedHealthData {
    steps: number;
    activeCalories: number;
    totalCalories: number;
    distance: number;
    heartRate: number | null;
    weight: number | null;
    sleepHours: number;
    lastSynced: Date | null;
    provider: HealthProvider;
}

export interface HealthConnectionStatus {
    provider: HealthProvider;
    isConnected: boolean;
    isAvailable: boolean;
    permissions: string[];
}

class UnifiedHealthService {
    private currentProvider: HealthProvider = 'none';
    private lastSyncTime: Date | null = null;

    /**
     * Get the recommended health provider for the current platform
     */
    getRecommendedProvider(): HealthProvider {
        if (Platform.OS === 'ios') {
            return 'apple';
        } else if (Platform.OS === 'android') {
            // Could be either Google Fit or Samsung Health via Health Connect
            return 'google';
        }
        return 'none';
    }

    /**
     * Get available providers for the current platform
     */
    getAvailableProviders(): HealthProvider[] {
        if (Platform.OS === 'ios') {
            return ['apple'];
        } else if (Platform.OS === 'android') {
            return ['google', 'samsung'];
        }
        return [];
    }

    /**
     * Connect to a health provider
     */
    async connect(provider: HealthProvider): Promise<boolean> {
        try {
            let success = false;

            switch (provider) {
                case 'apple':
                    success = await appleHealthService.requestPermissions();
                    break;
                case 'google':
                    success = await googleFitService.authorize();
                    break;
                case 'samsung':
                    success = await samsungHealthService.requestPermissions();
                    break;
                default:
                    return false;
            }

            if (success) {
                this.currentProvider = provider;
            }
            return success;
        } catch (error) {
            if (__DEV__) console.error(`Failed to connect to ${provider}:`, error);
            return false;
        }
    }

    /**
     * Disconnect from current health provider
     */
    async disconnect(): Promise<void> {
        if (this.currentProvider === 'google') {
            await googleFitService.disconnect();
        }
        this.currentProvider = 'none';
        this.lastSyncTime = null;
    }

    /**
     * Get current connection status
     */
    async getConnectionStatus(): Promise<HealthConnectionStatus> {
        const provider = this.currentProvider;
        let isAvailable = false;

        switch (provider) {
            case 'apple':
                isAvailable = await appleHealthService.checkAvailability();
                break;
            case 'google':
                isAvailable = await googleFitService.checkAvailability();
                break;
            case 'samsung':
                const status = await samsungHealthService.checkAvailability();
                isAvailable = status.available;
                break;
        }

        return {
            provider,
            isConnected: provider !== 'none',
            isAvailable,
            permissions: [],
        };
    }

    /**
     * Sync today's health data
     */
    async syncTodayData(): Promise<UnifiedHealthData> {
        let data: UnifiedHealthData = this.getEmptyData();

        try {
            switch (this.currentProvider) {
                case 'apple':
                    const appleData = await appleHealthService.getTodayData();
                    data = this.transformAppleData(appleData);
                    break;
                case 'google':
                    const googleData = await googleFitService.getTodayData();
                    data = this.transformGoogleData(googleData);
                    break;
                case 'samsung':
                    const samsungData = await samsungHealthService.getTodayData();
                    data = this.transformSamsungData(samsungData);
                    break;
                default:
                    return data;
            }

            this.lastSyncTime = new Date();
            data.lastSynced = this.lastSyncTime;
            data.provider = this.currentProvider;

            return data;
        } catch (error) {
            if (__DEV__) console.error('Failed to sync health data:', error);
            return data;
        }
    }

    /**
     * Get steps for a date range
     */
    async getSteps(startDate: Date, endDate: Date): Promise<number> {
        switch (this.currentProvider) {
            case 'apple':
                return appleHealthService.getSteps(startDate, endDate);
            case 'google':
                return googleFitService.getSteps(startDate, endDate);
            case 'samsung':
                return samsungHealthService.getSteps(startDate, endDate);
            default:
                return 0;
        }
    }

    private transformAppleData(data: AppleHealthData): UnifiedHealthData {
        return {
            steps: data.steps,
            activeCalories: data.activeCalories,
            totalCalories: data.activeCalories + data.restingCalories,
            distance: data.distance,
            heartRate: data.heartRate,
            weight: data.weight,
            sleepHours: data.sleepHours,
            lastSynced: null,
            provider: 'apple',
        };
    }

    private transformGoogleData(data: GoogleFitData): UnifiedHealthData {
        return {
            steps: data.steps,
            activeCalories: Math.round(data.calories * 0.3), // Estimate active portion
            totalCalories: data.calories,
            distance: data.distance,
            heartRate: data.heartRate,
            weight: data.weight,
            sleepHours: data.sleepHours,
            lastSynced: null,
            provider: 'google',
        };
    }

    private transformSamsungData(data: HealthConnectData): UnifiedHealthData {
        return {
            steps: data.steps,
            activeCalories: Math.round(data.calories * 0.3),
            totalCalories: data.calories,
            distance: data.distance,
            heartRate: data.heartRate,
            weight: data.weight,
            sleepHours: data.sleepHours,
            lastSynced: null,
            provider: 'samsung',
        };
    }

    private getEmptyData(): UnifiedHealthData {
        return {
            steps: 0,
            activeCalories: 0,
            totalCalories: 0,
            distance: 0,
            heartRate: null,
            weight: null,
            sleepHours: 0,
            lastSynced: null,
            provider: 'none',
        };
    }
}

export const healthService = new UnifiedHealthService();
export default healthService;
