/**
 * AuNouri - CyclePhaseIndicator Component
 * Shows current menstrual cycle phase with color coding
 */

import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { borderRadius, spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

interface CyclePhaseIndicatorProps {
    phase: CyclePhase;
    dayOfCycle: number;
    compact?: boolean;
}

const phaseInfo: Record<CyclePhase, { label: string; description: string; icon: string }> = {
    menstrual: {
        label: 'Menstrual',
        description: 'Rest & nourish',
        icon: '🌙',
    },
    follicular: {
        label: 'Follicular',
        description: 'Energy rising',
        icon: '🌱',
    },
    ovulatory: {
        label: 'Ovulatory',
        description: 'Peak energy',
        icon: '☀️',
    },
    luteal: {
        label: 'Luteal',
        description: 'Winding down',
        icon: '🍂',
    },
};

export function CyclePhaseIndicator({
    phase,
    dayOfCycle,
    compact = false,
}: CyclePhaseIndicatorProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    // Fallback to follicular if phase doesn't match
    const safePhase = phaseInfo[phase] ? phase : 'follicular';
    const info = phaseInfo[safePhase];
    const phaseColor = Colors.cyclePhases[safePhase] || Colors.primary[500];

    if (compact) {
        return (
            <View style={[styles.compactContainer, { backgroundColor: phaseColor + '20' }]}>
                <Text style={styles.icon}>{info.icon}</Text>
                <Text style={[styles.compactLabel, { color: phaseColor }]}>
                    Day {dayOfCycle}
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.card }]}>
            <View style={[styles.iconContainer, { backgroundColor: phaseColor + '20' }]}>
                <Text style={styles.largeIcon}>{info.icon}</Text>
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.phase, { color: phaseColor }]}>
                    {info.label} Phase
                </Text>
                <Text style={[styles.day, { color: theme.text }]}>
                    Day {dayOfCycle} of cycle
                </Text>
                <Text style={[styles.description, { color: theme.textSecondary }]}>
                    {info.description}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    largeIcon: {
        fontSize: 28,
    },
    textContainer: {
        flex: 1,
    },
    phase: {
        ...Typography.label,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    day: {
        ...Typography.h4,
        marginTop: 2,
    },
    description: {
        ...Typography.bodySmall,
        marginTop: 2,
    },
    // Compact styles
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.full,
    },
    icon: {
        fontSize: 14,
        marginRight: spacing.xs,
    },
    compactLabel: {
        ...Typography.caption,
        fontWeight: '600',
    },
});

export default CyclePhaseIndicator;
