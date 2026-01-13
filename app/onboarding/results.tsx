/**
 * AuNouri - Onboarding Results Screen
 * Shows personalized calorie goal and prompts for registration
 */

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { OnboardingData, onboardingStorage } from '@/services/onboardingStorage';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingResults() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const params = useLocalSearchParams();

    const [data, setData] = useState<OnboardingData | null>(null);

    useEffect(() => {
        completeOnboarding();
    }, []);

    const completeOnboarding = async () => {
        // Gather all params and complete onboarding
        const onboardingData = await onboardingStorage.completeOnboarding({
            age: parseInt(params.age as string),
            heightCm: parseFloat(params.height as string),
            weightKg: parseFloat(params.weight as string),
            biologicalSex: params.sex as 'female' | 'male',
            activityLevel: params.activityLevel as any,
            weightGoal: params.goal as any,
            targetWeightKg: parseFloat(params.targetWeight as string),
            trackCycle: params.trackCycle === 'true',
            cycleLength: parseInt(params.cycleLength as string),
            trackSymptoms: params.trackSymptoms === 'true',
            isDiabetic: params.isDiabetic === 'true',
            diabetesType: params.diabetesType as any || undefined,
            usesInsulin: params.usesInsulin === 'true',
            dietaryPreferences: params.dietaryPrefs ? (params.dietaryPrefs as string).split(',').filter(Boolean) : [],
            allergies: params.allergies ? (params.allergies as string).split(',').filter(Boolean) : [],
        });
        setData(onboardingData);
    };

    const handleCreateAccount = () => {
        router.replace('/(auth)/register');
    };

    const handleSignIn = () => {
        router.replace('/(auth)/login');
    };

    const handleContinueAsGuest = () => {
        router.replace('/(tabs)');
    };

    if (!data) return null;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
            >
                {/* Success Header */}
                <View style={styles.header}>
                    <View style={styles.checkCircle}>
                        <Ionicons name="checkmark" size={48} color="#fff" />
                    </View>
                    <Text style={[styles.title, { color: theme.text }]}>
                        Your plan is ready! 🎉
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Based on your profile, here's your personalized nutrition goal
                    </Text>
                </View>

                {/* Main Calorie Card */}
                <Card style={styles.calorieCard}>
                    <Text style={[styles.calorieLabel, { color: theme.textSecondary }]}>
                        Daily Calorie Goal
                    </Text>
                    <Text style={[styles.calorieValue, { color: Colors.primary[500] }]}>
                        {data.calorieGoal.toLocaleString()}
                    </Text>
                    <Text style={[styles.calorieUnit, { color: theme.textMuted }]}>
                        calories per day
                    </Text>

                    {/* Macros */}
                    <View style={styles.macroRow}>
                        <View style={styles.macroItem}>
                            <Text style={[styles.macroValue, { color: Colors.secondary[500] }]}>
                                {data.proteinGoal}g
                            </Text>
                            <Text style={[styles.macroLabel, { color: theme.textMuted }]}>
                                Protein
                            </Text>
                        </View>
                        <View style={[styles.macroDivider, { backgroundColor: theme.border }]} />
                        <View style={styles.macroItem}>
                            <Text style={[styles.macroValue, { color: Colors.primary[500] }]}>
                                {data.carbsGoal}g
                            </Text>
                            <Text style={[styles.macroLabel, { color: theme.textMuted }]}>
                                Carbs
                            </Text>
                        </View>
                        <View style={[styles.macroDivider, { backgroundColor: theme.border }]} />
                        <View style={styles.macroItem}>
                            <Text style={[styles.macroValue, { color: Colors.tertiary[500] }]}>
                                {data.fatGoal}g
                            </Text>
                            <Text style={[styles.macroLabel, { color: theme.textMuted }]}>
                                Fat
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Features Unlock Card */}
                <Card style={styles.unlockCard}>
                    <Text style={[styles.unlockTitle, { color: theme.text }]}>
                        🔓 Create an account to unlock
                    </Text>
                    <View style={styles.featureList}>
                        <View style={styles.featureItem}>
                            <Ionicons name="camera" size={20} color={Colors.primary[500]} />
                            <Text style={[styles.featureText, { color: theme.text }]}>
                                Unlimited meal scanning
                            </Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="people" size={20} color={Colors.primary[500]} />
                            <Text style={[styles.featureText, { color: theme.text }]}>
                                Friends & encouragement
                            </Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="fitness" size={20} color={Colors.primary[500]} />
                            <Text style={[styles.featureText, { color: theme.text }]}>
                                Health data sync
                            </Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="cloud" size={20} color={Colors.primary[500]} />
                            <Text style={[styles.featureText, { color: theme.text }]}>
                                Sync across devices
                            </Text>
                        </View>
                    </View>
                </Card>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* CTA Buttons */}
            <View style={styles.footer}>
                <Button
                    title="Create Free Account"
                    onPress={handleCreateAccount}
                    style={styles.primaryButton}
                />
                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleSignIn}
                >
                    <Text style={[styles.secondaryText, { color: Colors.primary[500] }]}>
                        Already have an account? Sign In
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.guestButton}
                    onPress={handleContinueAsGuest}
                >
                    <Text style={[styles.guestText, { color: theme.textMuted }]}>
                        Continue as Guest (limited features)
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    content: { padding: spacing.lg },

    // Header
    header: { alignItems: 'center', marginBottom: spacing.xl },
    checkCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary[500],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: { ...Typography.h2, textAlign: 'center', marginBottom: spacing.sm },
    subtitle: { ...Typography.body, textAlign: 'center' },

    // Calorie Card
    calorieCard: { alignItems: 'center', padding: spacing.xl, marginBottom: spacing.lg },
    calorieLabel: { ...Typography.caption, marginBottom: spacing.xs },
    calorieValue: { fontSize: 56, fontWeight: '700' },
    calorieUnit: { ...Typography.body, marginBottom: spacing.lg },

    // Macros
    macroRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        width: '100%',
        paddingTop: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.neutral[200],
    },
    macroItem: { alignItems: 'center' },
    macroValue: { ...Typography.h3, fontWeight: '600' },
    macroLabel: { ...Typography.caption },
    macroDivider: { width: 1, height: 40 },

    // Unlock Card
    unlockCard: { padding: spacing.lg, marginBottom: spacing.xl },
    unlockTitle: { ...Typography.h4, marginBottom: spacing.md },
    featureList: { gap: spacing.sm },
    featureItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    featureText: { ...Typography.body },

    // Footer
    footer: {
        padding: spacing.lg,
        paddingBottom: spacing.xl,
        gap: spacing.md,
    },
    primaryButton: { width: '100%' },
    secondaryButton: {
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    secondaryText: { ...Typography.body, fontWeight: '600' },
    guestButton: {
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    guestText: { ...Typography.caption },

    bottomSpacer: { height: 50 },
});
