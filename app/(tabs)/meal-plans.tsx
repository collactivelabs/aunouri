/**
 * AuNouri - Meal Plans Screen
 * AI-powered personalized meal and exercise planning
 */

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { borderRadius, spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { Meal } from '@/services/anthropicService';
import { FavoriteMeal, mealPlanService, StoredMealPlan } from '@/services/mealPlanService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,

    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Duration = '1week' | '2weeks' | '4weeks';
type ViewMode = 'plan' | 'shopping' | 'favorites';

export default function MealPlansScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { user, userProfile } = useAuth();

    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [activePlan, setActivePlan] = useState<StoredMealPlan | null>(null);
    const [selectedDay, setSelectedDay] = useState<number>(0);
    const [viewMode, setViewMode] = useState<ViewMode>('plan');
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [savedFavoriteIds, setSavedFavoriteIds] = useState<Set<string>>(new Set());
    const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<FavoriteMeal[]>([]);

    useFocusEffect(
        useCallback(() => {
            loadActivePlan();
        }, [user])
    );

    const loadActivePlan = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            const plan = await mealPlanService.getActivePlan(user.uid);
            setActivePlan(plan);

            // Also load favorites
            const userFavorites = await mealPlanService.getFavorites(user.uid);
            setFavorites(userFavorites);
            setSavedFavoriteIds(new Set(userFavorites.map(f => f.id)));
        } catch (error) {
            if (__DEV__) console.error('Failed to load meal plan:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePlan = async (duration: Duration) => {
        setShowGenerateModal(false);

        if (!user || !userProfile) {
            Alert.alert('Sign In Required', 'Please sign in to generate a personalized meal plan.');
            return;
        }

        setGenerating(true);

        try {
            const plan = await mealPlanService.generatePlan(user.uid, userProfile, duration);
            setActivePlan(plan);
            setSelectedDay(0);
            Alert.alert('Plan Generated! 🎉', `Your ${duration === '1week' ? '1-week' : duration === '2weeks' ? '2-week' : '4-week'} meal plan is ready.`);
        } catch (error: any) {
            if (__DEV__) console.error('Failed to generate plan:', error);
            Alert.alert('Generation Failed', error.message || 'Please try again later.');
        } finally {
            setGenerating(false);
        }
    };



    const handleSaveFavorite = async (meal: Meal) => {
        if (!user) return;

        // Check if already saved
        if (savedFavoriteIds.has(meal.id)) {
            Alert.alert('Already Saved', `${meal.name} is already in your favorites.`);
            return;
        }

        try {
            await mealPlanService.saveFavorite(user.uid, meal);
            setSavedFavoriteIds(prev => new Set([...prev, meal.id]));
            // Add to local favorites state
            const favMeal: FavoriteMeal = { ...meal, savedAt: new Date(), source: 'ai_generated' };
            setFavorites(prev => [...prev, favMeal]);
            Alert.alert('Saved!', `${meal.name} added to favorites.`);
        } catch (error) {
            if (__DEV__) console.error('Failed to save favorite:', error);
            Alert.alert('Error', 'Could not save favorite. Please try again.');
        }
    };

    const handleMealPress = (mealId: string) => {
        setExpandedMealId(prev => prev === mealId ? null : mealId);
    };

    const currentDayPlan = activePlan?.days[selectedDay];

    // Render loading state
    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary[500]} />
                </View>
            </SafeAreaView>
        );
    }

    // Render generating state
    if (generating) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary[500]} />
                    <Text style={[styles.loadingText, { color: theme.text }]}>
                        Generating your personalized plan...
                    </Text>
                    <Text style={[styles.loadingSubtext, { color: theme.textSecondary }]}>
                        This may take a moment
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>Meal Plans</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        AI-powered nutrition for your goals
                    </Text>
                </View>

                {/* View Mode Tabs */}
                {activePlan && (
                    <View style={styles.tabs}>
                        {(['plan', 'shopping', 'favorites'] as ViewMode[]).map((mode) => (
                            <TouchableOpacity
                                key={mode}
                                style={[
                                    styles.tab,
                                    viewMode === mode && { backgroundColor: Colors.primary[500] },
                                ]}
                                onPress={() => setViewMode(mode)}
                            >
                                <Text
                                    style={[
                                        styles.tabText,
                                        { color: viewMode === mode ? '#FFF' : theme.text },
                                    ]}
                                >
                                    {mode === 'plan' ? (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Ionicons name="calendar-outline" size={16} color={viewMode === mode ? '#FFF' : theme.text} />
                                            <Text style={[styles.tabText, { color: viewMode === mode ? '#FFF' : theme.text }]}>Plan</Text>
                                        </View>
                                    ) : mode === 'shopping' ? (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Ionicons name="cart-outline" size={16} color={viewMode === mode ? '#FFF' : theme.text} />
                                            <Text style={[styles.tabText, { color: viewMode === mode ? '#FFF' : theme.text }]}>Shopping</Text>
                                        </View>
                                    ) : (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Ionicons name="heart-outline" size={16} color={viewMode === mode ? '#FFF' : theme.text} />
                                            <Text style={[styles.tabText, { color: viewMode === mode ? '#FFF' : theme.text }]}>Favorites</Text>
                                        </View>
                                    )}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* No Plan State */}
                {!activePlan && (
                    <Card style={styles.emptyCard}>
                        <Ionicons name="restaurant-outline" size={64} color={Colors.primary[300]} style={{ marginBottom: spacing.md }} />
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>
                            No Active Meal Plan
                        </Text>
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                            Generate a personalized meal plan based on your profile, dietary preferences, and health goals.
                        </Text>
                        <Button
                            title="Generate New Plan"
                            onPress={() => setShowGenerateModal(true)}
                            style={styles.generateButton}
                        />
                    </Card>
                )}

                {/* Active Plan - Plan View */}
                {activePlan && viewMode === 'plan' && (
                    <>
                        {/* Day Selector */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.dayScroller}
                        >
                            {activePlan.days.map((day, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.dayChip,
                                        selectedDay === index && styles.dayChipSelected,
                                        { borderColor: selectedDay === index ? Colors.primary[500] : theme.border },
                                    ]}
                                    onPress={() => setSelectedDay(index)}
                                >
                                    <Text
                                        style={[
                                            styles.dayChipDay,
                                            { color: selectedDay === index ? Colors.primary[500] : theme.textMuted },
                                        ]}
                                    >
                                        {day.dayOfWeek?.substring(0, 3) || `Day ${index + 1}`}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.dayChipNumber,
                                            { color: selectedDay === index ? Colors.primary[500] : theme.text },
                                        ]}
                                    >
                                        {(() => {
                                            if (activePlan.startDate) {
                                                const date = new Date(activePlan.startDate);
                                                date.setDate(date.getDate() + index);
                                                return date.getDate();
                                            }
                                            return index + 1;
                                        })()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Day Summary */}
                        {currentDayPlan && (
                            <>
                                <Card style={styles.summaryCard}>
                                    <View style={styles.summaryRow}>
                                        <View style={styles.summaryItem}>
                                            <Text style={[styles.summaryValue, { color: Colors.primary[500] }]}>
                                                {currentDayPlan.totals?.calories || 0}
                                            </Text>
                                            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>cal</Text>
                                        </View>
                                        <View style={styles.summaryDivider} />
                                        <View style={styles.summaryItem}>
                                            <Text style={[styles.summaryValue, { color: Colors.secondary[500] }]}>
                                                {currentDayPlan.totals?.protein || 0}g
                                            </Text>
                                            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>protein</Text>
                                        </View>
                                        <View style={styles.summaryDivider} />
                                        <View style={styles.summaryItem}>
                                            <Text style={[styles.summaryValue, { color: Colors.tertiary[500] }]}>
                                                {currentDayPlan.totals?.carbs || 0}g
                                            </Text>
                                            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>carbs</Text>
                                        </View>
                                        <View style={styles.summaryDivider} />
                                        <View style={styles.summaryItem}>
                                            <Text style={[styles.summaryValue, { color: theme.text }]}>
                                                {currentDayPlan.totals?.fat || 0}g
                                            </Text>
                                            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>fat</Text>
                                        </View>
                                    </View>
                                </Card>

                                {/* Meals */}
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>Meals</Text>

                                {/* Breakfast */}
                                <MealCard
                                    label="Breakfast"
                                    meal={currentDayPlan.meals?.breakfast}
                                    theme={theme}
                                    onSaveFavorite={handleSaveFavorite}
                                    isFavorite={savedFavoriteIds.has(currentDayPlan.meals?.breakfast?.id || '')}
                                    isExpanded={expandedMealId === currentDayPlan.meals?.breakfast?.id}
                                    onPress={() => handleMealPress(currentDayPlan.meals?.breakfast?.id || '')}
                                />

                                {/* Lunch */}
                                <MealCard
                                    label="Lunch"
                                    meal={currentDayPlan.meals?.lunch}
                                    theme={theme}
                                    onSaveFavorite={handleSaveFavorite}
                                    isFavorite={savedFavoriteIds.has(currentDayPlan.meals?.lunch?.id || '')}
                                    isExpanded={expandedMealId === currentDayPlan.meals?.lunch?.id}
                                    onPress={() => handleMealPress(currentDayPlan.meals?.lunch?.id || '')}
                                />

                                {/* Dinner */}
                                <MealCard
                                    label="Dinner"
                                    meal={currentDayPlan.meals?.dinner}
                                    theme={theme}
                                    onSaveFavorite={handleSaveFavorite}
                                    isFavorite={savedFavoriteIds.has(currentDayPlan.meals?.dinner?.id || '')}
                                    isExpanded={expandedMealId === currentDayPlan.meals?.dinner?.id}
                                    onPress={() => handleMealPress(currentDayPlan.meals?.dinner?.id || '')}
                                />

                                {/* Snacks */}
                                {currentDayPlan.meals?.snacks?.map((snack, i) => (
                                    <MealCard
                                        key={i}
                                        label={`Snack ${i + 1}`}
                                        meal={snack}
                                        theme={theme}
                                        onSaveFavorite={handleSaveFavorite}
                                        isFavorite={savedFavoriteIds.has(snack?.id || '')}
                                        isExpanded={expandedMealId === snack?.id}
                                        onPress={() => handleMealPress(snack?.id || '')}
                                    />
                                ))}

                                {/* Exercise */}
                                {currentDayPlan.exercise && (
                                    <>
                                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Exercise</Text>
                                        <Card style={styles.exerciseCard}>
                                            <View style={styles.exerciseRow}>
                                                <View style={[styles.exerciseIcon, { backgroundColor: Colors.tertiary[500] + '20' }]}>
                                                    <Ionicons name="fitness-outline" size={24} color={Colors.tertiary[500]} />
                                                </View>
                                                <View style={styles.exerciseContent}>
                                                    <Text style={[styles.exerciseName, { color: theme.text }]}>
                                                        {currentDayPlan.exercise.name}
                                                    </Text>
                                                    <Text style={[styles.exerciseDesc, { color: theme.textSecondary }]}>
                                                        {currentDayPlan.exercise.duration} min • {currentDayPlan.exercise.intensity} intensity
                                                    </Text>
                                                </View>
                                            </View>
                                        </Card>
                                    </>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* Shopping List View */}
                {activePlan && viewMode === 'shopping' && (
                    <>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Shopping List ({activePlan.shoppingList?.length || 0} items)
                        </Text>
                        {activePlan.shoppingList?.map((item, index) => (
                            <Card key={index} style={styles.shoppingItem}>
                                <View style={styles.shoppingRow}>
                                    <Ionicons name="ellipse-outline" size={20} color={theme.textMuted} />
                                    <Text style={[styles.shoppingName, { color: theme.text }]}>
                                        {item.name}
                                    </Text>
                                    <Text style={[styles.shoppingAmount, { color: theme.textSecondary }]}>
                                        {item.amount} {item.unit}
                                    </Text>
                                </View>
                            </Card>
                        ))}
                    </>
                )}

                {/* Favorites View */}
                {viewMode === 'favorites' && (
                    <>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Favorite Meals ({favorites.length})
                        </Text>
                        {favorites.length === 0 ? (
                            <Card style={styles.emptyCard}>
                                <Ionicons name="heart-outline" size={64} color={Colors.primary[300]} style={{ marginBottom: spacing.md }} />
                                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                                    No Favorites Yet
                                </Text>
                                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                    Tap the heart icon on any meal to save it here for quick access.
                                </Text>
                            </Card>
                        ) : (
                            favorites.map((meal, index) => (
                                <MealCard
                                    key={meal.id || index}
                                    label={meal.source === 'ai_generated' ? 'AI Generated' : 'Recipe'}
                                    meal={meal}
                                    theme={theme}
                                    onSaveFavorite={() => { }}
                                    isFavorite={true}
                                    isExpanded={expandedMealId === meal.id}
                                    onPress={() => handleMealPress(meal.id)}
                                />
                            ))
                        )}
                    </>
                )}

                {/* Generate New Plan Button (when plan exists) */}
                {activePlan && (
                    <Button
                        title="Generate New Plan"
                        onPress={() => setShowGenerateModal(true)}
                        variant="outline"
                        style={styles.newPlanButton}
                    />
                )}

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Generate Plan Modal */}
            <Modal visible={showGenerateModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Generate Meal Plan</Text>
                        <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                            Choose plan duration
                        </Text>

                        <TouchableOpacity
                            style={[styles.durationOption, { borderColor: theme.border }]}
                            onPress={() => handleGeneratePlan('1week')}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <Ionicons name="calendar-outline" size={20} color={Colors.primary[500]} />
                                <Text style={[styles.durationText, { color: theme.text }]}>1 Week</Text>
                            </View>
                            <Text style={[styles.durationDesc, { color: theme.textSecondary }]}>7 days of meals</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.durationOption, { borderColor: theme.border }]}
                            onPress={() => handleGeneratePlan('2weeks')}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <Ionicons name="calendar-number-outline" size={20} color={Colors.primary[500]} />
                                <Text style={[styles.durationText, { color: theme.text }]}>2 Weeks</Text>
                            </View>
                            <Text style={[styles.durationDesc, { color: theme.textSecondary }]}>14 days of meals</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.durationOption, { borderColor: theme.border }]}
                            onPress={() => handleGeneratePlan('4weeks')}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <Ionicons name="calendar-clear-outline" size={20} color={Colors.primary[500]} />
                                <Text style={[styles.durationText, { color: theme.text }]}>4 Weeks</Text>
                            </View>
                            <Text style={[styles.durationDesc, { color: theme.textSecondary }]}>28 days of meals</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShowGenerateModal(false)}
                        >
                            <Text style={[styles.cancelText, { color: theme.textMuted }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>


        </SafeAreaView>
    );
}

// Meal Card Component
function MealCard({
    label,
    meal,
    theme,
    onSaveFavorite,
    isFavorite = false,
    isExpanded = false,
    onPress,
}: {
    label: string;
    meal?: Meal;
    theme: any;
    onSaveFavorite: (meal: Meal) => void;
    isFavorite?: boolean;
    isExpanded?: boolean;
    onPress?: () => void;
}) {
    if (!meal) return null;

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Card style={styles.mealCard}>
                <View style={styles.mealHeader}>
                    <Text style={[styles.mealLabel, { color: theme.textMuted }]}>{label}</Text>
                    <View style={styles.mealHeaderRight}>
                        <Ionicons
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={16}
                            color={theme.textMuted}
                            style={{ marginRight: 8 }}
                        />
                        <TouchableOpacity onPress={() => onSaveFavorite(meal)}>
                            <Ionicons
                                name={isFavorite ? "heart" : "heart-outline"}
                                size={20}
                                color={isFavorite ? Colors.primary[500] : Colors.primary[300]}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={[styles.mealName, { color: theme.text }]}>{meal.name}</Text>
                <Text style={[styles.mealDesc, { color: theme.textSecondary }]}>{meal.description}</Text>
                <View style={styles.mealMacros}>
                    <Text style={[styles.macroText, { color: Colors.primary[500] }]}>{meal.macros?.calories} cal</Text>
                    <Text style={[styles.macroText, { color: theme.textMuted }]}>P:{meal.macros?.protein}g</Text>
                    <Text style={[styles.macroText, { color: theme.textMuted }]}>C:{meal.macros?.carbs}g</Text>
                    <Text style={[styles.macroText, { color: theme.textMuted }]}>F:{meal.macros?.fat}g</Text>
                </View>

                {/* Expanded ingredients view */}
                {isExpanded && meal.ingredients && meal.ingredients.length > 0 && (
                    <View style={styles.ingredientsList}>
                        <Text style={[styles.ingredientsTitle, { color: theme.text }]}>Ingredients:</Text>
                        {meal.ingredients.map((ing, index) => (
                            <Text key={index} style={[styles.ingredientItem, { color: theme.textSecondary }]}>
                                • {ing.amount} {ing.unit} {ing.name}
                            </Text>
                        ))}
                    </View>
                )}

                {meal.diabeticFriendly && (
                    <View style={[styles.diabeticBadge, { backgroundColor: Colors.secondary[500] + '20' }]}>
                        <Text style={[styles.diabeticText, { color: Colors.secondary[500] }]}>
                            ✓ Diabetic Friendly
                        </Text>
                    </View>
                )}
            </Card>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    content: { padding: spacing.md },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { ...Typography.h4, marginTop: spacing.lg },
    loadingSubtext: { ...Typography.caption, marginTop: spacing.xs },
    header: { marginBottom: spacing.lg },
    title: { ...Typography.h2 },
    subtitle: { ...Typography.body },

    // Tabs
    tabs: { flexDirection: 'row', marginBottom: spacing.lg, gap: spacing.sm },
    tab: {
        flex: 1,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        backgroundColor: Colors.neutral[100],
    },
    tabText: { ...Typography.caption, fontWeight: '600' },

    // Empty State
    emptyCard: { alignItems: 'center', padding: spacing.xl },
    emptyEmoji: { fontSize: 64, marginBottom: spacing.md },
    emptyTitle: { ...Typography.h3, marginBottom: spacing.sm },
    emptyText: { ...Typography.body, textAlign: 'center', marginBottom: spacing.lg },
    generateButton: { width: '100%' },

    // Day Selector
    dayScroller: { marginBottom: spacing.lg },
    dayChip: {
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        marginRight: spacing.sm,
        minWidth: 56,
    },
    dayChipSelected: { backgroundColor: Colors.primary[500] + '10' },
    dayChipDay: { ...Typography.caption },
    dayChipNumber: { ...Typography.h4 },

    // Summary
    summaryCard: { marginBottom: spacing.lg },
    summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
    summaryItem: { alignItems: 'center' },
    summaryValue: { ...Typography.h4, fontWeight: '600' },
    summaryLabel: { ...Typography.caption },
    summaryDivider: { width: 1, height: 30, backgroundColor: Colors.neutral[200] },

    // Section
    sectionTitle: { ...Typography.h4, marginBottom: spacing.sm, marginTop: spacing.md },

    // Meal Card
    mealCard: { marginBottom: spacing.sm },
    mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
    mealHeaderRight: { flexDirection: 'row', alignItems: 'center' },
    mealLabel: { ...Typography.caption, fontWeight: '600', textTransform: 'uppercase' },
    mealName: { ...Typography.body, fontWeight: '600' },
    mealDesc: { ...Typography.caption, marginBottom: spacing.sm },
    mealMacros: { flexDirection: 'row', gap: spacing.md },
    macroText: { ...Typography.caption },
    ingredientsList: { marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: Colors.neutral[200] },
    ingredientsTitle: { ...Typography.caption, fontWeight: '600', marginBottom: spacing.xs },
    ingredientItem: { ...Typography.caption, marginVertical: 2 },
    diabeticBadge: { marginTop: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, alignSelf: 'flex-start' },
    diabeticText: { ...Typography.caption, fontWeight: '500' },

    // Exercise
    exerciseCard: { marginBottom: spacing.md },
    exerciseRow: { flexDirection: 'row', alignItems: 'center' },
    exerciseIcon: { width: 48, height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
    exerciseEmoji: { fontSize: 24 },
    exerciseContent: { flex: 1, marginLeft: spacing.md },
    exerciseName: { ...Typography.body, fontWeight: '600' },
    exerciseDesc: { ...Typography.caption },

    // Shopping
    shoppingItem: { marginBottom: spacing.xs },
    shoppingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    shoppingName: { ...Typography.body, flex: 1 },
    shoppingAmount: { ...Typography.caption },

    // New Plan Button
    newPlanButton: { marginTop: spacing.lg },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { padding: spacing.lg, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl },
    modalTitle: { ...Typography.h3, textAlign: 'center', marginBottom: spacing.xs },
    modalSubtitle: { ...Typography.body, textAlign: 'center', marginBottom: spacing.lg },
    durationOption: { padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, marginBottom: spacing.sm },
    durationText: { ...Typography.body, fontWeight: '600' },
    durationDesc: { ...Typography.caption },
    cancelButton: { padding: spacing.md, alignItems: 'center' },
    cancelText: { ...Typography.body },
    apiKeyInput: { borderWidth: 1, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md, fontSize: 16 },

    bottomSpacer: { height: 100 },
});
