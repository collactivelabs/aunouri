/**
 * AuNouri - Recipe Database
 * Curated recipes with dietary and health tags for the hybrid AI approach
 */

import { Meal } from './anthropicService';

export interface RecipeFilter {
    dietaryPreferences?: string[];
    excludeAllergens?: string[];
    diabeticFriendly?: boolean;
    cyclePhase?: string;
    mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    maxCalories?: number;
}

// Curated vegan, diabetic-friendly recipes
const RECIPE_DATABASE: Meal[] = [
    // BREAKFAST OPTIONS
    {
        id: 'vegan_tofu_scramble',
        name: 'Turmeric Tofu Scramble',
        description: 'Protein-packed vegan scramble with turmeric and vegetables',
        ingredients: [
            { name: 'firm tofu', amount: '200', unit: 'g', category: 'protein' },
            { name: 'turmeric', amount: '1', unit: 'tsp', category: 'pantry' },
            { name: 'spinach', amount: '1', unit: 'cup', category: 'produce' },
            { name: 'cherry tomatoes', amount: '0.5', unit: 'cup', category: 'produce' },
            { name: 'olive oil', amount: '1', unit: 'tbsp', category: 'pantry' },
            { name: 'nutritional yeast', amount: '2', unit: 'tbsp', category: 'pantry' },
        ],
        macros: { calories: 280, protein: 22, carbs: 12, fat: 18 },
        tags: ['vegan', 'high-protein', 'gluten-free', 'dairy-free', 'iron-rich'],
        diabeticFriendly: true,
    },
    {
        id: 'chia_pudding',
        name: 'Vanilla Chia Pudding',
        description: 'Creamy overnight chia pudding with fresh berries',
        ingredients: [
            { name: 'chia seeds', amount: '3', unit: 'tbsp', category: 'pantry' },
            { name: 'almond milk', amount: '1', unit: 'cup', category: 'dairy' },
            { name: 'vanilla extract', amount: '0.5', unit: 'tsp', category: 'pantry' },
            { name: 'mixed berries', amount: '0.5', unit: 'cup', category: 'produce' },
        ],
        macros: { calories: 220, protein: 8, carbs: 22, fat: 12 },
        tags: ['vegan', 'gluten-free', 'dairy-free', 'omega-3', 'fiber-rich'],
        diabeticFriendly: true,
    },
    {
        id: 'green_smoothie_bowl',
        name: 'Energizing Green Smoothie Bowl',
        description: 'Nutrient-dense smoothie bowl with spinach and plant protein',
        ingredients: [
            { name: 'spinach', amount: '2', unit: 'cups', category: 'produce' },
            { name: 'frozen banana', amount: '0.5', unit: 'piece', category: 'frozen' },
            { name: 'plant protein powder', amount: '1', unit: 'scoop', category: 'pantry' },
            { name: 'almond butter', amount: '1', unit: 'tbsp', category: 'pantry' },
            { name: 'hemp seeds', amount: '1', unit: 'tbsp', category: 'pantry' },
        ],
        macros: { calories: 320, protein: 28, carbs: 28, fat: 14 },
        tags: ['vegan', 'high-protein', 'gluten-free', 'dairy-free', 'iron-rich'],
        diabeticFriendly: false, // banana can spike blood sugar
    },

    // LUNCH OPTIONS
    {
        id: 'mediterranean_quinoa_bowl',
        name: 'Mediterranean Quinoa Bowl',
        description: 'Hearty quinoa bowl with chickpeas, cucumber, and tahini dressing',
        ingredients: [
            { name: 'quinoa', amount: '0.75', unit: 'cup', category: 'grains' },
            { name: 'chickpeas', amount: '0.5', unit: 'cup', category: 'protein' },
            { name: 'cucumber', amount: '0.5', unit: 'cup', category: 'produce' },
            { name: 'cherry tomatoes', amount: '0.5', unit: 'cup', category: 'produce' },
            { name: 'tahini', amount: '2', unit: 'tbsp', category: 'pantry' },
            { name: 'lemon juice', amount: '1', unit: 'tbsp', category: 'produce' },
        ],
        macros: { calories: 420, protein: 18, carbs: 48, fat: 18 },
        tags: ['vegan', 'gluten-free', 'dairy-free', 'high-fiber', 'mediterranean'],
        diabeticFriendly: true,
    },
    {
        id: 'lentil_soup',
        name: 'Hearty Red Lentil Soup',
        description: 'Warming lentil soup with cumin and fresh herbs',
        ingredients: [
            { name: 'red lentils', amount: '1', unit: 'cup', category: 'protein' },
            { name: 'vegetable broth', amount: '3', unit: 'cups', category: 'pantry' },
            { name: 'carrots', amount: '2', unit: 'medium', category: 'produce' },
            { name: 'onion', amount: '1', unit: 'medium', category: 'produce' },
            { name: 'cumin', amount: '1', unit: 'tsp', category: 'pantry' },
            { name: 'fresh cilantro', amount: '2', unit: 'tbsp', category: 'produce' },
        ],
        macros: { calories: 350, protein: 22, carbs: 52, fat: 4 },
        tags: ['vegan', 'gluten-free', 'dairy-free', 'high-protein', 'iron-rich', 'anti-inflammatory'],
        diabeticFriendly: true,
    },
    {
        id: 'asian_salad',
        name: 'Crunchy Asian Edamame Salad',
        description: 'Fresh salad with edamame, cabbage, and ginger dressing',
        ingredients: [
            { name: 'edamame', amount: '1', unit: 'cup', category: 'protein' },
            { name: 'red cabbage', amount: '2', unit: 'cups', category: 'produce' },
            { name: 'carrots', amount: '1', unit: 'medium', category: 'produce' },
            { name: 'sesame seeds', amount: '1', unit: 'tbsp', category: 'pantry' },
            { name: 'ginger', amount: '1', unit: 'tsp', category: 'produce' },
            { name: 'rice vinegar', amount: '2', unit: 'tbsp', category: 'pantry' },
        ],
        macros: { calories: 280, protein: 18, carbs: 24, fat: 12 },
        tags: ['vegan', 'gluten-free', 'dairy-free', 'high-protein', 'low-carb'],
        diabeticFriendly: true,
    },

    // DINNER OPTIONS
    {
        id: 'vegan_stir_fry',
        name: 'Tempeh Vegetable Stir-Fry',
        description: 'Savory tempeh stir-fry with seasonal vegetables and tamari',
        ingredients: [
            { name: 'tempeh', amount: '200', unit: 'g', category: 'protein' },
            { name: 'broccoli', amount: '2', unit: 'cups', category: 'produce' },
            { name: 'bell peppers', amount: '1', unit: 'medium', category: 'produce' },
            { name: 'snap peas', amount: '1', unit: 'cup', category: 'produce' },
            { name: 'tamari', amount: '2', unit: 'tbsp', category: 'pantry' },
            { name: 'sesame oil', amount: '1', unit: 'tbsp', category: 'pantry' },
        ],
        macros: { calories: 380, protein: 28, carbs: 22, fat: 22 },
        tags: ['vegan', 'gluten-free', 'dairy-free', 'high-protein', 'low-carb'],
        diabeticFriendly: true,
    },
    {
        id: 'cauliflower_curry',
        name: 'Coconut Cauliflower Curry',
        description: 'Creamy coconut curry with cauliflower and chickpeas',
        ingredients: [
            { name: 'cauliflower', amount: '3', unit: 'cups', category: 'produce' },
            { name: 'chickpeas', amount: '1', unit: 'cup', category: 'protein' },
            { name: 'coconut milk', amount: '1', unit: 'cup', category: 'pantry' },
            { name: 'curry powder', amount: '2', unit: 'tbsp', category: 'pantry' },
            { name: 'spinach', amount: '2', unit: 'cups', category: 'produce' },
            { name: 'brown rice', amount: '0.5', unit: 'cup', category: 'grains' },
        ],
        macros: { calories: 450, protein: 18, carbs: 42, fat: 26 },
        tags: ['vegan', 'gluten-free', 'dairy-free', 'anti-inflammatory', 'iron-rich'],
        diabeticFriendly: true,
    },
    {
        id: 'stuffed_peppers',
        name: 'Quinoa Stuffed Bell Peppers',
        description: 'Colorful bell peppers stuffed with quinoa and black beans',
        ingredients: [
            { name: 'bell peppers', amount: '3', unit: 'large', category: 'produce' },
            { name: 'quinoa', amount: '1', unit: 'cup', category: 'grains' },
            { name: 'black beans', amount: '1', unit: 'cup', category: 'protein' },
            { name: 'corn', amount: '0.5', unit: 'cup', category: 'produce' },
            { name: 'salsa', amount: '0.5', unit: 'cup', category: 'pantry' },
            { name: 'cumin', amount: '1', unit: 'tsp', category: 'pantry' },
        ],
        macros: { calories: 400, protein: 20, carbs: 62, fat: 8 },
        tags: ['vegan', 'gluten-free', 'dairy-free', 'high-fiber', 'mexican'],
        diabeticFriendly: false, // higher carb
    },

    // SNACK OPTIONS
    {
        id: 'hummus_veggies',
        name: 'Hummus with Fresh Veggies',
        description: 'Creamy hummus with cucumber, carrots, and bell pepper sticks',
        ingredients: [
            { name: 'hummus', amount: '4', unit: 'tbsp', category: 'protein' },
            { name: 'cucumber', amount: '1', unit: 'medium', category: 'produce' },
            { name: 'carrots', amount: '2', unit: 'medium', category: 'produce' },
            { name: 'bell pepper', amount: '0.5', unit: 'medium', category: 'produce' },
        ],
        macros: { calories: 180, protein: 8, carbs: 18, fat: 10 },
        tags: ['vegan', 'gluten-free', 'dairy-free', 'low-carb'],
        diabeticFriendly: true,
    },
    {
        id: 'trail_mix',
        name: 'Energy Trail Mix',
        description: 'Protein-rich mix of nuts, seeds, and dark chocolate',
        ingredients: [
            { name: 'almonds', amount: '0.25', unit: 'cup', category: 'protein' },
            { name: 'walnuts', amount: '0.25', unit: 'cup', category: 'protein' },
            { name: 'pumpkin seeds', amount: '2', unit: 'tbsp', category: 'protein' },
            { name: 'dark chocolate chips', amount: '1', unit: 'tbsp', category: 'pantry' },
        ],
        macros: { calories: 250, protein: 10, carbs: 12, fat: 20 },
        tags: ['vegan', 'gluten-free', 'dairy-free', 'magnesium-rich', 'omega-3'],
        diabeticFriendly: true,
    },
    {
        id: 'avocado_toast',
        name: 'Seedy Avocado Toast',
        description: 'Whole grain toast with mashed avocado and hemp seeds',
        ingredients: [
            { name: 'whole grain bread', amount: '1', unit: 'slice', category: 'grains' },
            { name: 'avocado', amount: '0.5', unit: 'medium', category: 'produce' },
            { name: 'hemp seeds', amount: '1', unit: 'tbsp', category: 'pantry' },
            { name: 'lemon juice', amount: '0.5', unit: 'tsp', category: 'produce' },
            { name: 'red pepper flakes', amount: '0.25', unit: 'tsp', category: 'pantry' },
        ],
        macros: { calories: 220, protein: 8, carbs: 18, fat: 16 },
        tags: ['vegan', 'dairy-free', 'fiber-rich', 'omega-3'],
        diabeticFriendly: true,
    },
    {
        id: 'protein_balls',
        name: 'No-Bake Protein Balls',
        description: 'Energy bites with oats, peanut butter, and chia seeds',
        ingredients: [
            { name: 'rolled oats', amount: '1', unit: 'cup', category: 'grains' },
            { name: 'peanut butter', amount: '0.5', unit: 'cup', category: 'protein' },
            { name: 'chia seeds', amount: '2', unit: 'tbsp', category: 'pantry' },
            { name: 'maple syrup', amount: '2', unit: 'tbsp', category: 'pantry' },
        ],
        macros: { calories: 180, protein: 7, carbs: 20, fat: 9 },
        tags: ['vegan', 'dairy-free', 'high-fiber', 'meal-prep-friendly'],
        diabeticFriendly: false, // contains maple syrup
    },
];

class RecipeDatabase {
    /**
     * Get all recipes matching the given filters
     */
    getRecipes(filter: RecipeFilter = {}): Meal[] {
        let recipes = [...RECIPE_DATABASE];

        // Filter by dietary preferences
        if (filter.dietaryPreferences && filter.dietaryPreferences.length > 0) {
            recipes = recipes.filter(recipe =>
                filter.dietaryPreferences!.every(pref =>
                    recipe.tags.includes(pref)
                )
            );
        }

        // Exclude allergens
        if (filter.excludeAllergens && filter.excludeAllergens.length > 0) {
            recipes = recipes.filter(recipe =>
                !filter.excludeAllergens!.some(allergen =>
                    recipe.ingredients.some(ing =>
                        ing.name.toLowerCase().includes(allergen.toLowerCase())
                    )
                )
            );
        }

        // Filter by diabetic-friendly
        if (filter.diabeticFriendly) {
            recipes = recipes.filter(r => r.diabeticFriendly === true);
        }

        // Filter by cycle phase nutrients
        if (filter.cyclePhase) {
            const phaseNutrients: Record<string, string[]> = {
                menstrual: ['iron-rich', 'magnesium-rich', 'anti-inflammatory'],
                follicular: ['high-protein', 'fiber-rich'],
                ovulatory: ['antioxidant', 'high-protein'],
                luteal: ['magnesium-rich', 'complex-carb'],
            };

            const preferredTags = phaseNutrients[filter.cyclePhase] || [];
            if (preferredTags.length > 0) {
                // Sort by how many preferred tags they have
                recipes.sort((a, b) => {
                    const aScore = preferredTags.filter(t => a.tags.includes(t)).length;
                    const bScore = preferredTags.filter(t => b.tags.includes(t)).length;
                    return bScore - aScore;
                });
            }
        }

        // Filter by max calories
        if (filter.maxCalories) {
            recipes = recipes.filter(r => r.macros.calories <= filter.maxCalories!);
        }

        return recipes;
    }

    /**
     * Get a random recipe matching filters
     */
    getRandomRecipe(filter: RecipeFilter): Meal | null {
        const recipes = this.getRecipes(filter);
        if (recipes.length === 0) return null;
        return recipes[Math.floor(Math.random() * recipes.length)];
    }

    /**
     * Get recipe by ID
     */
    getRecipeById(id: string): Meal | null {
        return RECIPE_DATABASE.find(r => r.id === id) || null;
    }

    /**
     * Get recipes optimized for a specific cycle phase and user
     */
    getPhaseOptimizedRecipes(
        phase: string,
        dietaryPrefs: string[],
        isDiabetic: boolean
    ): { breakfast: Meal[]; lunch: Meal[]; dinner: Meal[]; snacks: Meal[] } {
        const baseFilter: RecipeFilter = {
            dietaryPreferences: dietaryPrefs,
            diabeticFriendly: isDiabetic ? true : undefined,
            cyclePhase: phase,
        };

        // For now, categorize by calorie range as a proxy for meal type
        const allRecipes = this.getRecipes(baseFilter);

        return {
            breakfast: allRecipes.filter(r => r.macros.calories >= 200 && r.macros.calories <= 350),
            lunch: allRecipes.filter(r => r.macros.calories >= 300 && r.macros.calories <= 500),
            dinner: allRecipes.filter(r => r.macros.calories >= 350 && r.macros.calories <= 500),
            snacks: allRecipes.filter(r => r.macros.calories <= 280),
        };
    }
}

export const recipeDatabase = new RecipeDatabase();
export default recipeDatabase;
