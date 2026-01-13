/**
 * AuNouri - Home Screen (Dashboard)
 * Main overview with REAL calorie data, cycle phase, and quick actions
 */

import { Card } from '@/components/ui/Card';
import { CyclePhaseIndicator } from '@/components/ui/CyclePhaseIndicator';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { borderRadius, spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { CycleInfo, cycleService } from '@/services/cycle';
import { healthService, UnifiedHealthData } from '@/services/health';
import { mealPlanService, StoredMealPlan } from '@/services/mealPlanService';
import { DailyNutrition, mealService } from '@/services/meals';
import { DayProgress, trackingService } from '@/services/trackingService';
import { useFocusEffect } from '@react-navigation/native';
import { Link, router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { user, userProfile } = useAuth();

    const [loading, setLoading] = useState(true);
    const [nutrition, setNutrition] = useState<DailyNutrition | null>(null);
    const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null);
    const [streak, setStreak] = useState(0);
    const [healthData, setHealthData] = useState<UnifiedHealthData | null>(null);
    const [activePlan, setActivePlan] = useState<StoredMealPlan | null>(null);
    const [dailyProgress, setDailyProgress] = useState<DayProgress | null>(null);
    const [waterGoal, setWaterGoal] = useState(2500); // Default, can override from profile

    // Use saved calorie goal from profile, or default to 1800
    const goalCalories = userProfile?.calorieGoal || 1800;

    // Refresh data every time screen comes into focus
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [user])
    );

    const loadData = async () => {
        const userId = user?.uid || 'demo-user';

        try {
            // Connect to health provider if not already
            const provider = healthService.getRecommendedProvider();
            await healthService.connect(provider);

            const [nutritionData, cycleData, streakData, activityData, planData, progressData] = await Promise.all([
                mealService.getTodayNutrition(userId),
                cycleService.getCycleInfo(userId),
                mealService.getStreak(userId),
                healthService.syncTodayData(),
                mealPlanService.getActivePlan(userId),
                trackingService.getDailyProgress(userId),
            ]);

            setNutrition(nutritionData);
            setCycleInfo(cycleData);
            setStreak(streakData);
            setHealthData(activityData);
            setActivePlan(planData);
            setDailyProgress(progressData);

            if (userProfile?.waterGoal) {
                setWaterGoal(userProfile.waterGoal);
            }
        } catch (error) {
            console.error('Failed to load home data:', error);
        } finally {
            setLoading(false);
        }
    };

    const todayCalories = nutrition?.totalCalories || 0;
    const calorieProgress = (todayCalories / goalCalories) * 100;
    const userName = user?.displayName || 'there';
    const greeting = getGreeting();

    // Dynamic progress bar color: green → yellow → orange → red
    const getProgressColor = (progress: number): string => {
        if (progress <= 50) return '#4AC27D'; // Green - on track
        if (progress <= 75) return '#84CC16'; // Lime - getting there
        if (progress <= 90) return '#F5B800'; // Yellow - approaching limit
        if (progress <= 100) return '#F97316'; // Orange - near limit
        return '#EF4444'; // Red - over limit!
    };

    const progressColor = getProgressColor(calorieProgress);
    const isOverLimit = calorieProgress > 100;

    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    }

    const handleLogWater = async (amount: number) => {
        if (!user) return;
        try {
            await trackingService.logWater(user.uid, amount);
            loadData(); // Refresh data
        } catch (error) {
            console.error('Failed to log water:', error);
        }
    };

    const handleToggleExercise = async () => {
        if (!user || !dailyProgress) return;
        try {
            if (!dailyProgress.exerciseCompleted) {
                // Default logging for now
                await trackingService.logExercise(user.uid, { name: 'Planned Workout', duration: 30, intensity: 'medium', description: 'Quick workout' }, true);
                loadData();
            } else {
                Alert.alert('Exercise Completed', 'You have already logged your exercise for today! Great job! 💪');
            }
        } catch (error) {
            console.error('Failed to log exercise:', error);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary[500]} />
                    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                        Loading your data...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Greeting */}
                <View style={styles.greeting}>
                    <Text style={[styles.greetingText, { color: theme.textSecondary }]}>
                        {greeting}
                    </Text>
                    <Text style={[styles.nameText, { color: theme.text }]}>
                        Welcome back, {userName}! 👋
                    </Text>
                </View>

                {/* Streak Badge */}
                {streak > 0 && (
                    <View style={[styles.streakBadge, { backgroundColor: Colors.primary[500] + '20' }]}>
                        <Text style={styles.streakEmoji}>🔥</Text>
                        <Text style={[styles.streakText, { color: Colors.primary[600] }]}>
                            {streak} day streak!
                        </Text>
                    </View>
                )}

                {/* Today's Pulse Card */}
                {activePlan && dailyProgress && (
                    <Card style={styles.pulseCard} variant="elevated">
                        <View style={styles.pulseHeader}>
                            <Text style={[styles.cardTitle, { color: theme.text }]}>Today's Pulse</Text>
                            <TouchableOpacity onPress={() => router.push('/(tabs)/meal-plans')}>
                                <Text style={[styles.seeAllLink, { color: Colors.primary[500] }]}>View Plan</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.pulseRow}>
                            {/* Water Tracker */}
                            <View style={[styles.pulseItem, { flex: 1 }]}>
                                <View style={styles.waterHeader}>
                                    <Text style={styles.pulseIcon}>💧</Text>
                                    <Text style={[styles.pulseLabel, { color: theme.textMuted }]}>{dailyProgress.waterConsumed} / {waterGoal}ml</Text>
                                </View>
                                <View style={styles.waterButtons}>
                                    <TouchableOpacity
                                        style={[styles.waterBtn, { backgroundColor: Colors.primary[500] + '20' }]}
                                        onPress={() => handleLogWater(250)}
                                    >
                                        <Text style={[styles.waterBtnText, { color: Colors.primary[600] }]}>+Cup</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.waterBtn, { backgroundColor: Colors.primary[500] + '20' }]}
                                        onPress={() => handleLogWater(500)}
                                    >
                                        <Text style={[styles.waterBtnText, { color: Colors.primary[600] }]}>+Bottle</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.pulseDivider} />

                            {/* Plan Status */}
                            <View style={[styles.pulseItem, { flex: 1 }]}>
                                <View style={styles.planHeader}>
                                    <Text style={styles.pulseIcon}>🥗</Text>
                                    <Text style={[styles.pulseLabel, { color: theme.textMuted }]}>
                                        {new Date().getHours() < 11 ? 'Breakfast' : new Date().getHours() < 15 ? 'Lunch' : 'Dinner'}
                                    </Text>
                                </View>
                                <Text style={[styles.nextMealName, { color: theme.text }]} numberOfLines={1}>
                                    {/* Simplified logic to show next meal approx */}
                                    {new Date().getHours() < 11
                                        ? activePlan.days[0]?.meals?.breakfast?.name || 'Breakfast'
                                        : new Date().getHours() < 15
                                            ? activePlan.days[0]?.meals?.lunch?.name || 'Lunch'
                                            : activePlan.days[0]?.meals?.dinner?.name || 'Dinner'
                                    }
                                </Text>
                                <TouchableOpacity onPress={handleToggleExercise}>
                                    <Text style={[styles.exerciseStatus, { color: dailyProgress.exerciseCompleted ? Colors.secondary[500] : theme.textMuted }]}>
                                        {dailyProgress.exerciseCompleted ? '✓ Exercise Done' : '○ Mark Exercise Done'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Card>
                )}

                {/* Cycle Phase Card */}
                <Card style={styles.cycleCard} variant="elevated">
                    <CyclePhaseIndicator
                        phase={cycleInfo?.currentPhase || 'follicular'}
                        dayOfCycle={cycleInfo?.dayOfCycle || 1}
                    />
                </Card>

                {/* Calorie Progress Card */}
                <Card style={styles.calorieCard} variant="elevated">
                    <View style={styles.calorieHeader}>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>
                            Today's Nutrition
                        </Text>
                        <Text style={[styles.calorieLabel, { color: theme.textSecondary }]}>
                            {isOverLimit
                                ? `${todayCalories - goalCalories} cal OVER`
                                : `${Math.max(0, goalCalories - todayCalories)} cal remaining`}
                        </Text>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressRing, { borderColor: theme.border }]}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        backgroundColor: progressColor,
                                        width: `${Math.min(calorieProgress, 100)}%`,
                                    },
                                ]}
                            />
                        </View>
                        <View style={styles.calorieNumbers}>
                            <Text style={[styles.currentCalories, { color: progressColor }]}>
                                {todayCalories}
                            </Text>
                            <Text style={[styles.goalCalories, { color: theme.textMuted }]}>
                                / {goalCalories} cal
                            </Text>
                        </View>
                    </View>

                    {/* Macros */}
                    <View style={styles.macroRow}>
                        <View style={styles.macroItem}>
                            <Text style={[styles.macroValue, { color: Colors.secondary[500] }]}>
                                {(nutrition?.totalProtein || 0).toFixed(1)}g
                            </Text>
                            <Text style={[styles.macroLabel, { color: theme.textMuted }]}>Protein</Text>
                        </View>
                        <View style={styles.macroItem}>
                            <Text style={[styles.macroValue, { color: Colors.primary[500] }]}>
                                {(nutrition?.totalCarbs || 0).toFixed(1)}g
                            </Text>
                            <Text style={[styles.macroLabel, { color: theme.textMuted }]}>Carbs</Text>
                        </View>
                        <View style={styles.macroItem}>
                            <Text style={[styles.macroValue, { color: Colors.tertiary[500] }]}>
                                {(nutrition?.totalFat || 0).toFixed(1)}g
                            </Text>
                            <Text style={[styles.macroLabel, { color: theme.textMuted }]}>Fat</Text>
                        </View>
                    </View>
                </Card>

                {/* Activity Card */}
                {healthData && (
                    <Card style={styles.activityCard}>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>
                            Today's Activity
                        </Text>
                        <View style={styles.activityRow}>
                            <View style={styles.activityItem}>
                                <Text style={styles.activityIcon}>👟</Text>
                                <Text style={[styles.activityValue, { color: Colors.primary[500] }]}>
                                    {healthData.steps.toLocaleString()}
                                </Text>
                                <Text style={[styles.activityLabel, { color: theme.textMuted }]}>
                                    Steps
                                </Text>
                            </View>
                            <View style={styles.activityItem}>
                                <Text style={styles.activityIcon}>🔥</Text>
                                <Text style={[styles.activityValue, { color: Colors.tertiary[500] }]}>
                                    {healthData.activeCalories}
                                </Text>
                                <Text style={[styles.activityLabel, { color: theme.textMuted }]}>
                                    Active Cal
                                </Text>
                            </View>
                            <View style={styles.activityItem}>
                                <Text style={styles.activityIcon}>😴</Text>
                                <Text style={[styles.activityValue, { color: Colors.secondary[500] }]}>
                                    {healthData.sleepHours}h
                                </Text>
                                <Text style={[styles.activityLabel, { color: theme.textMuted }]}>
                                    Sleep
                                </Text>
                            </View>
                            <View style={styles.activityItem}>
                                <Text style={styles.activityIcon}>📍</Text>
                                <Text style={[styles.activityValue, { color: Colors.neutral[600] }]}>
                                    {(healthData.distance / 1000).toFixed(1)}
                                </Text>
                                <Text style={[styles.activityLabel, { color: theme.textMuted }]}>
                                    km
                                </Text>
                            </View>
                        </View>
                    </Card>
                )}

                {/* Quick Actions */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Quick Actions
                </Text>
                <View style={styles.quickActions}>
                    <Link href="/(tabs)/camera" style={styles.quickActionLink}>
                        <View style={[styles.quickAction, { backgroundColor: Colors.primary[500] + '15' }]}>
                            <Text style={styles.quickActionIcon}>📸</Text>
                            <Text style={[styles.quickActionText, { color: theme.text }]}>Scan Food</Text>
                        </View>
                    </Link>
                    <Link href="/(tabs)/cycle" style={styles.quickActionLink}>
                        <View style={[styles.quickAction, { backgroundColor: Colors.secondary[500] + '15' }]}>
                            <Text style={styles.quickActionIcon}>🌸</Text>
                            <Text style={[styles.quickActionText, { color: theme.text }]}>Log Period</Text>
                        </View>
                    </Link>
                    <Link href="/(tabs)/recommendations" style={styles.quickActionLink}>
                        <View style={[styles.quickAction, { backgroundColor: Colors.tertiary[500] + '15' }]}>
                            <Text style={styles.quickActionIcon}>💪</Text>
                            <Text style={[styles.quickActionText, { color: theme.text }]}>Get Tips</Text>
                        </View>
                    </Link>
                    <Link href="/meal-history" style={styles.quickActionLink}>
                        <View style={[styles.quickAction, { backgroundColor: Colors.neutral[500] + '15' }]}>
                            <Text style={styles.quickActionIcon}>📊</Text>
                            <Text style={[styles.quickActionText, { color: theme.text }]}>History</Text>
                        </View>
                    </Link>
                </View>

                {/* Recent Meals Preview */}
                {nutrition && nutrition.meals.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Today's Meals
                        </Text>
                        {nutrition.meals.slice(0, 3).map((meal, index) => (
                            <TouchableOpacity
                                key={meal.id || index}
                                onPress={() => router.push({
                                    pathname: '/meal-details',
                                    params: {
                                        id: meal.id,
                                        mealData: JSON.stringify({
                                            ...meal,
                                            createdAt: meal.createdAt.toISOString(),
                                        }),
                                    },
                                })}
                            >
                                <Card style={styles.mealCard}>
                                    <View style={styles.mealRow}>
                                        <View>
                                            <Text style={[styles.mealType, { color: theme.text }]}>
                                                {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
                                            </Text>
                                            <Text style={[styles.mealFoods, { color: theme.textSecondary }]}>
                                                {meal.foods.map(f => f.name).join(', ').slice(0, 30)}...
                                            </Text>
                                        </View>
                                        <Text style={[styles.mealCalories, { color: Colors.primary[500] }]}>
                                            {meal.totalCalories.toFixed(1)} cal
                                        </Text>
                                    </View>
                                </Card>
                            </TouchableOpacity>
                        ))}
                    </>
                )}

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: spacing.md, ...Typography.body },
    scrollView: { flex: 1 },
    content: { padding: spacing.md },
    greeting: { marginBottom: spacing.lg },
    greetingText: { ...Typography.caption },
    nameText: { ...Typography.h2 },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
        marginBottom: spacing.md,
        gap: spacing.xs,
    },
    streakEmoji: { fontSize: 16 },
    streakText: { ...Typography.label, fontWeight: '600' },
    cycleCard: { marginBottom: spacing.md },
    calorieCard: { marginBottom: spacing.lg },

    // Activity card styles
    activityCard: { marginBottom: spacing.lg },
    activityRow: { flexDirection: 'row', justifyContent: 'space-around' },
    activityItem: { alignItems: 'center' },
    activityIcon: { fontSize: 24, marginBottom: spacing.xs },
    activityValue: { ...Typography.h4, fontWeight: '700' },
    activityLabel: { ...Typography.caption },

    calorieHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    cardTitle: { ...Typography.h4 },
    calorieLabel: { ...Typography.caption },
    progressContainer: { marginBottom: spacing.md },
    progressRing: { height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.1)', overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4 },
    calorieNumbers: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.sm },
    currentCalories: { ...Typography.h2 },
    goalCalories: { ...Typography.body, marginLeft: spacing.xs },
    macroRow: { flexDirection: 'row', justifyContent: 'space-around' },
    macroItem: { alignItems: 'center' },
    macroValue: { ...Typography.h4 },
    macroLabel: { ...Typography.caption },
    sectionTitle: { ...Typography.h4, marginBottom: spacing.md },
    quickActions: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
    quickActionLink: { flex: 1 },
    quickAction: { padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center' },
    quickActionIcon: { fontSize: 28, marginBottom: spacing.xs },
    quickActionText: { ...Typography.caption, fontWeight: '600' },
    mealCard: { marginBottom: spacing.sm },
    mealRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    mealType: { ...Typography.body, fontWeight: '600' },
    mealFoods: { ...Typography.caption },
    mealCalories: { ...Typography.h4 },

    // Pulse Card
    pulseCard: { marginBottom: spacing.md },
    pulseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    seeAllLink: { ...Typography.caption, fontWeight: '600' },
    pulseRow: { flexDirection: 'row', alignItems: 'flex-start' },
    pulseItem: { alignItems: 'flex-start' },
    pulseDivider: { width: 1, backgroundColor: '#E5E5E5', height: '100%', marginHorizontal: spacing.md },
    waterHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
    pulseIcon: { fontSize: 16, marginRight: spacing.xs },
    pulseLabel: { ...Typography.caption },
    waterButtons: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
    waterBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: borderRadius.sm },
    waterBtnText: { fontSize: 11, fontWeight: '600' },
    planHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
    nextMealName: { ...Typography.body, fontWeight: '600', marginBottom: spacing.xs },
    exerciseStatus: { ...Typography.caption },

    bottomSpacer: { height: 100 },
});
