/**
 * AuNouri - Nutrition Calculation Service
 * Calculates BMR, TDEE, and personalized calorie goals
 */

export type BiologicalSex = 'female' | 'male';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type WeightGoal = 'lose' | 'maintain' | 'gain';

export interface UserMetrics {
    age: number;
    heightCm: number;
    weightKg: number;
    biologicalSex: BiologicalSex;
    activityLevel: ActivityLevel;
    weightGoal: WeightGoal;
    targetWeightKg?: number;
}

// Activity level multipliers for TDEE calculation
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
    sedentary: 1.2,      // Little or no exercise
    light: 1.375,        // Light exercise 1-3 days/week
    moderate: 1.55,      // Moderate exercise 3-5 days/week
    active: 1.725,       // Hard exercise 6-7 days/week
    very_active: 1.9,    // Very hard exercise, physical job
};

// Calorie adjustments for weight goals (per day)
const GOAL_ADJUSTMENTS: Record<WeightGoal, number> = {
    lose: -500,     // ~0.5kg/week loss
    maintain: 0,
    gain: 300,      // ~0.3kg/week gain
};

class NutritionCalculator {
    /**
     * Calculate Basal Metabolic Rate using Mifflin-St Jeor equation
     * This is the most widely used and accurate BMR formula
     */
    calculateBMR(weight: number, height: number, age: number, sex: BiologicalSex): number {
        // Base calculation
        const base = (10 * weight) + (6.25 * height) - (5 * age);

        // Sex-specific adjustment
        if (sex === 'male') {
            return base + 5;
        } else {
            return base - 161;
        }
    }

    /**
     * Calculate Total Daily Energy Expenditure
     * TDEE = BMR × Activity Multiplier
     */
    calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
        return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
    }

    /**
     * Calculate personalized daily calorie goal
     * Based on TDEE adjusted for weight goals
     */
    calculateCalorieGoal(metrics: UserMetrics): number {
        const bmr = this.calculateBMR(
            metrics.weightKg,
            metrics.heightCm,
            metrics.age,
            metrics.biologicalSex
        );

        const tdee = this.calculateTDEE(bmr, metrics.activityLevel);
        const adjustment = GOAL_ADJUSTMENTS[metrics.weightGoal];

        // Don't go below 1200 cal for safety
        return Math.max(1200, Math.round(tdee + adjustment));
    }

    /**
     * Get macro recommendations based on goal
     * Returns percentages for protein, carbs, fat
     */
    getMacroSplit(goal: WeightGoal, isDiabetic?: boolean): { protein: number; carbs: number; fat: number } {
        if (isDiabetic) {
            return this.getDiabeticMacroSplit(goal);
        }

        switch (goal) {
            case 'lose':
                return { protein: 35, carbs: 35, fat: 30 }; // Higher protein for muscle retention
            case 'gain':
                return { protein: 25, carbs: 50, fat: 25 }; // Higher carbs for energy
            case 'maintain':
            default:
                return { protein: 30, carbs: 40, fat: 30 }; // Balanced
        }
    }

    /**
     * Get macro recommendations for diabetic users
     * Lower carb intake to help with blood sugar management
     */
    getDiabeticMacroSplit(goal: WeightGoal): { protein: number; carbs: number; fat: number } {
        switch (goal) {
            case 'lose':
                return { protein: 35, carbs: 30, fat: 35 }; // Lower carbs, higher fat for satiety
            case 'gain':
                return { protein: 30, carbs: 35, fat: 35 }; // Moderate carbs for energy
            case 'maintain':
            default:
                return { protein: 30, carbs: 35, fat: 35 }; // Balanced with lower carbs
        }
    }

    /**
     * Calculate macro targets in grams based on calorie goal
     */
    calculateMacroTargets(calorieGoal: number, goal: WeightGoal, isDiabetic?: boolean): {
        protein: number;
        carbs: number;
        fat: number;
    } {
        const split = this.getMacroSplit(goal, isDiabetic);

        return {
            protein: Math.round((calorieGoal * split.protein / 100) / 4), // 4 cal per gram
            carbs: Math.round((calorieGoal * split.carbs / 100) / 4),    // 4 cal per gram
            fat: Math.round((calorieGoal * split.fat / 100) / 9),        // 9 cal per gram
        };
    }

    /**
     * Estimate weeks to reach target weight
     */
    estimateWeeksToGoal(currentWeight: number, targetWeight: number, goal: WeightGoal): number {
        const difference = Math.abs(targetWeight - currentWeight);

        // Based on ~0.5kg/week loss or ~0.3kg/week gain
        const weeklyChange = goal === 'lose' ? 0.5 : 0.3;

        return Math.ceil(difference / weeklyChange);
    }

    /**
     * Get activity level description
     */
    getActivityDescription(level: ActivityLevel): string {
        switch (level) {
            case 'sedentary':
                return 'Little or no exercise, desk job';
            case 'light':
                return 'Light exercise 1-3 days/week';
            case 'moderate':
                return 'Moderate exercise 3-5 days/week';
            case 'active':
                return 'Hard exercise 6-7 days/week';
            case 'very_active':
                return 'Very intense exercise, physical job';
        }
    }
}

export const nutritionCalculator = new NutritionCalculator();
export default nutritionCalculator;
