/**
 * AuNouri - Wellness Report Screen
 * Comprehensive health insights and progress tracking
 */

import { Card } from '@/components/ui/Card';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { borderRadius, spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/services/notificationService';
import { trackingService, WellnessReport } from '@/services/trackingService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WellnessReportScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { user, userProfile } = useAuth();

    const [report, setReport] = useState<WellnessReport | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReport();
        // Ensure weight reminder is scheduled
        notificationService.scheduleWeightReminder();
    }, [user]);

    const loadReport = async () => {
        if (!user) return;
        try {
            const data = await trackingService.generateWellnessReport(user.uid);
            setReport(data);
        } catch (error) {
            if (__DEV__) console.error('Failed to load wellness report:', error);
            Alert.alert('Error', 'Could not generate report.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary[500]} />
                    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Generating Insights...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!report) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: theme.text }]}>Wellness Report</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.center}>
                    <Text style={{ color: theme.textMuted }}>No data available for report.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Wellness Report</Text>
                <TouchableOpacity onPress={loadReport}>
                    <Ionicons name="refresh" size={24} color={Colors.primary[500]} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* 1. Overview / Adherence Score */}
                <Card style={styles.scoreCard}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Weekly Adherence</Text>
                    <View style={styles.scoreContainer}>
                        <View style={[styles.scoreCircle, { borderColor: getScoreColor(report.adherenceScore) }]}>
                            <Text style={[styles.scoreValue, { color: theme.text }]}>{report.adherenceScore}%</Text>
                            <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>Score</Text>
                        </View>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: theme.text }]}>{report.exerciseFrequency}</Text>
                                <Text style={[styles.statLabel, { color: theme.textMuted }]}>Workouts</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: theme.text }]}>{report.avgWater}</Text>
                                <Text style={[styles.statLabel, { color: theme.textMuted }]}>Avg Water (ml)</Text>
                            </View>
                        </View>
                    </View>
                </Card>



                {/* Weight Progress */}
                <Text style={[styles.sectionHeader, { color: theme.text }]}>Weight Progress</Text>
                <Card style={styles.chartCard}>
                    {report.todayWeight ? (
                        <>
                            <View style={styles.weightRow}>
                                <View style={styles.weightItem}>
                                    <Text style={[styles.weightLabel, { color: theme.textMuted }]}>Start</Text>
                                    <Text style={[styles.weightValue, { color: theme.text }]}>{report.startWeight || '-'}kg</Text>
                                </View>
                                <Ionicons name="arrow-forward" size={20} color={theme.textMuted} />
                                <View style={styles.weightItem}>
                                    <Text style={[styles.weightLabel, { color: theme.textMuted }]}>Current</Text>
                                    <Text style={[styles.weightValue, { color: Colors.primary[500] }]}>{report.todayWeight}kg</Text>
                                </View>
                                {report.goalWeight && (
                                    <>
                                        <Ionicons name="arrow-forward" size={20} color={theme.textMuted} />
                                        <View style={styles.weightItem}>
                                            <Text style={[styles.weightLabel, { color: theme.textMuted }]}>Goal</Text>
                                            <Text style={[styles.weightValue, { color: Colors.secondary[500] }]}>{report.goalWeight}kg</Text>
                                        </View>
                                    </>
                                )}
                            </View>

                            {/* Simple Progress Bar if goal exists */}
                            {report.goalWeight && report.startWeight && (
                                <View style={styles.weightProgressContainer}>
                                    <View style={[styles.progressBarBg, { height: 12 }]}>
                                        <View style={[styles.progressBarFill, {
                                            width: `${Math.min(Math.max(
                                                ((report.startWeight - report.todayWeight) / (report.startWeight - report.goalWeight)) * 100
                                                , 5), 100)}%`,
                                            backgroundColor: Colors.primary[500]
                                        }]} />
                                    </View>
                                    <Text style={[styles.progressText, { color: theme.textMuted }]}>
                                        {Math.round(((report.startWeight - report.todayWeight) / (report.startWeight - report.goalWeight)) * 100)}% to goal
                                    </Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.logWeightBtn, { backgroundColor: theme.background }]}
                                onPress={() => {
                                    Alert.prompt(
                                        "Log Weight",
                                        "Enter your current weight in kg:",
                                        [
                                            { text: "Cancel", style: "cancel" },
                                            {
                                                text: "Save",
                                                onPress: async (val: string | undefined) => {
                                                    const w = parseFloat(val || '0');
                                                    if (w > 0 && user) {
                                                        await trackingService.logWeight(user.uid, w);
                                                        loadReport();
                                                    }
                                                }
                                            }
                                        ],
                                        "plain-text",
                                        report.todayWeight?.toString(),
                                        "numeric"
                                    );
                                }}
                            >
                                <Text style={[styles.logWeightText, { color: theme.text }]}>Update Weight</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={{ alignItems: 'center', padding: spacing.md }}>
                            <Ionicons name="scale-outline" size={48} color={theme.textMuted} style={{ marginBottom: spacing.sm }} />
                            <Text style={{ color: theme.textMuted, textAlign: 'center', marginBottom: spacing.md }}>
                                No weight logged yet. Start tracking to see your progress!
                            </Text>
                            <TouchableOpacity
                                style={[styles.logWeightBtn, { backgroundColor: theme.background, minWidth: 120 }]}
                                onPress={() => {
                                    Alert.prompt(
                                        "Log Current Weight",
                                        "Enter your current weight in kg:",
                                        [
                                            { text: "Cancel", style: "cancel" },
                                            {
                                                text: "Save",
                                                onPress: async (val: string | undefined) => {
                                                    const w = parseFloat(val || '0');
                                                    if (w > 0 && user) {
                                                        await trackingService.logWeight(user.uid, w);
                                                        loadReport();
                                                    }
                                                }
                                            }
                                        ],
                                        "plain-text",
                                        report.startWeight?.toString(),
                                        "numeric"
                                    );
                                }}
                            >
                                <Text style={[styles.logWeightText, { color: theme.text }]}>Log Weight</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </Card>

                {/* 2. Goal vs Actual Charts */}
                <Text style={[styles.sectionHeader, { color: theme.text }]}>Nutrition Baseline</Text>
                <Card style={styles.chartCard}>
                    <ChartRow
                        label="Avg Calories"
                        value={report.avgCalories}
                        target={userProfile?.calorieGoal || 2000}
                        unit="cal"
                        color={Colors.primary[500]}
                        theme={theme}
                    />
                    <ChartRow
                        label="Avg Protein"
                        value={report.avgProtein}
                        target={userProfile?.proteinGoal || 100}
                        unit="g"
                        color={Colors.secondary[500]}
                        theme={theme}
                    />
                </Card>

                {/* 3. AI Insights */}
                <Text style={[styles.sectionHeader, { color: theme.text }]}>Insights for You</Text>
                {report.insights.map((insight, index) => (
                    <Card key={index} style={styles.insightCard}>
                        <Ionicons name="bulb-outline" size={24} color={Colors.tertiary[500]} style={styles.insightIcon} />
                        <Text style={[styles.insightText, { color: theme.text }]}>
                            {insight}
                        </Text>
                    </Card>
                ))}

                {report.insights.length === 0 && (
                    <Text style={{ color: theme.textMuted, fontStyle: 'italic' }}>
                        Log more meals to unlock personalized insights.
                    </Text>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView >
    );
}

function ChartRow({ label, value, target, unit, color, theme }: any) {
    const percentage = Math.min((value / target) * 100, 100);

    return (
        <View style={styles.chartRow}>
            <View style={styles.chartLabelRow}>
                <Text style={[styles.chartLabel, { color: theme.text }]}>{label}</Text>
                <Text style={[styles.chartValue, { color: theme.textSecondary }]}>
                    {value} / {target} {unit}
                </Text>
            </View>
            <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
            </View>
        </View>
    );
}

function getScoreColor(score: number) {
    if (score >= 80) return Colors.primary[500];
    if (score >= 50) return Colors.secondary[500];
    return Colors.tertiary[500];
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: spacing.md, ...Typography.body },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    title: { ...Typography.h3 },
    content: { padding: spacing.md },

    // Overview
    scoreCard: { alignItems: 'center', padding: spacing.lg, marginBottom: spacing.lg },
    cardTitle: { ...Typography.h4, marginBottom: spacing.lg },
    scoreContainer: { alignItems: 'center', width: '100%' },
    scoreCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    scoreValue: { ...Typography.h1, fontSize: 36 },
    scoreLabel: { ...Typography.caption, textTransform: 'uppercase', letterSpacing: 1 },

    statsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: spacing.xl },
    statItem: { alignItems: 'center' },
    statValue: { ...Typography.h3, fontWeight: '700' },
    statLabel: { ...Typography.caption },
    statDivider: { width: 1, height: '100%', backgroundColor: Colors.neutral[200] },

    // Charts
    sectionHeader: { ...Typography.h4, marginBottom: spacing.sm },
    chartCard: { marginBottom: spacing.lg },
    chartRow: { marginBottom: spacing.md },
    chartLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
    chartLabel: { ...Typography.body, fontWeight: '600' },
    chartValue: { ...Typography.caption },
    progressBarBg: { height: 8, backgroundColor: Colors.neutral[100], borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 4 },

    // Insights
    insightCard: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
    insightIcon: { marginRight: spacing.md, marginTop: 2 },
    insightText: { ...Typography.body, flex: 1, lineHeight: 22 },

    // Weight
    weightRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    weightItem: { alignItems: 'center' },
    weightLabel: { ...Typography.caption },
    weightValue: { ...Typography.h4, fontWeight: '700' },
    weightProgressContainer: { marginBottom: spacing.md },
    progressText: { ...Typography.caption, textAlign: 'center', marginTop: spacing.xs },
    logWeightBtn: { padding: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center' },
    logWeightText: { ...Typography.caption, fontWeight: '600' },
});
