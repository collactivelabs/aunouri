/**
 * AuNouri - Meal Details Screen
 * View full details of a logged meal
 */

import { Card } from '@/components/ui/Card';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { borderRadius, spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { MealLog, mealService } from '@/services/meals';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MealDetailsScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { id, mealData } = useLocalSearchParams<{ id: string; mealData?: string }>();

    const [meal, setMeal] = useState<MealLog | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMeal();
    }, [id, mealData]);

    const loadMeal = async () => {
        try {
            // If meal data was passed as param, use it
            if (mealData) {
                const parsed = JSON.parse(mealData);
                // Convert date string back to Date object
                parsed.createdAt = new Date(parsed.createdAt);
                setMeal(parsed);
            }
        } catch (error) {
            console.error('Failed to load meal:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Meal',
            'Are you sure you want to delete this meal?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (meal?.id) {
                                await mealService.deleteMeal(meal.id);
                                router.back();
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
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        });
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

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary[500]} />
                </View>
            </SafeAreaView>
        );
    }

    if (!meal) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Meal Details</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                        Meal not found
                    </Text>
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
                <Text style={[styles.headerTitle, { color: theme.text }]}>Meal Details</Text>
                <TouchableOpacity onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={24} color={Colors.neutral[400]} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                {/* Photo */}
                {meal.photoUri && (
                    <View style={styles.photoContainer}>
                        <Image source={{ uri: meal.photoUri }} style={styles.mealPhoto} />
                    </View>
                )}

                {/* Meal Info */}
                <Card style={styles.infoCard}>
                    <View style={styles.mealHeader}>
                        <Text style={styles.mealIcon}>{getMealIcon(meal.mealType)}</Text>
                        <View style={styles.mealTitleContainer}>
                            <Text style={[styles.mealType, { color: theme.text }]}>
                                {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
                            </Text>
                            <Text style={[styles.mealDate, { color: theme.textSecondary }]}>
                                {formatDate(meal.createdAt)} at {formatTime(meal.createdAt)}
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Plan Comparison */}
                {meal.plannedMeal && (
                    <Card style={styles.comparisonCard}>
                        <View style={styles.comparisonHeader}>
                            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
                                Plan Comparison
                            </Text>
                            {meal.matchScore !== undefined && (
                                <View style={[styles.scoreBadge, {
                                    backgroundColor: meal.matchScore >= 80 ? Colors.primary[500] + '20' :
                                        meal.matchScore >= 50 ? Colors.secondary[500] + '20' :
                                            Colors.tertiary[500] + '20'
                                }]}>
                                    <Text style={[styles.scoreText, {
                                        color: meal.matchScore >= 80 ? Colors.primary[500] :
                                            meal.matchScore >= 50 ? Colors.secondary[500] :
                                                Colors.tertiary[500]
                                    }]}>
                                        {Math.round(meal.matchScore)}% Match
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.plannedMealInfo}>
                            <Text style={[styles.plannedLabel, { color: theme.textMuted }]}>
                                Planned:
                            </Text>
                            <Text style={[styles.plannedName, { color: theme.text }]}>
                                {meal.plannedMeal.name}
                            </Text>
                        </View>

                        {meal.feedback && (
                            <View style={styles.feedbackContainer}>
                                <Ionicons name="information-circle-outline" size={20} color={theme.textMuted} style={{ marginTop: 2 }} />
                                <Text style={[styles.feedbackText, { color: theme.textSecondary }]}>
                                    {meal.feedback}
                                </Text>
                            </View>
                        )}
                    </Card>
                )}

                {/* Nutrition Summary */}
                <Card style={styles.nutritionCard}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Nutrition Summary
                    </Text>
                    <View style={styles.macroGrid}>
                        <View style={styles.macroItem}>
                            <Text style={[styles.macroValue, { color: Colors.primary[500] }]}>
                                {meal.totalCalories.toFixed(1)}
                            </Text>
                            <Text style={[styles.macroLabel, { color: theme.textMuted }]}>
                                Calories
                            </Text>
                        </View>
                        <View style={styles.macroItem}>
                            <Text style={[styles.macroValue, { color: Colors.secondary[500] }]}>
                                {meal.totalProtein.toFixed(1)}g
                            </Text>
                            <Text style={[styles.macroLabel, { color: theme.textMuted }]}>
                                Protein
                            </Text>
                        </View>
                        <View style={styles.macroItem}>
                            <Text style={[styles.macroValue, { color: Colors.primary[500] }]}>
                                {meal.totalCarbs.toFixed(1)}g
                            </Text>
                            <Text style={[styles.macroLabel, { color: theme.textMuted }]}>
                                Carbs
                            </Text>
                        </View>
                        <View style={styles.macroItem}>
                            <Text style={[styles.macroValue, { color: Colors.tertiary[500] }]}>
                                {meal.totalFat.toFixed(1)}g
                            </Text>
                            <Text style={[styles.macroLabel, { color: theme.textMuted }]}>
                                Fat
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Food Items */}
                <Card style={styles.foodsCard}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Foods ({meal.foods.length})
                    </Text>
                    {meal.foods.map((food, index) => (
                        <View
                            key={index}
                            style={[
                                styles.foodItem,
                                index < meal.foods.length - 1 && styles.foodItemBorder,
                            ]}
                        >
                            <View style={styles.foodInfo}>
                                <Text style={[styles.foodName, { color: theme.text }]}>
                                    {food.name}
                                </Text>
                                <Text style={[styles.foodServing, { color: theme.textSecondary }]}>
                                    {food.servingSize || '1 serving'}
                                </Text>
                            </View>
                            <View style={styles.foodNutrition}>
                                <Text style={[styles.foodCalories, { color: Colors.primary[500] }]}>
                                    {food.calories.toFixed(1)} cal
                                </Text>
                                <Text style={[styles.foodMacros, { color: theme.textMuted }]}>
                                    P: {food.protein.toFixed(1)}g • C: {food.carbs.toFixed(1)}g • F: {food.fat.toFixed(1)}g
                                </Text>
                            </View>
                        </View>
                    ))}
                </Card>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { ...Typography.body },
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

    // Photo
    photoContainer: { marginBottom: spacing.lg },
    mealPhoto: {
        width: '100%',
        height: 200,
        borderRadius: borderRadius.lg,
        backgroundColor: Colors.neutral[200],
    },

    // Info card
    infoCard: { marginBottom: spacing.md },
    mealHeader: { flexDirection: 'row', alignItems: 'center' },
    mealIcon: { fontSize: 40, marginRight: spacing.md },
    mealTitleContainer: { flex: 1 },
    mealType: { ...Typography.h3 },
    mealDate: { ...Typography.caption, marginTop: spacing.xs },

    // Comparison card
    comparisonCard: { marginBottom: spacing.md },
    comparisonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    scoreBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full },
    scoreText: { ...Typography.caption, fontWeight: '700' },
    plannedMealInfo: { marginBottom: spacing.md },
    plannedLabel: { ...Typography.caption, marginBottom: 2 },
    plannedName: { ...Typography.body, fontWeight: '600' },
    feedbackContainer: { flexDirection: 'row', backgroundColor: Colors.neutral[100], padding: spacing.sm, borderRadius: borderRadius.md },
    feedbackText: { ...Typography.caption, flex: 1, marginLeft: spacing.xs },

    // Nutrition card
    nutritionCard: { marginBottom: spacing.md },
    sectionTitle: { ...Typography.h4, marginBottom: spacing.md },
    macroGrid: { flexDirection: 'row', justifyContent: 'space-around' },
    macroItem: { alignItems: 'center' },
    macroValue: { ...Typography.h3, fontWeight: '700' },
    macroLabel: { ...Typography.caption },

    // Foods card
    foodsCard: { marginBottom: spacing.md },
    foodItem: { paddingVertical: spacing.md },
    foodItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.neutral[200] },
    foodInfo: { marginBottom: spacing.xs },
    foodName: { ...Typography.body, fontWeight: '600' },
    foodServing: { ...Typography.caption },
    foodNutrition: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    foodCalories: { ...Typography.body, fontWeight: '600' },
    foodMacros: { ...Typography.caption },

    bottomSpacer: { height: 50 },
});
