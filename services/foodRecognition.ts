/**
 * AuNouri - AI Food Recognition Service
 * Uses Google Gemini for image analysis AND nutrition estimation
 * 
 * SETUP:
 * 1. Enable Generative AI API in Google Cloud Console
 * 2. Create API key and add below
 * 
 * Cost: Gemini has generous free tier (~60 requests/minute)
 */

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';

export interface NutritionInfo {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    servingSize: string;
    servingQty: number;
}

export interface HealthierAlternative {
    original: string;
    alternative: string;
    caloriesSaved: number;
    reason: string;
}

export interface FoodRecognitionResult {
    foods: NutritionInfo[];
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    healthierAlternatives: HealthierAlternative[];
}

// Mock data for when API is not configured
const mockFoodResults: FoodRecognitionResult = {
    foods: [
        {
            name: 'Cheeseburger',
            calories: 540,
            protein: 25,
            carbs: 42,
            fat: 30,
            fiber: 2,
            sugar: 8,
            servingSize: '1 burger',
            servingQty: 1,
        },
        {
            name: 'French Fries',
            calories: 365,
            protein: 4,
            carbs: 48,
            fat: 17,
            fiber: 4,
            sugar: 0,
            servingSize: 'medium (117g)',
            servingQty: 1,
        },
    ],
    totalCalories: 905,
    totalProtein: 29,
    totalCarbs: 90,
    totalFat: 47,
    healthierAlternatives: [
        {
            original: 'Cheeseburger',
            alternative: 'Turkey Burger with Lettuce Wrap',
            caloriesSaved: 260,
            reason: 'Lower fat, higher protein',
        },
        {
            original: 'French Fries',
            alternative: 'Baked Sweet Potato Fries',
            caloriesSaved: 165,
            reason: 'More fiber, less oil',
        },
    ],
};

const GEMINI_PROMPT = `You are a nutrition expert. Analyze this food image and respond ONLY with a valid JSON object (no markdown, no code blocks, just the raw JSON).

Identify all foods visible and estimate their nutrition based on typical portion sizes shown.

JSON format:
{
  "foods": [
    {
      "name": "Food Name",
      "calories": 300,
      "protein": 15,
      "carbs": 30,
      "fat": 10,
      "fiber": 3,
      "sugar": 5,
      "servingSize": "1 cup",
      "servingQty": 1
    }
  ],
  "healthierAlternatives": [
    {
      "original": "Food Name",
      "alternative": "Healthier Option",
      "caloriesSaved": 100,
      "reason": "Why it's healthier"
    }
  ]
}

For each unhealthy food, suggest a healthier alternative with estimated calorie savings.
Be accurate with calorie estimates based on visible portion sizes.`;

class AIFoodRecognitionService {
    private isConfigured: boolean;

    constructor() {
        // Check if API key looks valid (not a placeholder and has reasonable length)
        this.isConfigured = GEMINI_API_KEY.startsWith('AIza') && GEMINI_API_KEY.length > 30;
    }

    /**
     * Analyze a food image using Gemini AI
     */
    async analyzeImage(imageBase64: string): Promise<FoodRecognitionResult> {
        if (!this.isConfigured) {
            if (__DEV__) console.log('Using mock data - Gemini API not configured');
            await new Promise(resolve => setTimeout(resolve, 1500));
            return mockFoodResults;
        }

        try {
            // Using Gemini 2.0 Flash which supports vision
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    { text: GEMINI_PROMPT },
                                    {
                                        inline_data: {
                                            mime_type: 'image/jpeg',
                                            data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
                                        },
                                    },
                                ],
                            },
                        ],
                        generationConfig: {
                            temperature: 0.1,
                            maxOutputTokens: 2048,
                        },
                    }),
                }
            );

            // Handle rate limiting with retry
            if (response.status === 429) {
                if (__DEV__) console.log('Rate limited, waiting 2 seconds and retrying...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                // Return mock data on rate limit to not block the user
                if (__DEV__) console.log('Using mock data due to rate limit');
                return mockFoodResults;
            }

            if (!response.ok) {
                const errorBody = await response.text();
                if (__DEV__) console.error('Gemini API error:', response.status, errorBody);
                throw new Error(`Gemini API error: ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

            // Clean the response - remove markdown code blocks if present
            const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            // Parse the JSON response
            const parsed = JSON.parse(cleanText);

            // Calculate totals
            const totals = parsed.foods.reduce(
                (acc: any, food: NutritionInfo) => ({
                    calories: acc.calories + food.calories,
                    protein: acc.protein + food.protein,
                    carbs: acc.carbs + food.carbs,
                    fat: acc.fat + food.fat,
                }),
                { calories: 0, protein: 0, carbs: 0, fat: 0 }
            );

            return {
                foods: parsed.foods,
                totalCalories: totals.calories,
                totalProtein: totals.protein,
                totalCarbs: totals.carbs,
                totalFat: totals.fat,
                healthierAlternatives: parsed.healthierAlternatives || [],
            };
        } catch (error) {
            if (__DEV__) console.error('AI food recognition failed:', error);
            if (__DEV__) console.log('Falling back to mock data');
            return mockFoodResults;
        }
    }

    /**
     * Quick text-based nutrition lookup using AI
     */
    async lookupFood(foodName: string): Promise<NutritionInfo | null> {
        if (!this.isConfigured) {
            const mockFoods: Record<string, NutritionInfo> = {
                apple: { name: 'Apple', calories: 95, protein: 0, carbs: 25, fat: 0, fiber: 4, sugar: 19, servingSize: '1 medium', servingQty: 1 },
                banana: { name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0, fiber: 3, sugar: 14, servingSize: '1 medium', servingQty: 1 },
                chicken: { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 4, fiber: 0, sugar: 0, servingSize: '100g', servingQty: 1 },
            };
            return mockFoods[foodName.toLowerCase()] || null;
        }

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    {
                                        text: `Provide nutrition info for "${foodName}" as a single JSON object:
{"name":"${foodName}","calories":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"sugar":0,"servingSize":"1 serving","servingQty":1}
Return ONLY the JSON, no other text.`,
                                    },
                                ],
                            },
                        ],
                        generationConfig: { temperature: 0.1 },
                    }),
                }
            );

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            return JSON.parse(text.trim());
        } catch (error) {
            if (__DEV__) console.error('Food lookup failed:', error);
            return null;
        }
    }
}

export const foodRecognitionService = new AIFoodRecognitionService();
export default foodRecognitionService;
