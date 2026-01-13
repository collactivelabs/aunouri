/**
 * AuNouri - Meal Tracking Service
 * Save and retrieve meal logs from Firestore
 * NOTE: Uses simple queries without orderBy to avoid index requirements
 */

import { db } from '@/services/firebase';
import { NutritionInfo } from '@/services/foodRecognition';
import {
    addDoc,
    collection,
    getDocs,
    query,
    serverTimestamp,
    where
} from 'firebase/firestore';

export interface MealLog {
    id?: string;
    userId: string;
    foods: NutritionInfo[];
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    photoUri?: string;
    createdAt: Date;
}

export interface DailyNutrition {
    date: string; // YYYY-MM-DD
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    meals: MealLog[];
}

class MealService {
    /**
     * Log a meal to Firestore
     */
    async logMeal(
        userId: string,
        foods: NutritionInfo[],
        mealType: MealLog['mealType'] = 'snack',
        photoUri?: string
    ): Promise<string> {
        const totals = foods.reduce(
            (acc, food) => ({
                calories: acc.calories + food.calories,
                protein: acc.protein + food.protein,
                carbs: acc.carbs + food.carbs,
                fat: acc.fat + food.fat,
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        try {
            const docRef = await addDoc(collection(db, 'meals'), {
                userId,
                foods,
                totalCalories: totals.calories,
                totalProtein: totals.protein,
                totalCarbs: totals.carbs,
                totalFat: totals.fat,
                mealType,
                photoUri,
                createdAt: serverTimestamp(),
            });

            console.log('Meal logged with ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Failed to log meal:', error);
            throw error;
        }
    }

    /**
     * Get meals for a specific date
     */
    async getMealsForDate(userId: string, date: Date): Promise<MealLog[]> {
        const targetDateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

        try {
            // Simple query without orderBy to avoid index requirement
            const mealsRef = collection(db, 'meals');
            const q = query(
                mealsRef,
                where('userId', '==', userId)
            );

            const snapshot = await getDocs(q);
            console.log(`Found ${snapshot.size} total meals for user ${userId}`);

            // Filter and sort in memory
            const meals = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                }))
                .filter(meal => {
                    const mealDateStr = meal.createdAt.toISOString().split('T')[0];
                    return mealDateStr === targetDateStr;
                })
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            console.log(`Filtered to ${meals.length} meals for ${targetDateStr}`);
            return meals as MealLog[];
        } catch (error) {
            console.error('Failed to get meals:', error);
            return [];
        }
    }

    /**
     * Get today's nutrition totals
     */
    async getTodayNutrition(userId: string): Promise<DailyNutrition> {
        const today = new Date();
        const meals = await this.getMealsForDate(userId, today);

        const totals = meals.reduce(
            (acc, meal) => ({
                calories: acc.calories + meal.totalCalories,
                protein: acc.protein + meal.totalProtein,
                carbs: acc.carbs + meal.totalCarbs,
                fat: acc.fat + meal.totalFat,
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        return {
            date: today.toISOString().split('T')[0],
            totalCalories: totals.calories,
            totalProtein: totals.protein,
            totalCarbs: totals.carbs,
            totalFat: totals.fat,
            meals,
        };
    }

    /**
     * Get recent meals (for home screen)
     */
    async getRecentMeals(userId: string, count: number = 5): Promise<MealLog[]> {
        try {
            // Simple query without orderBy to avoid index requirement
            const mealsRef = collection(db, 'meals');
            const q = query(
                mealsRef,
                where('userId', '==', userId)
            );

            const snapshot = await getDocs(q);

            // Sort in memory and limit
            const meals = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                }))
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .slice(0, count);

            return meals as MealLog[];
        } catch (error) {
            console.error('Failed to get recent meals:', error);
            return [];
        }
    }

    /**
     * Calculate user's streak (consecutive days of logging)
     */
    async getStreak(userId: string): Promise<number> {
        try {
            // Simple query without orderBy to avoid index requirement
            const mealsRef = collection(db, 'meals');
            const q = query(
                mealsRef,
                where('userId', '==', userId)
            );

            const snapshot = await getDocs(q);
            if (snapshot.empty) return 0;

            const dates = new Set<string>();
            snapshot.docs.forEach(doc => {
                const date = doc.data().createdAt?.toDate();
                if (date) {
                    dates.add(date.toISOString().split('T')[0]);
                }
            });

            // Count consecutive days from today
            let streak = 0;
            const today = new Date();

            for (let i = 0; i < 365; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(checkDate.getDate() - i);
                const dateStr = checkDate.toISOString().split('T')[0];

                if (dates.has(dateStr)) {
                    streak++;
                } else if (i > 0) {
                    break;
                }
            }

            return streak;
        } catch (error) {
            console.error('Failed to calculate streak:', error);
            return 0;
        }
    }

    /**
     * Delete a meal
     */
    async deleteMeal(mealId: string): Promise<void> {
        try {
            const { deleteDoc, doc } = await import('firebase/firestore');
            await deleteDoc(doc(db, 'meals', mealId));
            console.log('Meal deleted:', mealId);
        } catch (error) {
            console.error('Failed to delete meal:', error);
            throw error;
        }
    }

    /**
     * Get all meals for week summary
     */
    async getMealsForWeek(userId: string): Promise<MealLog[]> {
        try {
            const mealsRef = collection(db, 'meals');
            const q = query(mealsRef, where('userId', '==', userId));
            const snapshot = await getDocs(q);

            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            const meals = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                }))
                .filter(meal => meal.createdAt >= weekAgo)
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            return meals as MealLog[];
        } catch (error) {
            console.error('Failed to get weekly meals:', error);
            return [];
        }
    }
}

export const mealService = new MealService();
export default mealService;
