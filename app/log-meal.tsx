/**
 * AuNouri - Log Meal & Comparison Screen
 * Shows scanned meal vs planned meal with feedback and scoring
 */

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { Meal } from '@/services/anthropicService';
import { FoodRecognitionResult, NutritionInfo } from '@/services/foodRecognition';
import { mealPlanService } from '@/services/mealPlanService';
import { trackingService } from '@/services/trackingService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LogMealScreen() {
    const { results, photoUri } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [loading, setLoading] = useState(true);
    const [scannedData, setScannedData] = useState<FoodRecognitionResult | null>(null);
    const [plannedMeal, setPlannedMeal] = useState<Meal | undefined>(undefined);
    const [matchResult, setMatchResult] = useState<{ score: number | null; feedback: string } | null>(null);
    const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('snack');

    useEffect(() => {
        if (results && typeof results === 'string') {
            try {
                const parsed = JSON.parse(results);
                setScannedData(parsed);
                determineMealContext(parsed);
            } catch (e) {
                console.error('Failed to parse results', e);
                Alert.alert('Error', 'Invalid meal data');
                router.back();
            }
        }
    }, [results]);

    const determineMealContext = async (scanned: FoodRecognitionResult) => {
        if (!user) return;

        try {
            // 1. Determine meal type based on time
            const hour = new Date().getHours();
            let type: any = 'snack';
            if (hour >= 6 && hour < 11) type = 'breakfast';
            else if (hour >= 11 && hour < 15) type = 'lunch';
            else if (hour >= 17 && hour < 21) type = 'dinner';

            setMealType(type);

            // 2. Fetch active plan
            const plan = await mealPlanService.getActivePlan(user.uid);

            // 3. Find today's planned meal
            if (plan && plan.days && plan.days.length > 0) {
                // Assuming simple 1-week plan mapping for now
                // Ideally matches specific date
                const todayIndex = new Date().getDay() - 1; // 0 = Mon
                const dayPlan = plan.days[todayIndex >= 0 ? todayIndex : 0]; // Default to Mon

                if (dayPlan && dayPlan.meals) {
                    const targetMeal = dayPlan.meals[type as keyof typeof dayPlan.meals];
                    if (targetMeal && !Array.isArray(targetMeal)) {
                        // It's a Meal object (not array of snacks)
                        setPlannedMeal(targetMeal as Meal);
                    }
                }
            }
        } catch (error) {
            console.error('Error determining context:', error);
        } finally {
            setLoading(false);
        }
    };

    // Run comparison when we have both scanned data and (optionally) planned meal
    useEffect(() => {
        if (scannedData && !loading) {
            const primaryFood = scannedData.foods[0]; // Compare against main item for now
            // Improve: aggregate scanned foods into one "Meal" object for comparison

            // Construct a composite NutritionInfo for the whole meal
            const compositeMeal: NutritionInfo = {
                name: scannedData.foods.map(f => f.name).join(', '),
                calories: scannedData.totalCalories,
                protein: scannedData.totalProtein,
                carbs: scannedData.totalCarbs,
                fat: scannedData.totalFat,
                fiber: 0, // Need to sum these from API if available
                sugar: 0,
                servingSize: '1 meal',
                servingQty: 1
            };

            const result = trackingService.compareMealToPlan(compositeMeal, plannedMeal);
            setMatchResult(result);
        }
    }, [scannedData, plannedMeal, loading]);

    const handleConfirmLog = async () => {
        if (!user || !scannedData) return;

        try {
            const compositeMeal: NutritionInfo = {
                name: scannedData.foods.map(f => f.name).join(', '),
                calories: scannedData.totalCalories,
                protein: scannedData.totalProtein,
                carbs: scannedData.totalCarbs,
                fat: scannedData.totalFat,
                fiber: 0,
                sugar: 0,
                servingSize: '1 meal',
                servingQty: 1
            };

            await trackingService.logMeal(user.uid, mealType, compositeMeal, plannedMeal);

            Alert.alert('Success', 'Meal logged successfully!', [
                { text: 'OK', onPress: () => router.push('/(tabs)') }
            ]);
        } catch (error) {
            console.error('Failed to log meal:', error);
            Alert.alert('Error', 'Could not save meal.');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={Colors.primary[500]} />
            </SafeAreaView>
        );
    }

    if (!scannedData) return null;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.title, { color: theme.text }]}>Meal Feedback</Text>

                {/* Match Score Card */}
                {matchResult && matchResult.score !== null ? (
                    <Card style={styles.scoreCard} variant="elevated">
                        <View style={styles.scoreHeader}>
                            <View style={[styles.scoreCircle, { borderColor: matchResult.score > 80 ? Colors.primary[500] : matchResult.score > 50 ? Colors.secondary[500] : '#EF4444' }]}>
                                <Text style={[styles.scoreValue, { color: theme.text }]}>{matchResult.score}</Text>
                                <Text style={styles.scoreLabel}>Score</Text>
                            </View>
                            <View style={styles.feedbackContainer}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <Ionicons
                                        name={matchResult.score > 80 ? 'trophy-outline' : matchResult.score > 50 ? 'thumbs-up-outline' : 'alert-circle-outline'}
                                        size={20}
                                        color={matchResult.score > 80 ? Colors.primary[500] : matchResult.score > 50 ? Colors.secondary[500] : '#EF4444'}
                                    />
                                    <Text style={[styles.feedbackTitle, { color: theme.text, marginBottom: 0 }]}>
                                        {matchResult.score > 80 ? 'Excellent Match!' : matchResult.score > 50 ? 'Good Effort' : 'Off Track'}
                                    </Text>
                                </View>
                                <Text style={[styles.feedbackText, { color: theme.textSecondary }]}>
                                    {matchResult.feedback}
                                </Text>
                            </View>
                        </View>
                    </Card>
                ) : matchResult ? (
                    <Card style={styles.scoreCard} variant="elevated">
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                            <View style={[styles.scoreCircle, { borderColor: Colors.primary[500], borderStyle: 'dashed' }]}>
                                <Ionicons name="checkmark" size={32} color={Colors.primary[500]} />
                            </View>
                            <View style={styles.feedbackContainer}>
                                <Text style={[styles.feedbackTitle, { color: theme.text }]}>Meal Logged</Text>
                                <Text style={[styles.feedbackText, { color: theme.textSecondary }]}>
                                    {matchResult.feedback}
                                </Text>
                            </View>
                        </View>
                    </Card>
                ) : null}

                {/* Comparison Row */}
                <View style={styles.comparisonContainer}>
                    {/* Actual */}
                    <View style={styles.comparisonCol}>
                        <Text style={[styles.colHeader, { color: theme.textSecondary }]}>YOU ATE</Text>
                        <Card style={styles.miniCard}>
                            <Text style={[styles.mealName, { color: theme.text }]}>{scannedData.foods[0].name}</Text>
                            <Text style={[styles.mealCals, { color: Colors.primary[500] }]}>{scannedData.totalCalories.toFixed(0)} cal</Text>
                            <View style={styles.macroRow}>
                                <Text style={styles.macro}>P: {scannedData.totalProtein}g</Text>
                                <Text style={styles.macro}>C: {scannedData.totalCarbs}g</Text>
                            </View>
                        </Card>
                    </View>

                    {/* Vs */}
                    <View style={styles.vsContainer}>
                        <Text style={styles.vsText}>VS</Text>
                    </View>

                    {/* Planned */}
                    <View style={styles.comparisonCol}>
                        <Text style={[styles.colHeader, { color: theme.textSecondary }]}>PLANNED</Text>
                        {plannedMeal ? (
                            <Card style={styles.miniCard}>
                                <Text style={[styles.mealName, { color: theme.text }]}>{plannedMeal.name}</Text>
                                <Text style={[styles.mealCals, { color: Colors.secondary[500] }]}>{plannedMeal.macros.calories.toFixed(0)} cal</Text>
                                <View style={styles.macroRow}>
                                    <Text style={styles.macro}>P: {plannedMeal.macros.protein}g</Text>
                                    <Text style={styles.macro}>C: {plannedMeal.macros.carbs}g</Text>
                                </View>
                            </Card>
                        ) : (
                            <Card style={[styles.miniCard, styles.emptyPlan]}>
                                <Text style={[styles.mealName, { color: theme.textMuted }]}>No plan</Text>
                                <Text style={styles.mealName}>for {mealType}</Text>
                            </Card>
                        )}
                    </View>
                </View>

                {/* Action Button */}
                <Button
                    title="Confirm & Log Meal"
                    onPress={handleConfirmLog}
                    variant="primary"
                    style={{ marginTop: spacing.xl }}
                />
                <Button
                    title="Discard"
                    onPress={() => router.back()}
                    variant="ghost"
                    style={{ marginTop: spacing.sm }}
                />

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: spacing.md },
    title: { ...Typography.h3, marginBottom: spacing.lg, textAlign: 'center' },
    scoreCard: { marginBottom: spacing.xl, padding: spacing.lg },
    scoreHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    scoreCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
    scoreValue: { ...Typography.h3, fontWeight: '800' },
    scoreLabel: { ...Typography.label },
    feedbackContainer: { flex: 1 },
    feedbackTitle: { ...Typography.h4, marginBottom: spacing.xs },
    feedbackText: { ...Typography.body },
    comparisonContainer: { flexDirection: 'row', alignItems: 'center' },
    comparisonCol: { flex: 1 },
    colHeader: { ...Typography.label, textAlign: 'center', marginBottom: spacing.sm },
    miniCard: { padding: spacing.sm, minHeight: 100, justifyContent: 'center' },
    mealName: { ...Typography.bodySmall, fontWeight: '600', marginBottom: 4 },
    mealCals: { ...Typography.h4, marginBottom: 4 },
    macroRow: { flexDirection: 'row', gap: 8 },
    macro: { ...Typography.caption },
    vsContainer: { width: 30, alignItems: 'center' },
    vsText: { ...Typography.caption, fontWeight: '700', color: Colors.neutral[400] },
    emptyPlan: { alignItems: 'center', opacity: 0.7 },
});
