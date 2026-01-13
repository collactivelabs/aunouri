/**
 * AuNouri - Profile Screen with REAL data and working settings
 */

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { borderRadius, spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { cycleService } from '@/services/cycle';
import { HealthProvider, healthService, UnifiedHealthData } from '@/services/health';
import { mealService } from '@/services/meals';
import { notificationService } from '@/services/notificationService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SettingItemProps {
    icon: string;
    iconColor: string;
    title: string;
    subtitle?: string;
    isConnected?: boolean;
    onPress?: () => void;
}

function SettingItem({ icon, iconColor, title, subtitle, isConnected, onPress }: SettingItemProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    return (
        <TouchableOpacity style={styles.settingItem} onPress={onPress}>
            <View style={[styles.settingIcon, { backgroundColor: iconColor + '15' }]}>
                <Text style={{ fontSize: 20 }}>{icon}</Text>
            </View>
            <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
                {subtitle && <Text style={[styles.settingSubtitle, { color: theme.textMuted }]}>{subtitle}</Text>}
            </View>
            {isConnected !== undefined && (
                <View style={[
                    styles.connectionBadge,
                    { backgroundColor: isConnected ? Colors.tertiary[500] + '20' : Colors.neutral[200] }
                ]}>
                    <Text style={{
                        color: isConnected ? Colors.tertiary[600] : Colors.neutral[500],
                        fontSize: 12,
                        fontWeight: '600',
                    }}>
                        {isConnected ? 'Connected' : 'Connect'}
                    </Text>
                </View>
            )}
            {isConnected === undefined && (
                <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
            )}
        </TouchableOpacity>
    );
}

export default function ProfileScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { user, signOut, userProfile, updateUserProfile } = useAuth();

    const [loading, setLoading] = useState(true);
    const [streak, setStreak] = useState(0);
    const [totalCalories, setTotalCalories] = useState(0);
    const [cyclesLogged, setCyclesLogged] = useState(0);
    const [healthData, setHealthData] = useState<UnifiedHealthData | null>(null);
    const [connectedProvider, setConnectedProvider] = useState<HealthProvider>('none');
    const [isLoading, setIsLoading] = useState(false);

    // Modal states
    const [showGoalsModal, setShowGoalsModal] = useState(false);
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [showMealTimesModal, setShowMealTimesModal] = useState(false);

    // Goals state
    const [calorieGoal, setCalorieGoal] = useState('1800');
    const [waterGoal, setWaterGoal] = useState('2500');

    // Meal Times state
    const [mealTimes, setMealTimes] = useState({
        breakfast: '08:00',
        lunch: '13:00',
        dinner: '19:00'
    });

    const [editName, setEditName] = useState('');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    // Refresh on focus
    useFocusEffect(
        useCallback(() => {
            loadProfileData();
        }, [user])
    );

    const loadProfileData = async () => {
        const userId = user?.uid || 'demo-user';

        try {
            const [streakData, recentPeriods] = await Promise.all([
                mealService.getStreak(userId),
                cycleService.getRecentPeriods(userId),
            ]);

            setStreak(streakData);
            setCyclesLogged(recentPeriods.length);

            // Calculate total calories tracked (estimate)
            const recentMeals = await mealService.getRecentMeals(userId, 30);
            const total = recentMeals.reduce((sum, meal) => sum + meal.totalCalories, 0);
            setTotalCalories(total);

            // Load saved goal
            if (userProfile?.calorieGoal) {
                setCalorieGoal(userProfile.calorieGoal.toString());
            }
            if (userProfile?.waterGoal) {
                setWaterGoal(userProfile.waterGoal.toString());
            }
            // Load meal times if present (mock for now if not in profile, ideally should be in profile)
            // if (userProfile?.mealTimes) setMealTimes(userProfile.mealTimes);
            if (userProfile?.notificationsEnabled !== undefined) {
                setNotificationsEnabled(userProfile.notificationsEnabled);
            }

            // Check health connection
            const status = await healthService.getConnectionStatus();
            setConnectedProvider(status.provider);
            if (status.isConnected) {
                const data = await healthService.syncTodayData();
                setHealthData(data);
            }
        } catch (error) {
            console.error('Failed to load profile data:', error);
        } finally {
            setLoading(false);
        }
    };

    const connectHealthProvider = async (provider: HealthProvider) => {
        const providerName = provider === 'apple' ? 'Apple Health' :
            provider === 'google' ? 'Google Fit' : 'Samsung Health';

        if (provider === 'apple' && Platform.OS !== 'ios') {
            Alert.alert('Not Available', 'Apple Health is only available on iOS devices.');
            return;
        }
        if ((provider === 'google' || provider === 'samsung') && Platform.OS !== 'android') {
            Alert.alert('Not Available', `${providerName} is only available on Android devices.`);
            return;
        }

        setIsLoading(true);
        try {
            const success = await healthService.connect(provider);
            if (success) {
                setConnectedProvider(provider);
                const data = await healthService.syncTodayData();
                setHealthData(data);
                Alert.alert('Connected!', `Successfully connected to ${providerName}.`);
            }
        } catch (error) {
            Alert.alert('Error', 'Could not connect. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = async () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await signOut();
                        router.replace('/(auth)/login');
                    } catch (error) {
                        console.error('Sign out error:', error);
                    }
                },
            },
        ]);
    };

    const handleSaveGoals = async () => {
        try {
            const cal = parseInt(calorieGoal) || 1800;
            const water = parseInt(waterGoal) || 2500;

            await updateUserProfile({
                calorieGoal: cal,
                waterGoal: water
            });
            setShowGoalsModal(false);
            Alert.alert('Saved!', `Goals updated:\nCalories: ${cal}\nWater: ${water}ml`);
        } catch (error) {
            Alert.alert('Error', 'Could not save goals. Please try again.');
        }
    };

    const handleSaveMealTimes = async () => {
        // Ideally save to profile
        await notificationService.scheduleMealReminders(mealTimes);
        setShowMealTimesModal(false);
        Alert.alert('Saved!', 'Meal reminders updated.');
    };

    const handleSaveProfile = async () => {
        try {
            if (editName.trim()) {
                await updateUserProfile({ displayName: editName.trim() });
            }
            setShowEditProfileModal(false);
            Alert.alert('Saved!', 'Your profile has been updated.');
            loadProfileData();
        } catch (error) {
            Alert.alert('Error', 'Could not save profile. Please try again.');
        }
    };

    const handleNotificationsToggle = () => {
        const newValue = !notificationsEnabled;
        setNotificationsEnabled(newValue);
        updateUserProfile({ notificationsEnabled: newValue });
        Alert.alert(
            newValue ? 'Notifications Enabled' : 'Notifications Disabled',
            newValue ? 'You will receive reminders and alerts.' : 'You will not receive notifications.'
        );
    };

    const handleAppearance = () => {
        Alert.alert(
            'Appearance',
            'App theme follows your system settings.\n\nGo to your device Settings > Display to change between Light and Dark mode.',
            [{ text: 'OK' }]
        );
    };

    const userName = user?.displayName || userProfile?.displayName || 'User';
    const userEmail = user?.email || 'Not signed in';
    const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

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
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                {/* Profile Header */}
                <Card variant="elevated" style={styles.profileCard}>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => {
                            setEditName(userName);
                            setShowEditProfileModal(true);
                        }}
                    >
                        <Ionicons name="pencil" size={18} color={Colors.primary[500]} />
                    </TouchableOpacity>
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, { backgroundColor: Colors.primary[500] }]}>
                            <Text style={styles.avatarText}>{userInitials}</Text>
                        </View>
                    </View>
                    <Text style={[styles.name, { color: theme.text }]}>{userName}</Text>
                    <Text style={[styles.email, { color: theme.textSecondary }]}>{userEmail}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: Colors.primary[500] }]}>{streak}</Text>
                            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Day Streak</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: Colors.tertiary[500] }]}>
                                {totalCalories >= 1000 ? `${(totalCalories / 1000).toFixed(1)}k` : totalCalories}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Calories Tracked</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: Colors.secondary[500] }]}>{cyclesLogged}</Text>
                            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Cycles Logged</Text>
                        </View>
                    </View>
                </Card>

                {/* Health Stats */}
                {healthData && healthData.provider !== 'none' && (
                    <Card variant="elevated" style={styles.healthCard}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Activity</Text>
                        <View style={styles.healthStats}>
                            <View style={styles.healthStat}>
                                <Ionicons name="footsteps" size={24} color={Colors.primary[500]} />
                                <Text style={[styles.healthValue, { color: theme.text }]}>
                                    {healthData.steps.toLocaleString()}
                                </Text>
                                <Text style={[styles.healthLabel, { color: theme.textMuted }]}>steps</Text>
                            </View>
                            <View style={styles.healthStat}>
                                <Ionicons name="flame" size={24} color={Colors.secondary[500]} />
                                <Text style={[styles.healthValue, { color: theme.text }]}>
                                    {healthData.activeCalories}
                                </Text>
                                <Text style={[styles.healthLabel, { color: theme.textMuted }]}>active cal</Text>
                            </View>
                        </View>
                    </Card>
                )}

                {/* Health Integrations */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Health Integrations</Text>
                <Card>
                    {Platform.OS === 'ios' && (
                        <SettingItem
                            icon="❤️"
                            iconColor={Colors.secondary[500]}
                            title="Apple Health"
                            subtitle="Sync steps, activity & cycle data"
                            isConnected={connectedProvider === 'apple'}
                            onPress={() => connectHealthProvider('apple')}
                        />
                    )}
                    {Platform.OS === 'android' && (
                        <>
                            <SettingItem
                                icon="🏃"
                                iconColor={Colors.tertiary[500]}
                                title="Google Fit"
                                subtitle="Sync activity & fitness data"
                                isConnected={connectedProvider === 'google'}
                                onPress={() => connectHealthProvider('google')}
                            />
                            <SettingItem
                                icon="⌚"
                                iconColor={Colors.primary[500]}
                                title="Samsung Health"
                                subtitle="Sync from Galaxy devices"
                                isConnected={connectedProvider === 'samsung'}
                                onPress={() => connectHealthProvider('samsung')}
                            />
                        </>
                    )}
                </Card>

                {/* Settings */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Settings</Text>
                <Card>
                    <SettingItem
                        icon="🎯"
                        iconColor={Colors.primary[500]}
                        title="Goals"
                        subtitle={`Cals: ${calorieGoal} | Water: ${waterGoal}ml`}
                        onPress={() => setShowGoalsModal(true)}
                    />
                    <SettingItem
                        icon="⏰"
                        iconColor={Colors.tertiary[500]}
                        title="Meal Times"
                        subtitle="Customize reminder schedule"
                        onPress={() => setShowMealTimesModal(true)}
                    />
                    <SettingItem
                        icon="🔔"
                        iconColor={Colors.secondary[500]}
                        title="Notifications"
                        subtitle={notificationsEnabled ? 'Enabled' : 'Disabled'}
                        onPress={handleNotificationsToggle}
                    />
                    <SettingItem
                        icon="🌙"
                        iconColor={Colors.tertiary[500]}
                        title="Appearance"
                        subtitle="Follows system theme"
                        onPress={handleAppearance}
                    />
                </Card>

                {/* Sign Out */}
                <Button
                    title="Sign Out"
                    onPress={handleSignOut}
                    variant="secondary"
                    fullWidth
                    style={{ marginTop: spacing.lg }}
                />

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Goals Modal */}
            <Modal visible={showGoalsModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Set Daily Goals</Text>

                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Calorie Goal</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                            value={calorieGoal}
                            onChangeText={setCalorieGoal}
                            keyboardType="number-pad"
                            placeholder="1800"
                            placeholderTextColor={theme.textMuted}
                        />

                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Water Goal (ml)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                            value={waterGoal}
                            onChangeText={setWaterGoal}
                            keyboardType="number-pad"
                            placeholder="2500"
                            placeholderTextColor={theme.textMuted}
                        />

                        <View style={styles.modalButtons}>
                            <Button title="Cancel" variant="secondary" onPress={() => setShowGoalsModal(false)} />
                            <Button title="Save" variant="primary" onPress={handleSaveGoals} />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Meal Times Modal placeholder */}
            <Modal visible={showMealTimesModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Meal Times</Text>
                        <Text style={{ color: theme.textMuted, marginBottom: 20, textAlign: 'center' }}>
                            Set standard times for your meal reminders.
                        </Text>
                        {/* Simplified inputs for prototype */}
                        <View style={{ gap: 10, marginBottom: 20 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ color: theme.text }}>Breakfast</Text>
                                <TextInput
                                    value={mealTimes.breakfast}
                                    onChangeText={(t) => setMealTimes({ ...mealTimes, breakfast: t })}
                                    style={[styles.timeInput, { color: theme.text, borderColor: theme.border }]}
                                    placeholder="08:00"
                                />
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ color: theme.text }}>Lunch</Text>
                                <TextInput
                                    value={mealTimes.lunch}
                                    onChangeText={(t) => setMealTimes({ ...mealTimes, lunch: t })}
                                    style={[styles.timeInput, { color: theme.text, borderColor: theme.border }]}
                                    placeholder="13:00"
                                />
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ color: theme.text }}>Dinner</Text>
                                <TextInput
                                    value={mealTimes.dinner}
                                    onChangeText={(t) => setMealTimes({ ...mealTimes, dinner: t })}
                                    style={[styles.timeInput, { color: theme.text, borderColor: theme.border }]}
                                    placeholder="19:00"
                                />
                            </View>
                        </View>

                        <View style={styles.modalButtons}>
                            <Button title="Cancel" variant="secondary" onPress={() => setShowMealTimesModal(false)} />
                            <Button title="Save" variant="primary" onPress={handleSaveMealTimes} />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Profile Modal */}
            <Modal visible={showEditProfileModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</Text>
                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Display Name</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Your name"
                            placeholderTextColor={theme.textMuted}
                        />
                        <View style={styles.modalButtons}>
                            <Button title="Cancel" variant="secondary" onPress={() => setShowEditProfileModal(false)} />
                            <Button title="Save" variant="primary" onPress={handleSaveProfile} />
                        </View>
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
    profileCard: { alignItems: 'center', marginBottom: spacing.lg, position: 'relative' },
    editButton: { position: 'absolute', top: spacing.md, right: spacing.md, padding: spacing.xs },
    avatarContainer: { marginBottom: spacing.md },
    avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#FFF', fontSize: 28, fontWeight: '700' },
    name: { ...Typography.h3, marginBottom: spacing.xs },
    email: { ...Typography.body, marginBottom: spacing.md },
    statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
    statItem: { alignItems: 'center', paddingHorizontal: spacing.md },
    statValue: { ...Typography.h3 },
    statLabel: { ...Typography.caption },
    statDivider: { width: 1, height: 30, backgroundColor: '#E0E0E0' },
    healthCard: { marginBottom: spacing.lg },
    healthStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.sm },
    healthStat: { alignItems: 'center' },
    healthValue: { ...Typography.h4, marginTop: spacing.xs },
    healthLabel: { ...Typography.caption },
    sectionTitle: { ...Typography.h4, marginBottom: spacing.sm, marginTop: spacing.md },
    settingItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm },
    settingIcon: { width: 40, height: 40, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
    settingText: { flex: 1, marginLeft: spacing.md },
    settingTitle: { ...Typography.body, fontWeight: '600' },
    settingSubtitle: { ...Typography.caption },
    connectionBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
    bottomSpacer: { height: 100 },
    // Modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
    modalContent: { borderRadius: borderRadius.lg, padding: spacing.lg },
    modalTitle: { ...Typography.h3, marginBottom: spacing.lg, textAlign: 'center' },
    inputLabel: { ...Typography.label, marginBottom: spacing.xs },
    input: { borderWidth: 1, borderRadius: borderRadius.md, padding: spacing.md, fontSize: 18, marginBottom: spacing.md },
    timeInput: { borderWidth: 1, borderRadius: borderRadius.md, padding: spacing.sm, width: 80, textAlign: 'center', fontSize: 16 },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.md },
});
