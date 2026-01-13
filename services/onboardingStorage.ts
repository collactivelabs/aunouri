/**
 * AuNouri - Onboarding Storage Service
 * Temporarily stores onboarding data for guest users
 * Transfers to Firebase after registration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { nutritionCalculator } from './nutrition';

const ONBOARDING_KEY = '@aunouri_onboarding_data';

export interface OnboardingData {
    // Step 1
    age: number;
    heightCm: number;
    weightKg: number;
    biologicalSex: 'female' | 'male';

    // Step 2
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

    // Step 3
    weightGoal: 'lose' | 'maintain' | 'gain';
    targetWeightKg?: number;

    // Step 4
    trackCycle: boolean;
    cycleLength?: number;
    periodLength?: number;
    lastPeriodDate?: string; // stored as ISO string in storage
    trackSymptoms?: boolean;

    // Step 5
    dietaryPreferences: string[];
    allergies: string[];

    // Step 5 (Diabetic Check)
    isDiabetic: boolean;
    diabetesType?: 'type1' | 'type2' | 'gestational' | 'prediabetic';
    usesInsulin?: boolean;

    // Step 6 (Meal Times)
    mealTimes?: {
        breakfast: string;
        lunch: string;
        dinner: string;
    };

    // Calculated
    calorieGoal: number;
    proteinGoal: number;
    carbsGoal: number;
    fatGoal: number;

    // Metadata
    completedAt: string;
}

class OnboardingStorageService {
    /**
     * Save onboarding data locally (for guests)
     */
    async saveOnboardingData(data: Partial<OnboardingData>): Promise<void> {
        try {
            const existing = await this.getOnboardingData();
            const updated = { ...existing, ...data };
            await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(updated));
        } catch (error) {
            console.error('Failed to save onboarding data:', error);
        }
    }

    /**
     * Get saved onboarding data
     */
    async getOnboardingData(): Promise<Partial<OnboardingData> | null> {
        try {
            const data = await AsyncStorage.getItem(ONBOARDING_KEY);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to get onboarding data:', error);
            return null;
        }
    }

    /**
     * Complete onboarding - calculate goals and mark as complete
     */
    async completeOnboarding(data: Partial<OnboardingData>): Promise<OnboardingData> {
        // Calculate personalized goals
        const calorieGoal = nutritionCalculator.calculateCalorieGoal({
            age: data.age!,
            heightCm: data.heightCm!,
            weightKg: data.weightKg!,
            biologicalSex: data.biologicalSex!,
            activityLevel: data.activityLevel!,
            weightGoal: data.weightGoal!,
        });

        const macros = nutritionCalculator.calculateMacroTargets(
            calorieGoal,
            data.weightGoal!,
            data.isDiabetic
        );

        const completeData: OnboardingData = {
            age: data.age!,
            heightCm: data.heightCm!,
            weightKg: data.weightKg!,
            biologicalSex: data.biologicalSex!,
            activityLevel: data.activityLevel!,
            weightGoal: data.weightGoal!,
            targetWeightKg: data.targetWeightKg,
            trackCycle: data.trackCycle ?? false,
            cycleLength: data.cycleLength,
            periodLength: data.periodLength,
            trackSymptoms: data.trackSymptoms,

            dietaryPreferences: data.dietaryPreferences ?? [],
            allergies: data.allergies ?? [],
            isDiabetic: data.isDiabetic ?? false,
            diabetesType: data.diabetesType,
            usesInsulin: data.usesInsulin,
            mealTimes: data.mealTimes,
            calorieGoal,
            proteinGoal: macros.protein,
            carbsGoal: macros.carbs,
            fatGoal: macros.fat,
            completedAt: new Date().toISOString(),
            lastPeriodDate: data.lastPeriodDate,
        };

        await this.saveOnboardingData(completeData);
        return completeData;
    }

    /**
     * Check if onboarding has been completed
     */
    async hasCompletedOnboarding(): Promise<boolean> {
        const data = await this.getOnboardingData();
        return !!(data?.completedAt);
    }

    /**
     * Clear onboarding data (after transfer to account)
     */
    async clearOnboardingData(): Promise<void> {
        try {
            await AsyncStorage.removeItem(ONBOARDING_KEY);
        } catch (error) {
            console.error('Failed to clear onboarding data:', error);
        }
    }

    /**
     * Transfer onboarding data to user profile format
     */
    async getProfileData(): Promise<Record<string, any> | null> {
        const data = await this.getOnboardingData();
        if (!data?.completedAt) return null;

        return {
            age: data.age,
            heightCm: data.heightCm,
            weightKg: data.weightKg,
            biologicalSex: data.biologicalSex,
            activityLevel: data.activityLevel,
            weightGoal: data.weightGoal,
            targetWeightKg: data.targetWeightKg,
            trackCycle: data.trackCycle,
            cycleLength: data.cycleLength,
            periodLength: data.periodLength,
            lastPeriodDate: data.lastPeriodDate,
            trackSymptoms: data.trackSymptoms,
            dietaryPreferences: data.dietaryPreferences,
            allergies: data.allergies,

            isDiabetic: data.isDiabetic,
            diabetesType: data.diabetesType,
            usesInsulin: data.usesInsulin,
            mealTimes: data.mealTimes,
            calorieGoal: data.calorieGoal,
            proteinGoal: data.proteinGoal,
            carbsGoal: data.carbsGoal,
            fatGoal: data.fatGoal,
            onboardingCompleted: true,
        };
    }
}

export const onboardingStorage = new OnboardingStorageService();
export default onboardingStorage;
