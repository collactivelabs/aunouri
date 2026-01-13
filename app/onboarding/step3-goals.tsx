/**
 * AuNouri - Onboarding Step 3: Health Goals
 * Collect weight goal and target
 */

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { borderRadius, spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { nutritionCalculator, WeightGoal } from '@/services/nutrition';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface GoalOption {
    value: WeightGoal;
    icon: string;
    title: string;
    description: string;
}

const GOAL_OPTIONS: GoalOption[] = [
    {
        value: 'lose',
        icon: 'trending-down-outline',
        title: 'Lose Weight',
        description: 'Healthy weight loss at ~0.5kg/week',
    },
    {
        value: 'maintain',
        icon: 'scale-outline',
        title: 'Maintain Weight',
        description: 'Keep your current weight stable',
    },
    {
        value: 'gain',
        icon: 'trending-up-outline',
        title: 'Gain Weight',
        description: 'Build muscle at ~0.3kg/week',
    },
];

export default function Step3Goals() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const params = useLocalSearchParams();

    const [goal, setGoal] = useState<WeightGoal | null>(null);
    const [targetWeight, setTargetWeight] = useState('');

    const currentWeight = parseFloat(params.weight as string) || 0;
    const showTargetWeight = goal === 'lose' || goal === 'gain';

    const handleNext = () => {
        if (!goal) return;

        router.push({
            pathname: '/onboarding/step4-cycle',
            params: {
                ...params,
                goal,
                targetWeight: targetWeight || params.weight,
            },
        });
    };

    const handleBack = () => {
        router.back();
    };

    // Calculate estimated time to goal
    const getEstimate = () => {
        if (!goal || goal === 'maintain' || !targetWeight) return null;
        const target = parseFloat(targetWeight);
        if (isNaN(target)) return null;

        const weeks = nutritionCalculator.estimateWeeksToGoal(currentWeight, target, goal);
        if (weeks <= 0) return null;

        return weeks < 4
            ? `~${weeks} weeks`
            : `~${Math.round(weeks / 4)} months`;
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
            >
                {/* Progress */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '50%' }]} />
                    </View>
                    <Text style={[styles.progressText, { color: theme.textMuted }]}>
                        Step 3 of 6
                    </Text>
                </View>

                {/* Header */}
                <View style={[styles.header, { marginBottom: spacing.xl }]}>
                    <View style={[styles.iconContainer, { backgroundColor: Colors.primary[500] + '20' }]}>
                        <Ionicons name="trophy-outline" size={32} color={Colors.primary[500]} />
                    </View>
                    <Text style={[styles.title, { color: theme.text }]}>
                        What's your goal?
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        We'll adjust your calorie target to help you succeed
                    </Text>
                </View>

                {/* Goal Options */}
                <View style={styles.options}>
                    {GOAL_OPTIONS.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            onPress={() => setGoal(option.value)}
                        >
                            <Card
                                style={[
                                    styles.optionCard,
                                    goal === option.value && styles.optionSelected,
                                ]}
                            >
                                <Ionicons name={option.icon as any} size={28} color={theme.text} style={{ marginRight: spacing.md }} />
                                <View style={styles.optionContent}>
                                    <Text style={[styles.optionTitle, { color: theme.text }]}>
                                        {option.title}
                                    </Text>
                                    <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>
                                        {option.description}
                                    </Text>
                                </View>
                                {goal === option.value && (
                                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary[500]} />
                                )}
                            </Card>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Target Weight (shown for lose/gain) */}
                {showTargetWeight && (
                    <Card style={styles.targetCard}>
                        <Text style={[styles.targetLabel, { color: theme.text }]}>
                            {goal === 'lose' ? 'Target weight' : 'Goal weight'}
                        </Text>
                        <View style={styles.targetRow}>
                            <TextInput
                                style={[
                                    styles.targetInput,
                                    { backgroundColor: theme.card, color: theme.text },
                                ]}
                                value={targetWeight}
                                onChangeText={setTargetWeight}
                                placeholder={String(currentWeight)}
                                placeholderTextColor={theme.textMuted}
                                keyboardType="decimal-pad"
                            />
                            <Text style={[styles.targetUnit, { color: theme.textMuted }]}>kg</Text>
                        </View>
                        {getEstimate() && (
                            <View style={styles.estimateRow}>
                                <Ionicons name="time-outline" size={16} color={Colors.primary[500]} />
                                <Text style={[styles.estimateText, { color: Colors.primary[500] }]}>
                                    Estimated: {getEstimate()}
                                </Text>
                            </View>
                        )}
                    </Card>
                )}

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Button
                    title="Next"
                    onPress={handleNext}
                    disabled={!goal}
                    style={styles.nextButton}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    content: { padding: spacing.lg },

    // Progress
    progressContainer: { marginBottom: spacing.xl },
    progressBar: {
        height: 4,
        backgroundColor: Colors.neutral[200],
        borderRadius: 2,
        marginBottom: spacing.xs,
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.primary[500],
        borderRadius: 2,
    },
    progressText: { ...Typography.caption, textAlign: 'center' },

    // Header
    header: { alignItems: 'center', marginBottom: spacing.xl },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    // emoji: { fontSize: 48, marginBottom: spacing.md },
    title: { ...Typography.h2, textAlign: 'center', marginBottom: spacing.sm },
    subtitle: { ...Typography.body, textAlign: 'center' },

    // Options
    options: { gap: spacing.md, marginBottom: spacing.lg },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
    },
    optionSelected: {
        borderWidth: 2,
        borderColor: Colors.primary[500],
    },
    // optionIcon: { fontSize: 32, marginRight: spacing.md },
    optionContent: { flex: 1 },
    optionTitle: { ...Typography.body, fontWeight: '600' },
    optionDesc: { ...Typography.caption },

    // Target weight
    targetCard: { padding: spacing.lg },
    targetLabel: { ...Typography.body, fontWeight: '600', marginBottom: spacing.sm },
    targetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    targetInput: {
        flex: 1,
        height: 50,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        fontSize: 18,
    },
    targetUnit: { ...Typography.body, minWidth: 30 },
    estimateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginTop: spacing.md,
    },
    estimateText: { ...Typography.caption, fontWeight: '500' },

    // Footer
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        paddingBottom: spacing.xl,
    },
    backButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.neutral[100],
    },
    nextButton: { flex: 1 },

    bottomSpacer: { height: 100 },
});
