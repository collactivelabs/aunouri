/**
 * AuNouri - Services Index
 * Central export for all app services
 */

// Firebase
export { auth, db, storage } from './firebase';

// Food Recognition
export { foodRecognitionService } from './foodRecognition';
export type { FoodRecognitionResult, HealthierAlternative, NutritionInfo } from './foodRecognition';

// Meal Tracking  
export { mealService } from './meals';
export type { DailyNutrition, MealLog } from './meals';

// Cycle Tracking
export { cycleService } from './cycle';
export type { CycleInfo, CyclePhase, CycleSettings, PeriodLog } from './cycle';

// Health Integrations
export { healthService } from './health';
export type { HealthProvider, UnifiedHealthData } from './health';

// Social/Friends
export { friendsService } from './friends';
export type { Encouragement, Friend, FriendRequest } from './friends';

