/**
 * AuNouri - Onboarding Step 6: Dietary Preferences
 * Collect dietary restrictions and preferences
 */

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { borderRadius, spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { nutritionCalculator } from '@/services/nutrition';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DietOption {
    id: string;
    icon: string;
    label: string;
}

const DIET_OPTIONS: DietOption[] = [
    { id: 'vegetarian', icon: '🥬', label: 'Vegetarian' },
    { id: 'vegan', icon: '🌱', label: 'Vegan' },
    { id: 'pescatarian', icon: '🐟', label: 'Pescatarian' },
    { id: 'keto', icon: '🥑', label: 'Keto' },
    { id: 'paleo', icon: '🥩', label: 'Paleo' },
    { id: 'gluten_free', icon: '🌾', label: 'Gluten-Free' },
    { id: 'dairy_free', icon: '🥛', label: 'Dairy-Free' },
    { id: 'halal', icon: '☪️', label: 'Halal' },
    { id: 'kosher', icon: '✡️', label: 'Kosher' },
];

const ALLERGY_OPTIONS: DietOption[] = [
    { id: 'nuts', icon: '🥜', label: 'Nuts' },
    { id: 'shellfish', icon: '🦐', label: 'Shellfish' },
    { id: 'eggs', icon: '🥚', label: 'Eggs' },
    { id: 'soy', icon: '🫛', label: 'Soy' },
    { id: 'wheat', icon: '🌾', label: 'Wheat' },
];

export default function Step6Diet() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const params = useLocalSearchParams();

    const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);
    const [allergies, setAllergies] = useState<string[]>([]);

    const toggleDiet = (id: string) => {
        setDietaryPrefs(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const toggleAllergy = (id: string) => {
        setAllergies(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleComplete = () => {
        // Navigate to results screen with all collected data
        // Pass through diabetic params from previous step
        router.push({
            pathname: '/onboarding/results',
            params: {
                ...params,
                dietaryPrefs: dietaryPrefs.join(','),
                allergies: allergies.join(','),
            },
        });
    };

    const handleBack = () => {
        router.back();
    };

    // Calculate preview calorie goal
    const previewCalories = nutritionCalculator.calculateCalorieGoal({
        age: parseInt(params.age as string) || 25,
        heightCm: parseFloat(params.height as string) || 165,
        weightKg: parseFloat(params.weight as string) || 60,
        biologicalSex: (params.sex as 'female' | 'male') || 'female',
        activityLevel: (params.activityLevel as any) || 'moderate',
        weightGoal: (params.goal as any) || 'maintain',
    });

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
            >
                {/* Progress */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '100%' }]} />
                    </View>
                    <Text style={[styles.progressText, { color: theme.textMuted }]}>
                        Step 6 of 6
                    </Text>
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.emoji}>🍽️</Text>
                    <Text style={[styles.title, { color: theme.text }]}>
                        Dietary preferences
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Optional: Help us personalize your food recommendations
                    </Text>
                </View>

                {/* Calories Preview */}
                <Card style={styles.previewCard}>
                    <Text style={[styles.previewLabel, { color: theme.textSecondary }]}>
                        Your daily calorie goal
                    </Text>
                    <Text style={[styles.previewValue, { color: Colors.primary[500] }]}>
                        {previewCalories.toLocaleString()} cal
                    </Text>
                    <Text style={[styles.previewHint, { color: theme.textMuted }]}>
                        Calculated based on your profile and goals
                    </Text>
                </Card>

                {/* Dietary Restrictions */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Dietary restrictions
                </Text>
                <View style={styles.chipGrid}>
                    {DIET_OPTIONS.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.chip,
                                dietaryPrefs.includes(option.id) && styles.chipSelected,
                                { borderColor: dietaryPrefs.includes(option.id) ? Colors.primary[500] : theme.border },
                            ]}
                            onPress={() => toggleDiet(option.id)}
                        >
                            <Text style={styles.chipIcon}>{option.icon}</Text>
                            <Text
                                style={[
                                    styles.chipLabel,
                                    { color: dietaryPrefs.includes(option.id) ? Colors.primary[500] : theme.text },
                                ]}
                            >
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Allergies */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Food allergies
                </Text>
                <View style={styles.chipGrid}>
                    {ALLERGY_OPTIONS.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.chip,
                                allergies.includes(option.id) && styles.chipSelected,
                                { borderColor: allergies.includes(option.id) ? Colors.tertiary[500] : theme.border },
                            ]}
                            onPress={() => toggleAllergy(option.id)}
                        >
                            <Text style={styles.chipIcon}>{option.icon}</Text>
                            <Text
                                style={[
                                    styles.chipLabel,
                                    { color: allergies.includes(option.id) ? Colors.tertiary[500] : theme.text },
                                ]}
                            >
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Button
                    title="See My Results 🚀"
                    onPress={handleComplete}
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
    emoji: { fontSize: 48, marginBottom: spacing.md },
    title: { ...Typography.h2, textAlign: 'center', marginBottom: spacing.sm },
    subtitle: { ...Typography.body, textAlign: 'center' },

    // Preview
    previewCard: { alignItems: 'center', padding: spacing.lg, marginBottom: spacing.xl },
    previewLabel: { ...Typography.caption, marginBottom: spacing.xs },
    previewValue: { fontSize: 36, fontWeight: '700' },
    previewHint: { ...Typography.caption, marginTop: spacing.xs },

    // Section
    sectionTitle: { ...Typography.h4, marginBottom: spacing.md },

    // Chips
    chipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderWidth: 1.5,
        borderRadius: borderRadius.full,
    },
    chipSelected: {
        backgroundColor: Colors.primary[500] + '10',
    },
    chipIcon: { fontSize: 16 },
    chipLabel: { ...Typography.caption, fontWeight: '500' },

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

    // Loading
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        ...Typography.body,
        marginTop: spacing.md,
        color: Colors.neutral[600],
    },

    bottomSpacer: { height: 100 },
});
