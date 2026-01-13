/**
 * AuNouri - Cycle Tracking Screen
 * REAL menstrual cycle calendar with Firestore integration
 */

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CyclePhase, CyclePhaseIndicator } from '@/components/ui/CyclePhaseIndicator';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { borderRadius, spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { CycleInfo, cycleService, PeriodLog } from '@/services/cycle';
import { Ionicons } from '@expo/vector-icons';
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

interface DayInfo {
    day: number;
    date: Date;
    phase: CyclePhase;
    isPeriod: boolean;
    isToday: boolean;
    isFertile: boolean;
}

const phaseDescriptions: Record<CyclePhase, { title: string; tips: string[] }> = {
    menstrual: {
        title: 'Menstrual Phase (Days 1-5)',
        tips: [
            '🍫 Cravings are normal - opt for dark chocolate',
            '🥗 Focus on iron-rich foods (spinach, lentils)',
            '🧘 Gentle movement like yoga or walking',
            '💧 Stay hydrated to reduce bloating',
        ],
    },
    follicular: {
        title: 'Follicular Phase (Days 6-14)',
        tips: [
            '🏃‍♀️ Great time for intense workouts',
            '🥬 Load up on fresh vegetables',
            '🍳 Increase protein intake',
            '⚡ Energy is rising - try new activities!',
        ],
    },
    ovulatory: {
        title: 'Ovulatory Phase (Days 15-17)',
        tips: [
            '💪 Peak energy for high-intensity training',
            '🥑 Focus on fiber-rich foods',
            '🍓 Antioxidant-rich fruits are ideal',
            '🎯 Best time for challenging goals',
        ],
    },
    luteal: {
        title: 'Luteal Phase (Days 18-28)',
        tips: [
            '🍠 Complex carbs help with cravings',
            '🌰 Magnesium-rich foods (nuts, seeds)',
            '😴 Prioritize sleep and rest',
            '🏊 Low-impact exercise is best',
        ],
    },
};

export default function CycleScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null);
    const [recentPeriods, setRecentPeriods] = useState<PeriodLog[]>([]);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [loggingPeriod, setLoggingPeriod] = useState(false);

    const today = new Date();
    const currentMonth = today.toLocaleString('default', { month: 'long', year: 'numeric' });

    useEffect(() => {
        loadCycleData();
    }, [user]);

    const loadCycleData = async () => {
        const userId = user?.uid || 'demo-user';

        try {
            const [cycleData, periods] = await Promise.all([
                cycleService.getCycleInfo(userId),
                cycleService.getRecentPeriods(userId),
            ]);

            setCycleInfo(cycleData);
            setRecentPeriods(periods);
        } catch (error) {
            console.error('Failed to load cycle data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogPeriod = async () => {
        const userId = user?.uid || 'demo-user';

        // Use selected day or default to today
        const logDate = selectedDay
            ? new Date(today.getFullYear(), today.getMonth(), selectedDay)
            : today;

        const dateStr = logDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });

        setLoggingPeriod(true);

        try {
            await cycleService.logPeriodStart(userId, logDate, 'medium');
            Alert.alert('Period Logged! 🌸', `Period start recorded for ${dateStr}.`);
            loadCycleData();
            setSelectedDay(null); // Clear selection after logging
        } catch (error) {
            console.error('Failed to log period:', error);
            Alert.alert('Error', 'Could not log period. Please try again.');
        } finally {
            setLoggingPeriod(false);
        }
    };

    const getDaysInMonth = (): DayInfo[] => {
        const days: DayInfo[] = [];
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

        const cycleLength = 28; // TODO: Get from user settings
        const periodLength = 5;
        const currentDayOfCycle = cycleInfo?.dayOfCycle || 1;

        // Add empty cells for days before the 1st of month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push({
                day: 0,
                date: new Date(),
                phase: 'follicular' as CyclePhase,
                isPeriod: false,
                isToday: false,
                isFertile: false
            });
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const isToday = i === today.getDate();

            // Calculate what day of cycle this calendar day is
            const daysDiff = i - today.getDate();
            // Handle negative modulo properly
            let thisDayCycleDay = ((currentDayOfCycle + daysDiff - 1) % cycleLength) + 1;
            if (thisDayCycleDay <= 0) thisDayCycleDay += cycleLength;

            let phase: CyclePhase = 'follicular';
            let isPeriod = false;
            let isFertile = false;

            if (thisDayCycleDay >= 1 && thisDayCycleDay <= periodLength) {
                phase = 'menstrual';
                isPeriod = true;
            } else if (thisDayCycleDay >= 6 && thisDayCycleDay <= 14) {
                phase = 'follicular';
                isFertile = thisDayCycleDay >= 12;
            } else if (thisDayCycleDay >= 15 && thisDayCycleDay <= 17) {
                phase = 'ovulatory';
                isFertile = true;
            } else {
                phase = 'luteal';
            }

            days.push({ day: i, date, phase, isPeriod, isToday, isFertile });
        }
        return days;
    };

    const days = getDaysInMonth();
    const currentPhase = cycleInfo?.currentPhase || 'follicular';
    const phaseInfo = phaseDescriptions[currentPhase];

    // Calculate days until next period/fertile window
    const daysUntilPeriod = cycleInfo ?
        Math.ceil((cycleInfo.nextPeriodDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const daysUntilFertile = cycleInfo ?
        Math.ceil((cycleInfo.fertileWindowStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    const renderCalendarDay = (dayInfo: DayInfo, index: number) => {
        // Empty cell for calendar alignment
        if (dayInfo.day === 0) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
        }

        const phaseColor = Colors.cyclePhases[dayInfo.phase];
        const isSelected = selectedDay === dayInfo.day;

        return (
            <TouchableOpacity
                key={dayInfo.day}
                style={[
                    styles.dayCell,
                    dayInfo.isToday && { borderWidth: 2, borderColor: Colors.primary[500] },
                    isSelected && { backgroundColor: phaseColor + '30' },
                ]}
                onPress={() => setSelectedDay(dayInfo.day)}
            >
                <Text
                    style={[
                        styles.dayNumber,
                        { color: dayInfo.isToday ? Colors.primary[500] : theme.text },
                        dayInfo.isToday && { fontWeight: '700' },
                    ]}
                >
                    {dayInfo.day}
                </Text>
                {dayInfo.isPeriod && (
                    <View style={[styles.periodDot, { backgroundColor: Colors.cyclePhases.menstrual }]} />
                )}
                {dayInfo.isFertile && !dayInfo.isPeriod && (
                    <View style={[styles.periodDot, { backgroundColor: Colors.tertiary[500] }]} />
                )}
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary[500]} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Current Phase Card */}
                <Card variant="elevated" style={styles.phaseCard}>
                    <CyclePhaseIndicator
                        phase={currentPhase}
                        dayOfCycle={cycleInfo?.dayOfCycle || 1}
                    />
                </Card>

                {/* Prediction */}
                <Card style={styles.predictionCard}>
                    <View style={styles.predictionRow}>
                        <View style={styles.predictionItem}>
                            <Ionicons name="calendar" size={20} color={Colors.cyclePhases.menstrual} />
                            <View style={styles.predictionText}>
                                <Text style={[styles.predictionLabel, { color: theme.textSecondary }]}>
                                    Next Period
                                </Text>
                                <Text style={[styles.predictionValue, { color: theme.text }]}>
                                    {daysUntilPeriod > 0 ? `In ${daysUntilPeriod} days` : 'Today'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.predictionDivider} />
                        <View style={styles.predictionItem}>
                            <Ionicons name="heart" size={20} color={Colors.tertiary[500]} />
                            <View style={styles.predictionText}>
                                <Text style={[styles.predictionLabel, { color: theme.textSecondary }]}>
                                    Fertile Window
                                </Text>
                                <Text style={[styles.predictionValue, { color: theme.text }]}>
                                    {daysUntilFertile > 0 ? `In ${daysUntilFertile} days` :
                                        daysUntilFertile < 0 ? 'Passed' : 'Now'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </Card>

                {/* Log Period Button */}
                <Button
                    title={loggingPeriod ? "Logging..." :
                        selectedDay ? `🩸 Log Period for ${selectedDay}${selectedDay === 1 ? 'st' : selectedDay === 2 ? 'nd' : selectedDay === 3 ? 'rd' : 'th'}` :
                            "🩸 Log Period (Today)"}
                    onPress={handleLogPeriod}
                    variant="primary"
                    fullWidth
                    loading={loggingPeriod}
                    style={{ marginBottom: spacing.lg }}
                />

                {/* Calendar */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{currentMonth}</Text>

                <Card style={styles.calendarCard}>
                    {/* Weekday headers */}
                    <View style={styles.weekdayRow}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                            <Text key={index} style={[styles.weekdayLabel, { color: theme.textMuted }]}>
                                {day}
                            </Text>
                        ))}
                    </View>

                    {/* Calendar grid */}
                    <View style={styles.calendarGrid}>
                        {days.map(renderCalendarDay)}
                    </View>

                    {/* Legend */}
                    <View style={styles.legend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: Colors.cyclePhases.menstrual }]} />
                            <Text style={[styles.legendText, { color: theme.textSecondary }]}>Period</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: Colors.tertiary[500] }]} />
                            <Text style={[styles.legendText, { color: theme.textSecondary }]}>Fertile</Text>
                        </View>
                    </View>
                </Card>

                {/* Phase Tips */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    {phaseInfo.title}
                </Text>

                <Card style={styles.tipsCard}>
                    {phaseInfo.tips.map((tip, index) => (
                        <Text key={index} style={[styles.tip, { color: theme.textSecondary }]}>
                            {tip}
                        </Text>
                    ))}
                </Card>

                {/* Recent Periods */}
                {recentPeriods.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Periods</Text>
                        {recentPeriods.slice(0, 3).map((period, index) => (
                            <Card key={period.id || index} style={styles.periodLogCard}>
                                <View style={styles.periodLogRow}>
                                    <Ionicons name="calendar-outline" size={20} color={Colors.cyclePhases.menstrual} />
                                    <Text style={[styles.periodLogDate, { color: theme.text }]}>
                                        {period.startDate.toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </Text>
                                    <Text style={[styles.periodLogFlow, { color: theme.textMuted }]}>
                                        {period.flow} flow
                                    </Text>
                                </View>
                            </Card>
                        ))}
                    </>
                )}

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollView: { flex: 1 },
    content: { padding: spacing.md },
    phaseCard: { marginBottom: spacing.md },
    predictionCard: { marginBottom: spacing.md },
    predictionRow: { flexDirection: 'row', alignItems: 'center' },
    predictionItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    predictionDivider: { width: 1, height: 40, backgroundColor: '#E0E0E0', marginHorizontal: spacing.md },
    predictionText: {},
    predictionLabel: { ...Typography.caption },
    predictionValue: { ...Typography.body, fontWeight: '600' },
    sectionTitle: { ...Typography.h4, marginBottom: spacing.md },
    calendarCard: { marginBottom: spacing.lg },
    weekdayRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.sm },
    weekdayLabel: { ...Typography.caption, width: 40, textAlign: 'center' },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.md,
    },
    dayNumber: { ...Typography.body },
    periodDot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
    legend: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, marginTop: spacing.md },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { ...Typography.caption },
    tipsCard: { marginBottom: spacing.lg },
    tip: { ...Typography.body, marginBottom: spacing.sm },
    periodLogCard: { marginBottom: spacing.sm },
    periodLogRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    periodLogDate: { ...Typography.body, flex: 1 },
    periodLogFlow: { ...Typography.caption },
    bottomSpacer: { height: 100 },
});
