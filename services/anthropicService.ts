/**
 * AuNouri - Anthropic Claude Service
 * AI integration for personalized meal plan generation
 */

// API Key - same pattern as Gemini in foodRecognition.ts
const ANTHROPIC_API_KEY = 'REDACTED_ANTHROPIC_KEY';

// Types for Claude API
interface ClaudeResponse {
    id: string;
    content: Array<{
        type: 'text';
        text: string;
    }>;
    model: string;
    stop_reason: string;
}

// Meal plan types
export interface Ingredient {
    name: string;
    amount: string;
    unit: string;
    category: 'produce' | 'protein' | 'dairy' | 'grains' | 'pantry' | 'frozen' | 'other';
}

export interface Meal {
    id: string;
    name: string;
    description: string;
    ingredients: Ingredient[];
    instructions?: string[];
    prepTime?: number;
    macros: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
    tags: string[];
    diabeticFriendly: boolean;
}

export interface ExerciseSuggestion {
    name: string;
    duration: number;
    intensity: 'low' | 'medium' | 'high';
    description: string;
    caloriesBurned?: number;
}

export interface DayPlan {
    date: string;
    dayOfWeek: string;
    cyclePhase?: string;
    meals: {
        breakfast: Meal;
        lunch: Meal;
        dinner: Meal;
        snacks: Meal[];
    };
    exercise: ExerciseSuggestion;
    totals: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
}

export interface MealPlanResponse {
    days: DayPlan[];
    shoppingList: Ingredient[];
    summary: string;
}

export interface UserContext {
    calorieGoal: number;
    proteinGoal: number;
    carbsGoal: number;
    fatGoal: number;
    dietaryPreferences: string[];
    allergies: string[];
    isDiabetic: boolean;
    diabetesType?: string;
    cyclePhase?: string;
    dayOfCycle?: number;
    weightGoal: string;
    activityLevel: string;
    waterGoal?: number; // ml per day
}

// API Configuration
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-5-20250929'; // Claude 4.5 Sonnet - larger output capacity
const MAX_TOKENS = 16384; // Sonnet supports much larger outputs

class AnthropicService {
    private isApiConfiguredFlag: boolean;

    constructor() {
        this.isApiConfiguredFlag = ANTHROPIC_API_KEY.startsWith('sk-ant-') && ANTHROPIC_API_KEY.length > 30;
    }

    isConfigured(): boolean {
        return this.isApiConfiguredFlag;
    }

    /**
     * Build the meal plan prompt based on user context
     */
    private buildMealPlanPrompt(context: UserContext): string {
        const phaseFocus: Record<string, string> = {
            menstrual: 'Focus on iron-rich foods, magnesium, anti-inflammatory ingredients.',
            follicular: 'Higher protein for muscle building, fresh vegetables, energizing foods.',
            ovulatory: 'Antioxidant-rich foods, fiber, healthy fats.',
            luteal: 'Complex carbs (if not diabetic), magnesium-rich foods, calming nutrients.',
        };

        const currentFocus = context.cyclePhase ? phaseFocus[context.cyclePhase] || '' : '';

        return `You are a certified nutritionist creating a personalized 7-day meal plan.

USER PROFILE:
- Daily calorie target: ${context.calorieGoal} calories
- Macro targets: Protein ${context.proteinGoal}g, Carbs ${context.carbsGoal}g, Fat ${context.fatGoal}g
- Dietary preferences: ${context.dietaryPreferences.length > 0 ? context.dietaryPreferences.join(', ') : 'None'}
- Food allergies: ${context.allergies.length > 0 ? context.allergies.join(', ') : 'None'}
- Diabetic: ${context.isDiabetic ? `Yes (${context.diabetesType || 'Type 2'})` : 'No'}
- Weight goal: ${context.weightGoal}
- Water goal: ${context.waterGoal ? `${context.waterGoal}ml` : '2000ml'}
${context.cyclePhase ? `- Current cycle phase: ${context.cyclePhase}` : ''}

${currentFocus ? `PHASE GUIDANCE: ${currentFocus}` : ''}

REQUIREMENTS:
1. Create a 7-day meal plan
2. Each day: breakfast, lunch, dinner, and 2 snacks
3. Daily totals within 10% of calorie target
4. ${context.isDiabetic ? 'All meals must be diabetic-friendly (low glycemic)' : ''}
5. ${context.dietaryPreferences.includes('vegan') ? 'All meals must be 100% vegan' : ''}
6. Include one exercise suggestion per day
7. SHOPPING LIST: Use store-friendly units (grams, kg, pieces, bunches, cans, packages). Aggregate similar items (e.g., combine "firm tofu" and "extra-firm tofu" as "tofu"). Round to practical amounts.

Return ONLY valid JSON (no markdown):
{"days":[{"date":"Day 1","dayOfWeek":"Monday","meals":{"breakfast":{"id":"b1","name":"Meal","description":"Desc","ingredients":[{"name":"item","amount":"100","unit":"g","category":"produce"}],"macros":{"calories":300,"protein":15,"carbs":30,"fat":10},"tags":["vegan"],"diabeticFriendly":true},"lunch":{...},"dinner":{...},"snacks":[{...},{...}]},"exercise":{"name":"Exercise","duration":30,"intensity":"medium","description":"Desc","caloriesBurned":200},"totals":{"calories":1400,"protein":100,"carbs":120,"fat":50}}],"shoppingList":[{"name":"tofu","amount":"800","unit":"g","category":"protein"}],"summary":"Summary"}`;
    }

    /**
     * Generate a single week's meal plan
     */
    private async generateWeekPlan(context: UserContext, weekNumber: number = 1): Promise<MealPlanResponse> {
        const prompt = this.buildMealPlanPrompt(context);

        console.log('[Anthropic] Generating week', weekNumber, 'meal plan');

        const response = await fetch(ANTHROPIC_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: MODEL,
                max_tokens: MAX_TOKENS,
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('[Anthropic] API error:', error);
            throw new Error(`Claude API error: ${response.status}`);
        }

        const data: ClaudeResponse = await response.json();
        const textContent = data.content.find(c => c.type === 'text');

        if (!textContent) {
            throw new Error('No text response from Claude');
        }

        console.log('[Anthropic] Raw response length:', textContent.text.length);
        //console.log('[Anthropic] Raw response:', textContent.text);

        // Parse the JSON response - try to find complete JSON object
        const text = textContent.text.trim();

        // Try to parse the entire response first
        try {
            const mealPlan: MealPlanResponse = JSON.parse(text);
            console.log('[Anthropic] Generated week with', mealPlan.days?.length || 0, 'days');
            return mealPlan;
        } catch {
            // Try to extract JSON from the response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error('[Anthropic] Could not find JSON in response');
                throw new Error('Could not parse JSON from Claude response');
            }

            const mealPlan: MealPlanResponse = JSON.parse(jsonMatch[0]);
            console.log('[Anthropic] Generated week with', mealPlan.days?.length || 0, 'days');
            return mealPlan;
        }
    }

    /**
     * Call Claude API to generate meal plan (handles multi-week plans)
     */
    async generateMealPlan(context: UserContext, duration: number = 7): Promise<MealPlanResponse> {
        if (!this.isApiConfiguredFlag) {
            throw new Error('Anthropic API key not configured');
        }

        console.log('[Anthropic] Generating meal plan for', duration, 'days');

        try {
            // For plans longer than 7 days, generate in weekly chunks
            if (duration <= 7) {
                return await this.generateWeekPlan(context, 1);
            }

            // Generate multiple weeks
            const weeks = Math.ceil(duration / 7);
            const allDays: DayPlan[] = [];
            const allIngredients: Ingredient[] = [];

            for (let week = 1; week <= weeks; week++) {
                console.log(`[Anthropic] Generating week ${week} of ${weeks}...`);
                const weekPlan = await this.generateWeekPlan(context, week);

                const offsetDays = weekPlan.days.map((day, index) => ({
                    ...day,
                    date: `Day ${(week - 1) * 7 + index + 1}`,
                }));

                allDays.push(...offsetDays);
                allIngredients.push(...(weekPlan.shoppingList || []));

                if (week < weeks) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            // Deduplicate shopping list
            const uniqueIngredients = allIngredients.reduce((acc, ing) => {
                const existing = acc.find(i => i.name.toLowerCase() === ing.name.toLowerCase());
                if (existing) {
                    existing.amount = `${parseFloat(existing.amount) + parseFloat(ing.amount)}`;
                } else {
                    acc.push({ ...ing });
                }
                return acc;
            }, [] as Ingredient[]);

            return {
                days: allDays.slice(0, duration),
                shoppingList: uniqueIngredients,
                summary: `${duration}-day personalized meal plan`,
            };
        } catch (error) {
            console.error('[Anthropic] Failed to generate meal plan:', error);
            throw error;
        }
    }
}

export const anthropicService = new AnthropicService();
export default anthropicService;
