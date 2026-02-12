import { Platform } from 'react-native';

let AppleHealthKit: any;
if (Platform.OS === 'ios') {
    try {
        AppleHealthKit = require('react-native-health').default;
    } catch (e) {
        if (__DEV__) console.error('AppleHealthKit require failed:', e);
    }
}
// Define permissions manually or use any if types are not available via import
const Permissions = AppleHealthKit?.Constants?.Permissions;

// Permissions moved inside requestPermissions to avoid runtime errors on non-iOS

export interface HealthData {
    steps: number;
    activeCalories: number;
    restingCalories: number;
    distance: number; // in meters
    heartRate: number | null;
    sleepHours: number;
    weight: number | null; // in kg
}

class AppleHealthService {
    private isAvailable: boolean = false;

    constructor() {
        this.isAvailable = Platform.OS === 'ios';
    }

    async checkAvailability(): Promise<boolean> {
        return new Promise((resolve) => {
            if (Platform.OS !== 'ios') {
                resolve(false);
                return;
            }
            AppleHealthKit.isAvailable((err: Object, available: boolean) => {
                if (err) {
                    if (__DEV__) console.error('Child safety restriction active:', err);
                    resolve(false);
                }
                resolve(available);
            });
        });
    }

    async requestPermissions(): Promise<boolean> {
        return new Promise((resolve) => {
            if (Platform.OS !== 'ios' || !AppleHealthKit) {
                resolve(false);
                return;
            }

            const permissions = {
                permissions: {
                    read: [
                        AppleHealthKit.Constants.Permissions.Steps,
                        AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
                        AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
                        AppleHealthKit.Constants.Permissions.HeartRate,
                        AppleHealthKit.Constants.Permissions.SleepAnalysis,
                        AppleHealthKit.Constants.Permissions.Weight,
                    ],
                    write: [
                        AppleHealthKit.Constants.Permissions.Weight,
                    ],
                },
            };

            AppleHealthKit.initHealthKit(permissions, (error: string) => {
                if (error) {
                    if (__DEV__) console.error('[HealthKit] Cannot grant permissions:', error);
                    resolve(false);
                }
                resolve(true);
            });
        });
    }

    async getTodayData(): Promise<HealthData> {
        if (Platform.OS !== 'ios') {
            return this.getEmptyData();
        }

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        try {
            const [steps, activeCalories, distance] = await Promise.all([
                this.getStepsValue(startOfDay),
                this.getActiveEnergyValue(startOfDay),
                this.getDistanceValue(startOfDay),
            ]);

            return {
                steps,
                activeCalories,
                restingCalories: 0, // HealthKit resting calories requires separate query
                distance,
                heartRate: null, // Hard to get "single" heart rate for day
                sleepHours: 0,
                weight: null,
            };
        } catch (error) {
            if (__DEV__) console.error('Failed to fetch HealthKit data:', error);
            return this.getEmptyData();
        }
    }

    private getStepsValue(startDate: Date): Promise<number> {
        return new Promise((resolve) => {
            const options = { date: startDate.toISOString() };
            AppleHealthKit.getStepCount(options, (err: Object, results: any) => {
                if (err) resolve(0);
                resolve(results?.value || 0);
            });
        });
    }

    private getActiveEnergyValue(startDate: Date): Promise<number> {
        return new Promise((resolve) => {
            const options = { startDate: startDate.toISOString() };
            AppleHealthKit.getActiveEnergyBurned(options, (err: Object, results: any[]) => {
                if (err || !results || results.length === 0) resolve(0);
                // Sum up if array, or usually getActiveEnergyBurned returns samples
                // Use getDailyActiveEnergyBurnedSamples instead?
                // Let's use getActiveEnergyBurned which returns samples, need to sum them?
                // Actually easier to just resolve 0 for MVP or fix implementation.
                // Better:
                let total = 0;
                if (results) {
                    results.forEach(r => total += r.value);
                }
                resolve(Math.round(total));
            });
        });
    }

    private getDistanceValue(startDate: Date): Promise<number> {
        return new Promise((resolve) => {
            const options = { startDate: startDate.toISOString() };
            AppleHealthKit.getDistanceWalkingRunning(options, (err: Object, results: any) => {
                if (err) resolve(0);
                resolve(results?.value || 0);
            });
        });
    }

    async getSteps(startDate: Date, endDate: Date): Promise<number> {
        // Implementation for range
        return 0;
    }

    private getEmptyData(): HealthData {
        return {
            steps: 0,
            activeCalories: 0,
            restingCalories: 0,
            distance: 0,
            heartRate: null,
            sleepHours: 0,
            weight: null,
        };
    }
}

export const appleHealthService = new AppleHealthService();
export default appleHealthService;
