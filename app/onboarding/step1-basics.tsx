/**
 * AuNouri - Onboarding Step 1: Basic Information
 * Collect age, height, weight, and biological sex
 */

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { borderRadius, spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type BiologicalSex = 'female' | 'male';

export default function Step1Basics() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [age, setAge] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [sex, setSex] = useState<BiologicalSex | null>(null);

    const isValid = age && height && weight && sex;

    const handleNext = () => {
        if (!isValid) return;

        router.push({
            pathname: '/onboarding/step2-activity',
            params: {
                age,
                height,
                weight,
                sex,
            },
        });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Progress */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: '17%' }]} />
                        </View>
                        <Text style={[styles.progressText, { color: theme.textMuted }]}>
                            Step 1 of 6
                        </Text>
                    </View>

                    {/* Header */}
                    <View style={[styles.header, { marginBottom: spacing.xl }]}>
                        <View style={[styles.iconContainer, { backgroundColor: Colors.primary[500] + '20' }]}>
                            <Ionicons name="hand-left-outline" size={32} color={Colors.primary[500]} />
                        </View>
                        <Text style={[styles.title, { color: theme.text }]}>
                            Let's get to know you
                        </Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                            We'll use this to calculate your personalized nutrition goals
                        </Text>
                    </View>

                    {/* Form */}
                    <Card style={styles.formCard}>
                        {/* Age */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.text }]}>Age</Text>
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        { backgroundColor: theme.card, color: theme.text },
                                    ]}
                                    value={age}
                                    onChangeText={setAge}
                                    placeholder="25"
                                    placeholderTextColor={theme.textMuted}
                                    keyboardType="number-pad"
                                    maxLength={3}
                                />
                                <Text style={[styles.unit, { color: theme.textMuted }]}>years</Text>
                            </View>
                        </View>

                        {/* Height */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.text }]}>Height</Text>
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        { backgroundColor: theme.card, color: theme.text },
                                    ]}
                                    value={height}
                                    onChangeText={setHeight}
                                    placeholder="165"
                                    placeholderTextColor={theme.textMuted}
                                    keyboardType="number-pad"
                                    maxLength={3}
                                />
                                <Text style={[styles.unit, { color: theme.textMuted }]}>cm</Text>
                            </View>
                        </View>

                        {/* Weight */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.text }]}>Weight</Text>
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        { backgroundColor: theme.card, color: theme.text },
                                    ]}
                                    value={weight}
                                    onChangeText={setWeight}
                                    placeholder="60"
                                    placeholderTextColor={theme.textMuted}
                                    keyboardType="decimal-pad"
                                    maxLength={5}
                                />
                                <Text style={[styles.unit, { color: theme.textMuted }]}>kg</Text>
                            </View>
                        </View>

                        {/* Biological Sex */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.text }]}>Biological Sex</Text>
                            <Text style={[styles.hint, { color: theme.textMuted }]}>
                                Used for accurate metabolism calculations
                            </Text>
                            <View style={styles.sexOptions}>
                                <TouchableOpacity
                                    style={[
                                        styles.sexOption,
                                        sex === 'female' && styles.sexOptionSelected,
                                        { borderColor: sex === 'female' ? Colors.primary[500] : theme.border },
                                    ]}
                                    onPress={() => setSex('female')}
                                >
                                    <Ionicons name="female-outline" size={24} color={sex === 'female' ? Colors.primary[500] : theme.text} />
                                    <Text style={[styles.sexLabel, { color: theme.text }]}>Female</Text>
                                    {sex === 'female' && (
                                        <Ionicons name="checkmark-circle" size={20} color={Colors.primary[500]} />
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.sexOption,
                                        sex === 'male' && styles.sexOptionSelected,
                                        { borderColor: sex === 'male' ? Colors.primary[500] : theme.border },
                                    ]}
                                    onPress={() => setSex('male')}
                                >
                                    <Ionicons name="male-outline" size={24} color={sex === 'male' ? Colors.primary[500] : theme.text} />
                                    <Text style={[styles.sexLabel, { color: theme.text }]}>Male</Text>
                                    {sex === 'male' && (
                                        <Ionicons name="checkmark-circle" size={20} color={Colors.primary[500]} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Card>

                    <View style={styles.bottomSpacer} />
                </ScrollView>

                {/* Next Button */}
                <View style={styles.footer}>
                    <Button
                        title="Next"
                        onPress={handleNext}
                        disabled={!isValid}
                        style={styles.nextButton}
                    />
                </View>
            </KeyboardAvoidingView >
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    keyboardView: { flex: 1 },
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

    // Form
    formCard: { padding: spacing.lg },
    inputGroup: { marginBottom: spacing.lg },
    label: { ...Typography.body, fontWeight: '600', marginBottom: spacing.xs },
    hint: { ...Typography.caption, marginBottom: spacing.sm },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    input: {
        flex: 1,
        height: 50,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        fontSize: 18,
    },
    unit: { ...Typography.body, minWidth: 40 },

    // Sex options
    sexOptions: { flexDirection: 'row', gap: spacing.md },
    sexOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderWidth: 2,
        borderRadius: borderRadius.lg,
    },
    sexOptionSelected: {
        backgroundColor: Colors.primary[500] + '10',
    },
    // sexIcon: { fontSize: 24 },
    sexLabel: { ...Typography.body, fontWeight: '500' },

    // Footer
    footer: {
        padding: spacing.lg,
        paddingBottom: spacing.xl,
    },
    nextButton: { width: '100%' },

    bottomSpacer: { height: 100 },
});
