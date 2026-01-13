/**
 * AuNouri - Onboarding Step 4: Cycle Information
 * Collect cycle length, last period, and symptom tracking preferences
 */

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { borderRadius, spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
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

export default function Step4Cycle() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const params = useLocalSearchParams();

    const [trackCycle, setTrackCycle] = useState<boolean | null>(null);
    const [cycleLength, setCycleLength] = useState('28');
    const [trackSymptoms, setTrackSymptoms] = useState(true);

    const handleNext = () => {
        router.push({
            pathname: '/onboarding/step5-diabetic',
            params: {
                ...params,
                trackCycle: trackCycle ? 'true' : 'false',
                cycleLength: trackCycle ? cycleLength : '0',
                trackSymptoms: trackSymptoms ? 'true' : 'false',
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
                        <View style={[styles.progressFill, { width: '67%' }]} />
                    </View>
                    <Text style={[styles.progressText, { color: theme.textMuted }]}>
                        Step 4 of 6
                    </Text>
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.emoji}>🌸</Text>
                    <Text style={[styles.title, { color: theme.text }]}>
                        Cycle tracking
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Sync your nutrition with your cycle phases for better results
                    </Text>
                </View>

                {/* Track Cycle Option */}
                <View style={styles.options}>
                    <TouchableOpacity onPress={() => setTrackCycle(true)}>
                        <Card
                            style={[
                                styles.optionCard,
                                trackCycle === true && styles.optionSelected,
                            ]}
                        >
                            <Text style={styles.optionIcon}>✅</Text>
                            <View style={styles.optionContent}>
                                <Text style={[styles.optionTitle, { color: theme.text }]}>
                                    Yes, track my cycle
                                </Text>
                                <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>
                                    Get phase-specific nutrition tips and energy insights
                                </Text>
                            </View>
                            {trackCycle === true && (
                                <Ionicons name="checkmark-circle" size={24} color={Colors.primary[500]} />
                            )}
                        </Card>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setTrackCycle(false)}>
                        <Card
                            style={[
                                styles.optionCard,
                                trackCycle === false && styles.optionSelected,
                            ]}
                        >
                            <Text style={styles.optionIcon}>⏭️</Text>
                            <View style={styles.optionContent}>
                                <Text style={[styles.optionTitle, { color: theme.text }]}>
                                    Skip for now
                                </Text>
                                <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>
                                    You can enable this later in settings
                                </Text>
                            </View>
                            {trackCycle === false && (
                                <Ionicons name="checkmark-circle" size={24} color={Colors.primary[500]} />
                            )}
                        </Card>
                    </TouchableOpacity>
                </View>

                {/* Cycle Details (if tracking) */}
                {trackCycle === true && (
                    <Card style={styles.detailsCard}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.text }]}>
                                Average cycle length
                            </Text>
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        { backgroundColor: theme.card, color: theme.text },
                                    ]}
                                    value={cycleLength}
                                    onChangeText={setCycleLength}
                                    placeholder="28"
                                    placeholderTextColor={theme.textMuted}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                />
                                <Text style={[styles.unit, { color: theme.textMuted }]}>days</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.toggleRow}
                            onPress={() => setTrackSymptoms(!trackSymptoms)}
                        >
                            <View style={styles.toggleContent}>
                                <Text style={[styles.toggleLabel, { color: theme.text }]}>
                                    Track symptoms
                                </Text>
                                <Text style={[styles.toggleHint, { color: theme.textSecondary }]}>
                                    Log cramps, mood, energy levels
                                </Text>
                            </View>
                            <Ionicons
                                name={trackSymptoms ? 'checkbox' : 'square-outline'}
                                size={24}
                                color={trackSymptoms ? Colors.primary[500] : theme.textMuted}
                            />
                        </TouchableOpacity>
                    </Card>
                )}

                {/* Benefits note */}
                {trackCycle === true && (
                    <View style={styles.benefitsCard}>
                        <Ionicons name="sparkles" size={20} color={Colors.tertiary[500]} />
                        <Text style={[styles.benefitsText, { color: theme.textSecondary }]}>
                            Cycle-aware nutrition helps optimize energy, cravings, and recovery throughout your month.
                        </Text>
                    </View>
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
                    disabled={trackCycle === null}
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
    optionIcon: { fontSize: 28, marginRight: spacing.md },
    optionContent: { flex: 1 },
    optionTitle: { ...Typography.body, fontWeight: '600' },
    optionDesc: { ...Typography.caption },

    // Details
    detailsCard: { padding: spacing.lg, marginBottom: spacing.md },
    inputGroup: { marginBottom: spacing.lg },
    label: { ...Typography.body, fontWeight: '600', marginBottom: spacing.sm },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    input: {
        width: 80,
        height: 50,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        fontSize: 18,
        textAlign: 'center',
    },
    unit: { ...Typography.body },

    // Toggle
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    toggleContent: { flex: 1 },
    toggleLabel: { ...Typography.body, fontWeight: '600' },
    toggleHint: { ...Typography.caption },

    // Benefits
    benefitsCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        padding: spacing.md,
        backgroundColor: Colors.tertiary[500] + '10',
        borderRadius: borderRadius.md,
    },
    benefitsText: { ...Typography.caption, flex: 1 },

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
