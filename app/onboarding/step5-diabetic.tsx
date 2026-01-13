/**
 * AuNouri - Onboarding Step 5: Diabetic Check
 * Collect diabetes status for personalized meal recommendations
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
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type DiabetesStatus = 'yes' | 'prediabetic' | 'no' | null;
type DiabetesType = 'type1' | 'type2' | 'gestational' | null;

export default function Step5Diabetic() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const params = useLocalSearchParams();

    const [diabetesStatus, setDiabetesStatus] = useState<DiabetesStatus>(null);
    const [diabetesType, setDiabetesType] = useState<DiabetesType>(null);
    const [usesInsulin, setUsesInsulin] = useState(false);

    const handleNext = () => {
        router.push({
            pathname: '/onboarding/step6-diet',
            params: {
                ...params,
                isDiabetic: diabetesStatus === 'yes' ? 'true' : 'false',
                diabetesType: diabetesStatus === 'yes' ? diabetesType : (diabetesStatus === 'prediabetic' ? 'prediabetic' : ''),
                usesInsulin: usesInsulin ? 'true' : 'false',
            },
        });
    };

    const handleBack = () => {
        router.back();
    };

    const canProceed = diabetesStatus !== null &&
        (diabetesStatus !== 'yes' || diabetesType !== null);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
            >
                {/* Progress */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '83%' }]} />
                    </View>
                    <Text style={[styles.progressText, { color: theme.textMuted }]}>
                        Step 5 of 6
                    </Text>
                </View>

                {/* Header */}
                <View style={[styles.header, { marginBottom: spacing.xl }]}>
                    <View style={[styles.iconContainer, { backgroundColor: Colors.secondary[500] + '20' }]}>
                        <Ionicons name="medical-outline" size={32} color={Colors.secondary[500]} />
                    </View>
                    <Text style={[styles.title, { color: theme.text }]}>
                        Diabetes check
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Help us personalize your meal recommendations for better blood sugar management
                    </Text>
                </View>

                {/* Diabetes Status Options */}
                <View style={styles.options}>
                    <TouchableOpacity onPress={() => setDiabetesStatus('yes')}>
                        <Card
                            style={[
                                styles.optionCard,
                                diabetesStatus === 'yes' && styles.optionSelected,
                            ]}
                        >
                            <Ionicons name="checkmark-circle-outline" size={32} color={Colors.primary[500]} style={{ marginRight: spacing.md }} />
                            <View style={styles.optionContent}>
                                <Text style={[styles.optionTitle, { color: theme.text }]}>
                                    Yes, I have diabetes
                                </Text>
                                <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>
                                    Get lower-carb meal recommendations
                                </Text>
                            </View>
                            {diabetesStatus === 'yes' && (
                                <Ionicons name="checkmark-circle" size={24} color={Colors.primary[500]} />
                            )}
                        </Card>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setDiabetesStatus('prediabetic')}>
                        <Card
                            style={[
                                styles.optionCard,
                                diabetesStatus === 'prediabetic' && styles.optionSelected,
                            ]}
                        >
                            <Ionicons name="warning-outline" size={32} color={Colors.secondary[500]} style={{ marginRight: spacing.md }} />
                            <View style={styles.optionContent}>
                                <Text style={[styles.optionTitle, { color: theme.text }]}>
                                    I'm pre-diabetic
                                </Text>
                                <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>
                                    Balanced recommendations to help prevent progression
                                </Text>
                            </View>
                            {diabetesStatus === 'prediabetic' && (
                                <Ionicons name="checkmark-circle" size={24} color={Colors.primary[500]} />
                            )}
                        </Card>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setDiabetesStatus('no')}>
                        <Card
                            style={[
                                styles.optionCard,
                                diabetesStatus === 'no' && styles.optionSelected,
                            ]}
                        >
                            <Ionicons name="close-circle-outline" size={32} color={theme.textMuted} style={{ marginRight: spacing.md }} />
                            <View style={styles.optionContent}>
                                <Text style={[styles.optionTitle, { color: theme.text }]}>
                                    No, I don't have diabetes
                                </Text>
                                <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>
                                    Standard nutrition recommendations
                                </Text>
                            </View>
                            {diabetesStatus === 'no' && (
                                <Ionicons name="checkmark-circle" size={24} color={Colors.primary[500]} />
                            )}
                        </Card>
                    </TouchableOpacity>
                </View>

                {/* Diabetes Type (if diabetic) */}
                {diabetesStatus === 'yes' && (
                    <Card style={styles.detailsCard}>
                        <Text style={[styles.label, { color: theme.text }]}>
                            What type of diabetes do you have?
                        </Text>
                        <View style={styles.typeOptions}>
                            <TouchableOpacity
                                style={[
                                    styles.typeChip,
                                    diabetesType === 'type1' && styles.typeChipSelected,
                                    { borderColor: diabetesType === 'type1' ? Colors.primary[500] : theme.border },
                                ]}
                                onPress={() => setDiabetesType('type1')}
                            >
                                <Text
                                    style={[
                                        styles.typeChipText,
                                        { color: diabetesType === 'type1' ? Colors.primary[500] : theme.text },
                                    ]}
                                >
                                    Type 1
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.typeChip,
                                    diabetesType === 'type2' && styles.typeChipSelected,
                                    { borderColor: diabetesType === 'type2' ? Colors.primary[500] : theme.border },
                                ]}
                                onPress={() => setDiabetesType('type2')}
                            >
                                <Text
                                    style={[
                                        styles.typeChipText,
                                        { color: diabetesType === 'type2' ? Colors.primary[500] : theme.text },
                                    ]}
                                >
                                    Type 2
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.typeChip,
                                    diabetesType === 'gestational' && styles.typeChipSelected,
                                    { borderColor: diabetesType === 'gestational' ? Colors.primary[500] : theme.border },
                                ]}
                                onPress={() => setDiabetesType('gestational')}
                            >
                                <Text
                                    style={[
                                        styles.typeChipText,
                                        { color: diabetesType === 'gestational' ? Colors.primary[500] : theme.text },
                                    ]}
                                >
                                    Gestational
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.toggleRow}
                            onPress={() => setUsesInsulin(!usesInsulin)}
                        >
                            <View style={styles.toggleContent}>
                                <Text style={[styles.toggleLabel, { color: theme.text }]}>
                                    Do you use insulin or medication?
                                </Text>
                                <Text style={[styles.toggleHint, { color: theme.textSecondary }]}>
                                    Helps us time meal recommendations better
                                </Text>
                            </View>
                            <Ionicons
                                name={usesInsulin ? 'checkbox' : 'square-outline'}
                                size={24}
                                color={usesInsulin ? Colors.primary[500] : theme.textMuted}
                            />
                        </TouchableOpacity>
                    </Card>
                )}

                {/* Info note */}
                {(diabetesStatus === 'yes' || diabetesStatus === 'prediabetic') && (
                    <View style={styles.infoCard}>
                        <Ionicons name="information-circle" size={20} color={Colors.secondary[500]} />
                        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                            We'll recommend meals with lower glycemic impact and balanced carbohydrates to help manage blood sugar levels.
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
                    disabled={!canProceed}
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
    // optionIcon: { fontSize: 28, marginRight: spacing.md },
    optionContent: { flex: 1 },
    optionTitle: { ...Typography.body, fontWeight: '600' },
    optionDesc: { ...Typography.caption },

    // Details
    detailsCard: { padding: spacing.lg, marginBottom: spacing.md },
    label: { ...Typography.body, fontWeight: '600', marginBottom: spacing.md },
    typeOptions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
    typeChip: {
        flex: 1,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderWidth: 1.5,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    typeChipSelected: {
        backgroundColor: Colors.primary[500] + '10',
    },
    typeChipText: { ...Typography.caption, fontWeight: '500' },

    // Toggle
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    toggleContent: { flex: 1 },
    toggleLabel: { ...Typography.body, fontWeight: '600' },
    toggleHint: { ...Typography.caption },

    // Info
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        padding: spacing.md,
        backgroundColor: Colors.secondary[500] + '10',
        borderRadius: borderRadius.md,
    },
    infoText: { ...Typography.caption, flex: 1 },

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
