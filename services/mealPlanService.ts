/**
 * AuNouri - Meal Plan Service
 * Handles meal plan generation, storage, and retrieval
 */

import { arrayUnion, collection, doc, getDoc, getDocs, limit, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { anthropicService, DayPlan, Ingredient, Meal, UserContext } from './anthropicService';
import { cycleService } from './cycle';
import { db } from './firebase';

export interface StoredMealPlan {
    id: string;
    userId: string;
    createdAt: Date;
    startDate: Date;
    endDate: Date;
    duration: '1week' | '2weeks' | '4weeks';
    status: 'active' | 'completed' | 'cancelled';
    days: DayPlan[];
    shoppingList: Ingredient[];
    summary: string;
}

export interface FavoriteMeal extends Meal {
    savedAt: Date;
    source: 'ai_generated' | 'recipe_db';
}

class MealPlanService {
    /**
     * Generate a new meal plan using Claude
     */
    async generatePlan(
        userId: string,
        userProfile: any,
        duration: '1week' | '2weeks' | '4weeks' = '1week'
    ): Promise<StoredMealPlan> {
        // Get cycle info for context
        let cycleInfo = null;
        try {
            cycleInfo = await cycleService.getCycleInfo(userId);
        } catch (error) {
            console.log('[MealPlan] Could not get cycle info:', error);
        }

        // Build user context for AI
        const context: UserContext = {
            calorieGoal: userProfile.calorieGoal || 1800,
            proteinGoal: userProfile.proteinGoal || 90,
            carbsGoal: userProfile.carbsGoal || 180,
            fatGoal: userProfile.fatGoal || 60,
            dietaryPreferences: userProfile.dietaryPreferences || [],
            allergies: userProfile.allergies || [],
            isDiabetic: userProfile.isDiabetic || false,
            diabetesType: userProfile.diabetesType,
            cyclePhase: cycleInfo?.currentPhase,
            dayOfCycle: cycleInfo?.dayOfCycle,
            weightGoal: userProfile.weightGoal || 'maintain',
            activityLevel: userProfile.activityLevel || 'moderate',
        };

        // Determine number of days
        const daysCount = duration === '1week' ? 7 : duration === '2weeks' ? 14 : 28;

        console.log('[MealPlan] Generating', daysCount, 'day plan for user:', userId);

        // Generate plan with AI
        const aiResponse = await anthropicService.generateMealPlan(context, daysCount);

        // Calculate dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + daysCount);

        // Create stored plan
        const planId = `plan_${userId}_${Date.now()}`;
        const storedPlan: StoredMealPlan = {
            id: planId,
            userId,
            createdAt: new Date(),
            startDate,
            endDate,
            duration,
            status: 'active',
            days: aiResponse.days,
            shoppingList: aiResponse.shoppingList,
            summary: aiResponse.summary,
        };

        // Save to Firestore
        await this.savePlan(storedPlan);

        console.log('[MealPlan] Plan saved with ID:', planId);
        return storedPlan;
    }

    /**
     * Save a meal plan to Firestore
     */
    async savePlan(plan: StoredMealPlan): Promise<void> {
        const planRef = doc(db, 'mealPlans', plan.id);
        await setDoc(planRef, {
            ...plan,
            createdAt: plan.createdAt.toISOString(),
            startDate: plan.startDate.toISOString(),
            endDate: plan.endDate.toISOString(),
        });
    }

    /**
     * Get the active meal plan for a user
     */
    async getActivePlan(userId: string): Promise<StoredMealPlan | null> {
        try {
            const plansRef = collection(db, 'mealPlans');
            const q = query(
                plansRef,
                where('userId', '==', userId),
                where('status', '==', 'active'),
                orderBy('createdAt', 'desc'),
                limit(1)
            );

            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;

            const data = snapshot.docs[0].data();
            return {
                ...data,
                createdAt: new Date(data.createdAt),
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
            } as StoredMealPlan;
        } catch (error) {
            console.error('[MealPlan] Failed to get active plan:', error);
            return null;
        }
    }

    /**
     * Get a specific meal plan by ID
     */
    async getPlan(planId: string): Promise<StoredMealPlan | null> {
        try {
            const planRef = doc(db, 'mealPlans', planId);
            const snapshot = await getDoc(planRef);

            if (!snapshot.exists()) return null;

            const data = snapshot.data();
            return {
                ...data,
                createdAt: new Date(data.createdAt),
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
            } as StoredMealPlan;
        } catch (error) {
            console.error('[MealPlan] Failed to get plan:', error);
            return null;
        }
    }

    /**
     * Get the shopping list for a plan
     */
    getShoppingList(plan: StoredMealPlan): Ingredient[] {
        return plan.shoppingList || [];
    }

    /**
     * Get today's meals from the active plan
     */
    getTodaysMeals(plan: StoredMealPlan): DayPlan | null {
        const today = new Date();
        const startDate = new Date(plan.startDate);
        const dayIndex = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        if (dayIndex < 0 || dayIndex >= plan.days.length) {
            return null;
        }

        return plan.days[dayIndex];
    }

    /**
     * Save a meal to favorites
     */
    async saveFavorite(userId: string, meal: Meal): Promise<void> {
        try {
            const userFavsRef = doc(db, 'users', userId);
            const favMeal: FavoriteMeal = {
                ...meal,
                savedAt: new Date(),
                source: 'ai_generated',
            };

            await updateDoc(userFavsRef, {
                favoriteMeals: arrayUnion(favMeal),
            });

            console.log('[MealPlan] Saved favorite meal:', meal.name);
        } catch (error) {
            console.error('[MealPlan] Failed to save favorite:', error);
            throw error;
        }
    }

    /**
     * Get user's favorite meals
     */
    async getFavorites(userId: string): Promise<FavoriteMeal[]> {
        try {
            const userRef = doc(db, 'users', userId);
            const snapshot = await getDoc(userRef);

            if (!snapshot.exists()) return [];

            const data = snapshot.data();
            return data.favoriteMeals || [];
        } catch (error) {
            console.error('[MealPlan] Failed to get favorites:', error);
            return [];
        }
    }

    /**
     * Cancel/complete an active plan
     */
    async updatePlanStatus(planId: string, status: 'completed' | 'cancelled'): Promise<void> {
        try {
            const planRef = doc(db, 'mealPlans', planId);
            await updateDoc(planRef, { status });
        } catch (error) {
            console.error('[MealPlan] Failed to update plan status:', error);
            throw error;
        }
    }

    /**
     * Get plan history for a user
     */
    async getPlanHistory(userId: string, limitCount: number = 10): Promise<StoredMealPlan[]> {
        try {
            const plansRef = collection(db, 'mealPlans');
            const q = query(
                plansRef,
                where('userId', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    createdAt: new Date(data.createdAt),
                    startDate: new Date(data.startDate),
                    endDate: new Date(data.endDate),
                } as StoredMealPlan;
            });
        } catch (error) {
            console.error('[MealPlan] Failed to get plan history:', error);
            return [];
        }
    }
}

export const mealPlanService = new MealPlanService();
export default mealPlanService;
