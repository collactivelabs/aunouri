/**
 * AuNouri - Onboarding Step 2: Activity Level
 * Collect activity level and exercise frequency
 */

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { ActivityLevel } from '@/services/nutrition';
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

interface ActivityOption {
    value: ActivityLevel;
    icon: string;
    title: string;
    description: string;
}

const ACTIVITY_OPTIONS: ActivityOption[] = [
    {
        value: 'sedentary',
        icon: '🪑',
        title: 'Sedentary',
        description: 'Little or no exercise, desk job',
    },
    {
        value: 'light',
        icon: '🚶',
        title: 'Lightly Active',
        description: 'Light exercise 1-3 days/week',
    },
    {
        value: 'moderate',
        icon: '🏃',
        title: 'Moderately Active',
        description: 'Moderate exercise 3-5 days/week',
    },
    {
        value: 'active',
        icon: '💪',
        title: 'Very Active',
        description: 'Hard exercise 6-7 days/week',
    },
    {
        value: 'very_active',
        icon: '🏋️',
        title: 'Extremely Active',
        description: 'Very intense exercise or physical job',
    },
];

export default function Step2Activity() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const params = useLocalSearchParams();

    const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);

    const handleNext = () => {
        if (!activityLevel) return;

        router.push({
            pathname: '/onboarding/step3-goals',
            params: {
                ...params,
                activityLevel,
            },
        });
    };

    const handleBack = () => {
        router.back();
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
                        <View style={[styles.progressFill, { width: '33%' }]} />
                    </View>
                    <Text style={[styles.progressText, { color: theme.textMuted }]}>
                        Step 2 of 6
                    </Text>
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.emoji}>🏃‍♀️</Text>
                    <Text style={[styles.title, { color: theme.text }]}>
                        How active are you?
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        This helps us calculate how many calories you burn each day
                    </Text>
                </View>

                {/* Options */}
                <View style={styles.options}>
                    {ACTIVITY_OPTIONS.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            onPress={() => setActivityLevel(option.value)}
                        >
                            <Card
                                style={[
                                    styles.optionCard,
                                    activityLevel === option.value && styles.optionSelected,
                                ]}
                            >
                                <Text style={styles.optionIcon}>{option.icon}</Text>
                                <View style={styles.optionContent}>
                                    <Text style={[styles.optionTitle, { color: theme.text }]}>
                                        {option.title}
                                    </Text>
                                    <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>
                                        {option.description}
                                    </Text>
                                </View>
                                {activityLevel === option.value && (
                                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary[500]} />
                                )}
                            </Card>
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
                    title="Next"
                    onPress={handleNext}
                    disabled={!activityLevel}
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

    // Options
    options: { gap: spacing.md },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
    },
    optionSelected: {
        borderWidth: 2,
        borderColor: Colors.primary[500],
    },
    optionIcon: { fontSize: 32, marginRight: spacing.md },
    optionContent: { flex: 1 },
    optionTitle: { ...Typography.body, fontWeight: '600' },
    optionDesc: { ...Typography.caption },

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
