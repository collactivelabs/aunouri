/**
 * AuNouri - Tracking Service
 * Handles logging of meals, water, and exercise, and comparison logic.
 */

import { addDoc, collection, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { ExerciseSuggestion, Meal } from './anthropicService';
import { db } from './firebase';
import { NutritionInfo } from './foodRecognition';

export interface MealLog {
    id: string;
    userId: string;
    date: Date;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    plannedMeal?: Meal;
    actualMeal: NutritionInfo;
    matchScore: number; // 0-100
    feedback: string;
}

export interface WaterLog {
    id: string;
    userId: string;
    date: Date;
    amount: number; // ml
    timestamp: Date;
}

export interface ExerciseLog {
    id: string;
    userId: string;
    date: Date;
    plannedExercise?: ExerciseSuggestion;
    completed: boolean;
    actualDuration?: number;
    notes?: string;
}

export interface DayProgress {
    caloriesConsumed: number;
    proteinConsumed: number;
    carbsConsumed: number;
    fatConsumed: number;
    waterConsumed: number; // ml
    exerciseCompleted: boolean;
    mealsLogged: number;
}

class TrackingService {
    /**
     * Compare a scanned meal to a planned meal and generate a match score
     */
    compareMealToPlan(actual: NutritionInfo, planned?: Meal): { score: number; feedback: string } {
        if (!planned) {
            return {
                score: 100,
                feedback: 'Meal logged (no plan for this slot).',
            };
        }

        let score = 100;
        const feedbackParts: string[] = [];

        // 1. Check Keywords/Ingredients (simplified for now)
        // In a real app, we'd use embedding similarity or mapped ingredients
        const actualName = actual.name.toLowerCase();
        const plannedName = planned.name.toLowerCase();
        const plannedIngredients = planned.ingredients.map(i => i.name.toLowerCase()).join(' ');

        const nameMatch = actualName.split(' ').some(word => plannedName.includes(word) || plannedIngredients.includes(word));

        if (nameMatch) {
            feedbackParts.push(`Matches planned meal "${planned.name}"!`);
        } else {
            score -= 20;
            feedbackParts.push(`Different from plan ("${planned.name}"), but let's check nutrition.`);
        }

        // 2. Calories Comparison (±15% tolerance)
        const calDiff = Math.abs(actual.calories - planned.macros.calories);
        const calTolerance = planned.macros.calories * 0.15;

        if (calDiff <= calTolerance) {
            feedbackParts.push('Calories are spot on.');
        } else if (actual.calories > planned.macros.calories) {
            score -= 10;
            feedbackParts.push(`Higher calories than planned (+${Math.round(calDiff)}).`);
        } else {
            // Undereating is also noted, but maybe less penalty if goal is weight loss? 
            // For now, treat significant deviation as penalty.
            score -= 5;
            feedbackParts.push('Lower calories than planned.');
        }

        // 3. Protein Goal (important for our users)
        const proteinDiff = actual.protein - planned.macros.protein;
        if (proteinDiff >= -5) { // Within 5g or higher is good
            feedbackParts.push('Great protein content!');
        } else {
            score -= 10;
            feedbackParts.push(`Low on protein (${Math.round(actual.protein)}g vs ${planned.macros.protein}g).`);
        }

        // 4. Diabetic Friendly (if planned was marked as such)
        if (planned.diabeticFriendly) {
            // Simple heuristic: ratio of sugar to fiber/protein
            // This is a rough approximation without full incomplete nutritional data
            const sugar = actual.sugar || 0;
            const fiber = actual.fiber || 0;

            if (sugar > 15 && fiber < 3) {
                score -= 20;
                feedbackParts.push('Warning: High sugar/low fiber might cause glucose spikes.');
            } else {
                feedbackParts.push('Diabetic-friendly profile maintained.');
            }
        }

        return {
            score: Math.max(0, score),
            feedback: feedbackParts.join(' '),
        };
    }

    /**
     * Log a consumed meal
     */
    async logMeal(userId: string, mealType: string, scanned: NutritionInfo, planned?: Meal): Promise<MealLog> {
        try {
            const { score, feedback } = this.compareMealToPlan(scanned, planned);

            const mealLog: Omit<MealLog, 'id'> = {
                userId,
                date: new Date(),
                mealType: mealType as any,
                plannedMeal: planned,
                actualMeal: scanned,
                matchScore: score,
                feedback,
            };

            const docRef = await addDoc(collection(db, 'mealLogs'), mealLog);
            console.log('Successfully logged to mealLogs with ID:', docRef.id);

            // Also log to the main 'meals' collection so it shows up in the dashboard/history
            try {
                // Use top-level import if possible, but for now wrap in try-catch with logging
                const { mealService } = require('./meals');
                console.log('Attempting to dual-log to meals collection for user:', userId);
                const mainDocId = await mealService.logMeal(
                    userId,
                    [scanned], // Pass as array of foods
                    mealType, // Use specific type
                    undefined,
                    planned,
                    score,
                    feedback
                );
                console.log('Successfully dual-logged to meals with ID:', mainDocId);
            } catch (innerError) {
                console.error('CRITICAL: Failed to dual-log to meals collection:', innerError);
                // Do not throw here, so we at least pass the primary log
            }

            return { ...mealLog, id: docRef.id };
        } catch (error) {
            console.error('Failed to log meal:', error);
            throw error;
        }
    }

    /**
     * Log water intake
     */
    async logWater(userId: string, amount: number): Promise<WaterLog> {
        try {
            const log: Omit<WaterLog, 'id'> = {
                userId,
                date: new Date(),
                amount,
                timestamp: new Date(),
            };

            const docRef = await addDoc(collection(db, 'waterLogs'), log);
            return { ...log, id: docRef.id };
        } catch (error) {
            console.error('Failed to log water:', error);
            throw error;
        }
    }

    /**
     * Log exercise completion
     */
    async logExercise(userId: string, planned: ExerciseSuggestion, completed: boolean, notes?: string): Promise<ExerciseLog> {
        try {
            const log: Omit<ExerciseLog, 'id'> = {
                userId,
                date: new Date(),
                plannedExercise: planned,
                completed,
                ...(notes ? { notes } : {}),
            };

            const docRef = await addDoc(collection(db, 'exerciseLogs'), log);
            return { ...log, id: docRef.id };
        } catch (error) {
            console.error('Failed to log exercise:', error);
            throw error;
        }
    }

    /**
     * Get aggregated daily progress
     */
    async getDailyProgress(userId: string, date: Date = new Date()): Promise<DayProgress> {
        try {
            // Start/End of day
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);

            const startTs = Timestamp.fromDate(start);
            const endTs = Timestamp.fromDate(end);

            // Fetch meal logs
            const mealsQuery = query(
                collection(db, 'mealLogs'),
                where('userId', '==', userId),
                where('date', '>=', startTs),
                where('date', '<=', endTs)
            );
            const mealDocs = await getDocs(mealsQuery);

            // Fetch water logs
            const waterQuery = query(
                collection(db, 'waterLogs'),
                where('userId', '==', userId),
                where('date', '>=', startTs),
                where('date', '<=', endTs)
            );
            const waterDocs = await getDocs(waterQuery);

            // Fetch exercise logs
            const exerciseQuery = query(
                collection(db, 'exerciseLogs'),
                where('userId', '==', userId),
                where('date', '>=', startTs),
                where('date', '<=', endTs)
            );
            const exerciseDocs = await getDocs(exerciseQuery);

            // Aggregate
            let progress: DayProgress = {
                caloriesConsumed: 0,
                proteinConsumed: 0,
                carbsConsumed: 0,
                fatConsumed: 0,
                waterConsumed: 0,
                exerciseCompleted: !exerciseDocs.empty, // simplified
                mealsLogged: mealDocs.size,
            };

            mealDocs.forEach(doc => {
                const data = doc.data() as MealLog;
                progress.caloriesConsumed += data.actualMeal.calories;
                progress.proteinConsumed += data.actualMeal.protein;
                progress.carbsConsumed += data.actualMeal.carbs;
                progress.fatConsumed += data.actualMeal.fat;
            });

            waterDocs.forEach(doc => {
                const data = doc.data() as WaterLog;
                progress.waterConsumed += data.amount;
            });

            return progress;

        } catch (error) {
            console.error('Failed to get daily progress:', error);
            return {
                caloriesConsumed: 0,
                proteinConsumed: 0,
                carbsConsumed: 0,
                fatConsumed: 0,
                waterConsumed: 0,
                exerciseCompleted: false,
                mealsLogged: 0,
            };
        }
    }
}

export const trackingService = new TrackingService();
export default trackingService;
