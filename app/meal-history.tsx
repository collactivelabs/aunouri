/**
 * AuNouri - Meal History Screen
 * View past meals, delete entries, and see weekly nutrition summary
 */

import { Card } from '@/components/ui/Card';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { MealLog, mealService } from '@/services/meals';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MealHistoryScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [meals, setMeals] = useState<MealLog[]>([]);
    const [weeklyStats, setWeeklyStats] = useState({
        totalCalories: 0,
        totalMeals: 0,
        avgCaloriesPerDay: 0,
    });

    useFocusEffect(
        useCallback(() => {
            loadMeals();
        }, [user])
    );

    const loadMeals = async () => {
        if (!user) return;

        try {
            const weeklyMeals = await mealService.getMealsForWeek(user.uid);
            setMeals(weeklyMeals);

            // Calculate weekly stats
            const totalCalories = weeklyMeals.reduce((sum, m) => sum + m.totalCalories, 0);
            const uniqueDays = new Set(weeklyMeals.map(m =>
                m.createdAt.toISOString().split('T')[0]
            ));

            setWeeklyStats({
                totalCalories,
                totalMeals: weeklyMeals.length,
                avgCaloriesPerDay: uniqueDays.size > 0
                    ? Math.round(totalCalories / uniqueDays.size)
                    : 0,
            });
        } catch (error) {
            console.error('Failed to load meals:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadMeals();
    };

    const handleDeleteMeal = (meal: MealLog) => {
        Alert.alert(
            'Delete Meal',
            `Are you sure you want to delete this ${meal.mealType}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (meal.id) {
                                await mealService.deleteMeal(meal.id);
                                loadMeals();
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Could not delete meal.');
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (date: Date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const dateStr = date.toISOString().split('T')[0];
        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (dateStr === todayStr) return 'Today';
        if (dateStr === yesterdayStr) return 'Yesterday';
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    const getMealIcon = (mealType: string) => {
        switch (mealType) {
            case 'breakfast': return '🌅';
            case 'lunch': return '☀️';
            case 'dinner': return '🌙';
            case 'snack': return '🍎';
            default: return '🍽️';
        }
    };

    // Group meals by date
    const groupedMeals = meals.reduce((groups, meal) => {
        const dateStr = meal.createdAt.toISOString().split('T')[0];
        if (!groups[dateStr]) {
            groups[dateStr] = [];
        }
        groups[dateStr].push(meal);
        return groups;
    }, {} as Record<string, MealLog[]>);

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary[500]} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Meal History</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            >
                {/* Weekly Stats */}
                <Card style={styles.statsCard}>
                    <Text style={[styles.statsTitle, { color: theme.text }]}>This Week</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: Colors.primary[500] }]}>
                                {weeklyStats.totalMeals}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                                Meals
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: Colors.tertiary[500] }]}>
                                {weeklyStats.totalCalories.toFixed(1)}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                                Total Cal
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: Colors.secondary[500] }]}>
                                {weeklyStats.avgCaloriesPerDay.toLocaleString()}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                                Avg/Day
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Meals List */}
                {Object.keys(groupedMeals).length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <Ionicons name="restaurant-outline" size={48} color={theme.textMuted} />
                        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                            No meals logged this week
                        </Text>
                        <Text style={[styles.emptySubtext, { color: theme.textMuted }]}>
                            Use the camera to scan and log your meals!
                        </Text>
                    </Card>
                ) : (
                    Object.entries(groupedMeals).map(([dateStr, dayMeals]) => (
                        <View key={dateStr} style={styles.dayGroup}>
                            <Text style={[styles.dayTitle, { color: theme.text }]}>
                                {formatDate(new Date(dateStr))}
                            </Text>
                            <Card>
                                {dayMeals.map((meal, index) => (
                                    <TouchableOpacity
                                        key={meal.id}
                                        style={[
                                            styles.mealItem,
                                            index < dayMeals.length - 1 && styles.mealItemBorder,
                                        ]}
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
                                        onLongPress={() => handleDeleteMeal(meal)}
                                    >
                                        <Text style={styles.mealIcon}>{getMealIcon(meal.mealType)}</Text>
                                        <View style={styles.mealInfo}>
                                            <Text style={[styles.mealType, { color: theme.text }]}>
                                                {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
                                            </Text>
                                            <Text style={[styles.mealTime, { color: theme.textSecondary }]}>
                                                {formatTime(meal.createdAt)} • {meal.foods.length} item{meal.foods.length !== 1 ? 's' : ''}
                                            </Text>
                                        </View>
                                        <View style={styles.mealCalories}>
                                            <Text style={[styles.calorieValue, { color: Colors.primary[500] }]}>
                                                {meal.totalCalories.toFixed(1)}
                                            </Text>
                                            <Text style={[styles.calorieLabel, { color: theme.textSecondary }]}>
                                                cal
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={18} color={Colors.neutral[400]} />
                                    </TouchableOpacity>
                                ))}
                            </Card>
                        </View>
                    ))
                )}

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    headerTitle: { ...Typography.h3 },
    scrollView: { flex: 1 },
    content: { padding: spacing.md },

    // Stats
    statsCard: { marginBottom: spacing.lg },
    statsTitle: { ...Typography.h4, marginBottom: spacing.md, textAlign: 'center' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
    statItem: { alignItems: 'center' },
    statValue: { ...Typography.h2, fontWeight: '700' },
    statLabel: { ...Typography.caption },

    // Day groups
    dayGroup: { marginBottom: spacing.lg },
    dayTitle: { ...Typography.body, fontWeight: '600', marginBottom: spacing.sm },

    // Meal items
    mealItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
    },
    mealItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.neutral[200],
    },
    mealIcon: { fontSize: 24, marginRight: spacing.md },
    mealInfo: { flex: 1 },
    mealType: { ...Typography.body, fontWeight: '600' },
    mealTime: { ...Typography.caption },
    mealCalories: { alignItems: 'flex-end', marginRight: spacing.sm },
    calorieValue: { ...Typography.body, fontWeight: '700' },
    calorieLabel: { ...Typography.caption },
    deleteBtn: { padding: spacing.xs },

    // Empty state
    emptyCard: { alignItems: 'center', padding: spacing.xl },
    emptyText: { ...Typography.h4, marginTop: spacing.md },
    emptySubtext: { ...Typography.body, textAlign: 'center', marginTop: spacing.xs },

    bottomSpacer: { height: 100 },
});
