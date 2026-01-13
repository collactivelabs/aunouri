/**
 * AuNouri - Recommendations Screen with REAL cycle-based data
 * Auto-updates as user moves through cycle phases
 */

import { Card } from '@/components/ui/Card';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { borderRadius, spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { CycleInfo, CyclePhase, cycleService } from '@/services/cycle';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Recommendation {
    id: string;
    icon: string;
    title: string;
    description: string;
    category: 'nutrition' | 'exercise' | 'wellness' | 'fasting';
    // Dietary restrictions - if present, recommendation is excluded for users with these preferences
    excludeFor?: string[];
    // Flag for diabetic-friendly (lower sugar/carb)
    diabeticFriendly?: boolean;
}

const phaseRecommendations: Record<CyclePhase, Recommendation[]> = {
    menstrual: [
        { id: '1', icon: 'nutrition-outline', title: 'Dark Chocolate', description: 'Satisfies cravings with magnesium boost', category: 'nutrition', diabeticFriendly: false },
        { id: '2', icon: 'leaf-outline', title: 'Iron-Rich Foods', description: 'Spinach, lentils, beans to replenish', category: 'nutrition', diabeticFriendly: true },
        { id: '2b', icon: 'restaurant-outline', title: 'Red Meat for Iron', description: 'Beef or lamb to replenish iron', category: 'nutrition', excludeFor: ['vegetarian', 'vegan', 'pescatarian'], diabeticFriendly: true },
        { id: '3', icon: 'body-outline', title: 'Gentle Yoga', description: 'Restorative poses for cramps and relaxation', category: 'exercise' },
        { id: '4', icon: 'water-outline', title: 'Hydration Focus', description: 'Extra water helps reduce bloating', category: 'wellness' },
        { id: '5', icon: 'moon-outline', title: 'Rest Priority', description: 'Your body is working hard - rest more', category: 'wellness' },
        { id: '6', icon: 'cafe-outline', title: 'Warm Beverages', description: 'Herbal teas soothe and comfort', category: 'nutrition', diabeticFriendly: true },
    ],
    follicular: [
        { id: '1', icon: 'flame-outline', title: 'High-Intensity Training', description: 'Energy is rising - push yourself!', category: 'exercise' },
        { id: '2', icon: 'egg-outline', title: 'Protein Focus (Eggs)', description: 'Build muscle with eggs and dairy', category: 'nutrition', excludeFor: ['vegan'], diabeticFriendly: true },
        { id: '2b', icon: 'leaf-outline', title: 'Plant Protein Power', description: 'Tofu, tempeh, legumes for muscle', category: 'nutrition', diabeticFriendly: true },
        { id: '2c', icon: 'fish-outline', title: 'Lean Fish Protein', description: 'Salmon, tuna for omega-3s', category: 'nutrition', excludeFor: ['vegetarian', 'vegan'], diabeticFriendly: true },
        { id: '3', icon: 'nutrition-outline', title: 'Fresh Vegetables', description: 'Load up on greens and fiber', category: 'nutrition', diabeticFriendly: true },
        { id: '4', icon: 'time-outline', title: 'Try Intermittent Fasting', description: '16:8 works well in this phase', category: 'fasting' },
        { id: '5', icon: 'rocket-outline', title: 'New Challenges', description: 'Great time to start new projects', category: 'wellness' },
        { id: '6', icon: 'barbell-outline', title: 'Strength Training', description: 'Optimal time for building muscle', category: 'exercise' },
    ],
    ovulatory: [
        { id: '1', icon: 'trophy-outline', title: 'Peak Performance', description: 'Go for your personal bests!', category: 'exercise' },
        { id: '2', icon: 'heart-outline', title: 'Fiber & Healthy Fats', description: 'Support hormone balance', category: 'nutrition', diabeticFriendly: true },
        { id: '3', icon: 'nutrition-outline', title: 'Antioxidant Fruits', description: 'Berries, citrus for vitality', category: 'nutrition', diabeticFriendly: true },
        { id: '4', icon: 'people-outline', title: 'Social Activities', description: 'Communication peaks - great for meetings', category: 'wellness' },
        { id: '5', icon: 'stopwatch-outline', title: 'HIIT Workouts', description: 'Maximum calorie burn window', category: 'exercise' },
        { id: '6', icon: 'time-outline', title: 'Extended Fasting OK', description: 'Body handles longer fasts well', category: 'fasting' },
    ],
    luteal: [
        { id: '1', icon: 'pizza-outline', title: 'Complex Carbs', description: 'Sweet potato, quinoa for cravings', category: 'nutrition', diabeticFriendly: false },
        { id: '1b', icon: 'leaf-outline', title: 'Low-Carb Veggies', description: 'Broccoli, cauliflower for fullness', category: 'nutrition', diabeticFriendly: true },
        { id: '2', icon: 'happy-outline', title: 'Magnesium Foods', description: 'Nuts, seeds, dark chocolate', category: 'nutrition', diabeticFriendly: true },
        { id: '3', icon: 'water-outline', title: 'Low-Impact Exercise', description: 'Swimming, walking, pilates', category: 'exercise' },
        { id: '4', icon: 'bed-outline', title: 'Extra Sleep', description: 'Body needs more rest before period', category: 'wellness' },
        { id: '5', icon: 'flower-outline', title: 'Stress Management', description: 'Meditation and deep breathing', category: 'wellness' },
        { id: '6', icon: 'timer-outline', title: 'Shorter Fasting Windows', description: 'Stick to 12-14 hour fasts', category: 'fasting' },
    ],
};

const categoryColors: Record<string, string> = {
    nutrition: Colors.primary[500],
    exercise: Colors.tertiary[500],
    wellness: Colors.secondary[500],
    fasting: Colors.neutral[600],
};

export default function RecommendationsScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { user, userProfile } = useAuth();

    const [loading, setLoading] = useState(true);
    const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Auto-refresh when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            loadCycleData();
        }, [user])
    );

    const loadCycleData = async () => {
        const userId = user?.uid || 'demo-user';

        try {
            const data = await cycleService.getCycleInfo(userId);
            setCycleInfo(data);
        } catch (error) {
            console.error('Failed to load cycle data:', error);
        } finally {
            setLoading(false);
        }
    };

    const currentPhase = cycleInfo?.currentPhase || 'follicular';
    const recommendations = phaseRecommendations[currentPhase];

    // Filter recommendations based on user dietary preferences and diabetic status
    const userDietaryPrefs = userProfile?.dietaryPreferences || [];
    const isDiabetic = userProfile?.isDiabetic || false;

    const dietFiltered = recommendations.filter(rec => {
        // Check if recommendation should be excluded based on dietary preferences
        if (rec.excludeFor && rec.excludeFor.some(pref => userDietaryPrefs.includes(pref))) {
            return false;
        }
        // If user is diabetic and we have diabetic info, prefer diabetic-friendly options
        // But don't exclude non-diabetic-friendly if it's the only option
        return true;
    });

    // If diabetic, prioritize diabetic-friendly recommendations
    const prioritizedRecs = isDiabetic
        ? [...dietFiltered].sort((a, b) => {
            // Put diabetic-friendly items first
            if (a.diabeticFriendly === true && b.diabeticFriendly !== true) return -1;
            if (b.diabeticFriendly === true && a.diabeticFriendly !== true) return 1;
            return 0;
        })
        : dietFiltered;

    const filteredRecs = selectedCategory
        ? prioritizedRecs.filter(r => r.category === selectedCategory)
        : prioritizedRecs;

    const phaseNames: Record<CyclePhase, string> = {
        menstrual: 'Menstrual Phase',
        follicular: 'Follicular Phase',
        ovulatory: 'Ovulatory Phase',
        luteal: 'Luteal Phase',
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
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>Recommendations</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Personalized for your {phaseNames[currentPhase]}
                    </Text>
                </View>

                {/* Phase Indicator */}
                <Card style={styles.phaseCard}>
                    <View style={styles.phaseRow}>
                        <View style={[styles.phaseDot, { backgroundColor: Colors.cyclePhases[currentPhase] }]} />
                        <View>
                            <Text style={[styles.phaseName, { color: theme.text }]}>
                                {phaseNames[currentPhase]}
                            </Text>
                            <Text style={[styles.phaseDay, { color: theme.textSecondary }]}>
                                Day {cycleInfo?.dayOfCycle || 1} of your cycle
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Category Filter */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Filter by Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                    <TouchableOpacity
                        style={[
                            styles.categoryChip,
                            { backgroundColor: !selectedCategory ? Colors.primary[500] : theme.card }
                        ]}
                        onPress={() => setSelectedCategory(null)}
                    >
                        <Text style={{ color: !selectedCategory ? '#FFF' : theme.text }}>All</Text>
                    </TouchableOpacity>
                    {['nutrition', 'exercise', 'wellness', 'fasting'].map(cat => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.categoryChip,
                                { backgroundColor: selectedCategory === cat ? categoryColors[cat] : theme.card }
                            ]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <Text style={{ color: selectedCategory === cat ? '#FFF' : theme.text }}>
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Recommendations */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Tips for You ({filteredRecs.length})
                </Text>

                {filteredRecs.map(rec => (
                    <Card key={rec.id} style={styles.recCard}>
                        <View style={styles.recRow}>
                            <View style={[styles.recIcon, { backgroundColor: categoryColors[rec.category] + '20' }]}>
                                <Ionicons name={rec.icon as any} size={24} color={categoryColors[rec.category]} />
                            </View>
                            <View style={styles.recContent}>
                                <Text style={[styles.recTitle, { color: theme.text }]}>{rec.title}</Text>
                                <Text style={[styles.recDesc, { color: theme.textSecondary }]}>
                                    {rec.description}
                                </Text>
                            </View>
                            <View style={[styles.recCategory, { backgroundColor: categoryColors[rec.category] + '20' }]}>
                                <Text style={[styles.recCategoryText, { color: categoryColors[rec.category] }]}>
                                    {rec.category}
                                </Text>
                            </View>
                        </View>
                    </Card>
                ))}

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
    header: { marginBottom: spacing.lg },
    title: { ...Typography.h2 },
    subtitle: { ...Typography.body },
    phaseCard: { marginBottom: spacing.lg },
    phaseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    phaseDot: { width: 12, height: 12, borderRadius: 6 },
    phaseName: { ...Typography.h4 },
    phaseDay: { ...Typography.caption },
    sectionTitle: { ...Typography.h4, marginBottom: spacing.sm },
    categoryScroll: { marginBottom: spacing.lg },
    categoryChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        marginRight: spacing.sm,
    },
    recCard: { marginBottom: spacing.sm },
    recRow: { flexDirection: 'row', alignItems: 'center' },
    recIcon: { width: 48, height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },

    recContent: { flex: 1, marginLeft: spacing.md },
    recTitle: { ...Typography.body, fontWeight: '600' },
    recDesc: { ...Typography.caption },
    recCategory: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
    recCategoryText: { ...Typography.caption, fontWeight: '600' },
    bottomSpacer: { height: 100 },
});
