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
import { CycleDayLog, CycleInfo, cycleService, PeriodLog } from '@/services/cycle';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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
    dailyLog?: CycleDayLog;
}

const FLOW_OPTIONS = ['Spotting', 'Light', 'Medium', 'Heavy'];
const SYMPTOM_OPTIONS = ['Cramps', 'Headache', 'Bloating', 'Fatigue', 'Acne', 'Mood Swings', 'Backache', 'Nausea'];

const phaseDescriptions: Record<CyclePhase, { title: string; tips: { text: string; icon: keyof typeof Ionicons.glyphMap; color?: string }[] }> = {
    menstrual: {
        title: 'Menstrual Phase (Days 1-5)',
        tips: [
            { text: 'Cravings are normal - opt for dark chocolate', icon: 'cafe-outline', color: Colors.cyclePhases.menstrual },
            { text: 'Focus on iron-rich foods (spinach, lentils)', icon: 'leaf-outline', color: Colors.cyclePhases.menstrual },
            { text: 'Gentle movement like yoga or walking', icon: 'body-outline', color: Colors.cyclePhases.menstrual },
            { text: 'Stay hydrated to reduce bloating', icon: 'water-outline', color: Colors.cyclePhases.menstrual },
        ],
    },
    follicular: {
        title: 'Follicular Phase (Days 6-14)',
        tips: [
            { text: 'Great time for intense workouts', icon: 'barbell-outline', color: Colors.cyclePhases.follicular },
            { text: 'Load up on fresh vegetables', icon: 'nutrition-outline', color: Colors.cyclePhases.follicular },
            { text: 'Increase protein intake', icon: 'restaurant-outline', color: Colors.cyclePhases.follicular },
            { text: 'Energy is rising - try new activities!', icon: 'flash-outline', color: Colors.cyclePhases.follicular },
        ],
    },
    ovulatory: {
        title: 'Ovulatory Phase (Days 15-17)',
        tips: [
            { text: 'Peak energy for high-intensity training', icon: 'flame-outline', color: Colors.cyclePhases.ovulatory },
            { text: 'Focus on fiber-rich foods', icon: 'leaf-outline', color: Colors.cyclePhases.ovulatory },
            { text: 'Antioxidant-rich fruits are ideal', icon: 'nutrition-outline', color: Colors.cyclePhases.ovulatory },
            { text: 'Best time for challenging goals', icon: 'trophy-outline', color: Colors.cyclePhases.ovulatory },
        ],
    },
    luteal: {
        title: 'Luteal Phase (Days 18-28)',
        tips: [
            { text: 'Complex carbs help with cravings', icon: 'pizza-outline', color: Colors.cyclePhases.luteal },
            { text: 'Magnesium-rich foods (nuts, seeds)', icon: 'fish-outline', color: Colors.cyclePhases.luteal },
            { text: 'Prioritize sleep and rest', icon: 'moon-outline', color: Colors.cyclePhases.luteal },
            { text: 'Low-impact exercise is best', icon: 'bicycle-outline', color: Colors.cyclePhases.luteal },
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
    const [dailyLogs, setDailyLogs] = useState<CycleDayLog[]>([]);

    // Modal State
    const [showLogModal, setShowLogModal] = useState(false);
    const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [notes, setNotes] = useState('');

    const today = new Date();
    const currentMonth = today.toLocaleString('default', { month: 'long', year: 'numeric' });

    useEffect(() => {
        loadCycleData();
    }, [user]);

    const loadCycleData = async () => {
        const userId = user?.uid || 'demo-user';

        try {
            const [cycleData, periods, logs] = await Promise.all([
                cycleService.getCycleInfo(userId),
                cycleService.getRecentPeriods(userId),
                cycleService.getDailyLogs(
                    userId,
                    new Date(today.getFullYear(), today.getMonth(), 1),
                    new Date(today.getFullYear(), today.getMonth() + 1, 0)
                )
            ]);

            setCycleInfo(cycleData);
            setRecentPeriods(periods);
            setDailyLogs(logs);
        } catch (error) {
            if (__DEV__) console.error('Failed to load cycle data:', error);
        } finally {
            setLoading(false);
        }
    };

    const openLogModal = (day: number) => {
        setSelectedDay(day);

        // Find existing log for this day
        const info = getDayInfo(day);
        if (info?.dailyLog) {
            setSelectedFlow(info.dailyLog.flow || null);
            setSelectedSymptoms(info.dailyLog.symptoms || []);
            setNotes(info.dailyLog.notes || '');
        } else {
            setSelectedFlow(null);
            setSelectedSymptoms([]);
            setNotes('');
        }

        setShowLogModal(true);
    };

    const handleSaveLog = async () => {
        if (!selectedDay) return;
        const userId = user?.uid || 'demo-user';

        setLoggingPeriod(true);
        try {
            const date = new Date(today.getFullYear(), today.getMonth(), selectedDay);
            await cycleService.logCycleDay(userId, date, {
                flow: selectedFlow as any,
                symptoms: selectedSymptoms,
                notes: notes.trim() || null
            });

            setShowLogModal(false);
            loadCycleData();
            Alert.alert('Saved', 'Your cycle log has been updated.');
        } catch (error) {
            if (__DEV__) console.error('Failed to log day:', error);
            Alert.alert('Error', 'Could not save log. Please try again.');
        } finally {
            setLoggingPeriod(false);
        }
    };

    const toggleSymptom = (symptom: string) => {
        if (selectedSymptoms.includes(symptom)) {
            setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
        } else {
            setSelectedSymptoms([...selectedSymptoms, symptom]);
        }
    };

    const getDayInfo = (day: number): DayInfo | undefined => {
        return days.find(d => d.day === day);
    };

    const getDaysInMonth = (): DayInfo[] => {
        const days: DayInfo[] = [];
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

        const cycleLength = cycleInfo?.cycleLength || 28;
        const periodLength = cycleInfo?.periodLength || 5;
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

            // Check for actual log
            const dateStr = date.toISOString().split('T')[0];
            const dailyLog = dailyLogs.find(l => l.date === dateStr);

            days.push({ day: i, date, phase, isPeriod, isToday, isFertile, dailyLog });
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

        // Show different styles for actual data vs predicted
        const hasLog = !!dayInfo.dailyLog;
        const isSelected = selectedDay === dayInfo.day;

        let bgColor = 'transparent';
        if (isSelected) bgColor = Colors.primary[500] + '20';
        else if (hasLog && dayInfo.dailyLog?.flow) bgColor = Colors.cyclePhases.menstrual + '30';

        return (
            <TouchableOpacity
                key={dayInfo.day}
                style={[
                    styles.dayCell,
                    dayInfo.isToday && { borderWidth: 2, borderColor: Colors.primary[500] },
                    { backgroundColor: bgColor }
                ]}
                onPress={() => openLogModal(dayInfo.day)}
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

                {/* Dots for info */}
                <View style={{ flexDirection: 'row', gap: 2 }}>
                    {(dayInfo.isPeriod || (hasLog && dayInfo.dailyLog?.flow)) && (
                        <View style={[styles.periodDot, {
                            backgroundColor: Colors.cyclePhases.menstrual,
                            opacity: dayInfo.dailyLog ? 1 : 0.4 // Predicted is transparent
                        }]} />
                    )}
                    {dayInfo.isFertile && !dayInfo.isPeriod && (
                        <View style={[styles.periodDot, { backgroundColor: Colors.tertiary[500] }]} />
                    )}
                    {hasLog && dayInfo.dailyLog?.symptoms?.length ? (
                        <View style={[styles.periodDot, { backgroundColor: Colors.secondary[500] }]} />
                    ) : null}
                </View>
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

                {/* Log Period Button - changed to generic log prompt */}
                <Button
                    title="Log Today's Symptoms"
                    icon={<Ionicons name="create-outline" size={20} color="#FFF" />}
                    onPress={() => openLogModal(today.getDate())}
                    variant="primary"
                    fullWidth
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
                        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                            <View style={{ width: 32, alignItems: 'center', marginRight: spacing.sm }}>
                                <Ionicons name={tip.icon} size={20} color={tip.color} />
                            </View>
                            <Text style={[styles.tip, { color: theme.textSecondary, marginBottom: 0, flex: 1 }]}>
                                {tip.text}
                            </Text>
                        </View>
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

            </ScrollView>

            {/* Daily Log Modal */}
            <Modal visible={showLogModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card, maxHeight: '80%' }]}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                {selectedDay ? `Log for ${currentMonth.split(' ')[0]} ${selectedDay}` : 'Daily Log'}
                            </Text>

                            {/* Flow Selection */}
                            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Menstrual Flow</Text>
                            <View style={styles.optionsGrid}>
                                {FLOW_OPTIONS.map(flow => (
                                    <TouchableOpacity
                                        key={flow}
                                        style={[
                                            styles.optionChip,
                                            { borderColor: theme.border },
                                            selectedFlow === flow.toLowerCase() && { backgroundColor: Colors.cyclePhases.menstrual, borderColor: Colors.cyclePhases.menstrual }
                                        ]}
                                        onPress={() => setSelectedFlow(selectedFlow === flow.toLowerCase() ? null : flow.toLowerCase())}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            { color: selectedFlow === flow.toLowerCase() ? '#FFF' : theme.text }
                                        ]}>{flow}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Symptoms Selection */}
                            <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: spacing.md }]}>Symptoms</Text>
                            <View style={styles.optionsGrid}>
                                {SYMPTOM_OPTIONS.map(symptom => (
                                    <TouchableOpacity
                                        key={symptom}
                                        style={[
                                            styles.optionChip,
                                            { borderColor: theme.border },
                                            selectedSymptoms.includes(symptom) && { backgroundColor: Colors.secondary[500], borderColor: Colors.secondary[500] }
                                        ]}
                                        onPress={() => toggleSymptom(symptom)}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            { color: selectedSymptoms.includes(symptom) ? '#FFF' : theme.text }
                                        ]}>{symptom}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Notes */}
                            <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: spacing.md }]}>Notes</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                                value={notes}
                                onChangeText={setNotes}
                                placeholder="Add notes..."
                                placeholderTextColor={theme.textMuted}
                                multiline
                            />

                            <View style={styles.modalButtons}>
                                <Button title="Cancel" variant="secondary" onPress={() => setShowLogModal(false)} />
                                <Button title="Save Log" variant="primary" onPress={handleSaveLog} loading={loggingPeriod} />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, padding: spacing.lg },
    modalTitle: { ...Typography.h3, marginBottom: spacing.lg, textAlign: 'center' },
    sectionLabel: { ...Typography.label, marginBottom: spacing.sm },
    optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    optionChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1 },
    optionText: { ...Typography.caption, fontWeight: '600' },
    input: { minHeight: 80, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, textAlignVertical: 'top' },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.lg },
});
