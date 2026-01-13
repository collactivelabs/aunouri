/**
 * AuNouri - Camera/Scan Food Screen
 * REAL photo capture for food recognition and calorie calculation
 */

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { UpgradePrompt } from '@/components/ui/UpgradePrompt';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { borderRadius, shadows, spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { FoodRecognitionResult, foodRecognitionService } from '@/services/foodRecognition';
import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CameraScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const { user } = useAuth();
    const { mealLoggingStatus, tier, recordMealLog, refreshMealLoggingStatus } = useFeatureAccess();
    const theme = Colors[colorScheme];
    const cameraRef = useRef<CameraView>(null);
    const router = useRouter();

    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState<CameraType>('back');
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [results, setResults] = useState<FoodRecognitionResult | null>(null);
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

    // Request camera permission
    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.permissionContainer}>
                    <Ionicons name="camera-outline" size={64} color={theme.textMuted} />
                    <Text style={[styles.permissionTitle, { color: theme.text }]}>
                        Camera Access Needed
                    </Text>
                    <Text style={[styles.permissionText, { color: theme.textSecondary }]}>
                        We need camera access to scan your food and calculate calories.
                    </Text>
                    <Button
                        title="Grant Permission"
                        onPress={requestPermission}
                        variant="primary"
                        style={{ marginTop: spacing.lg }}
                    />
                </View>
            </SafeAreaView>
        );
    }

    const takePhoto = async () => {
        // Check meal logging limit
        if (!mealLoggingStatus.allowed) {
            setShowUpgradePrompt(true);
            return;
        }

        if (!cameraRef.current) return;

        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.7,
                base64: true,
            });

            if (photo) {
                setPhotoUri(photo.uri);
                analyzePhoto(photo.base64 || '');
            }
        } catch (error) {
            console.error('Failed to take photo:', error);
            Alert.alert('Error', 'Failed to take photo. Please try again.');
        }
    };

    const pickImage = async () => {
        // Check meal logging limit
        if (!mealLoggingStatus.allowed) {
            setShowUpgradePrompt(true);
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled && result.assets[0]) {
            setPhotoUri(result.assets[0].uri);
            analyzePhoto(result.assets[0].base64 || '');
        }
    };

    const analyzePhoto = async (base64: string) => {
        setIsAnalyzing(true);
        setResults(null);

        try {
            const recognitionResult = await foodRecognitionService.analyzeImage(base64);
            setResults(recognitionResult);
        } catch (error) {
            console.error('Food recognition failed:', error);
            Alert.alert('Error', 'Failed to analyze food. Please try again.');
            setPhotoUri(null);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleRetake = () => {
        setPhotoUri(null);
        setResults(null);
    };

    const handleLogMeal = async () => {
        if (!results) return;

        // Navigate to log-meal screen with results
        // We pass the data as a string since it's cleaner than passing object params
        router.push({
            pathname: '/log-meal',
            params: {
                results: JSON.stringify(results),
                photoUri: photoUri || ''
            }
        });
    };

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    // Camera View
    if (!photoUri) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: '#000' }]}>
                <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing={facing}
                />
                {/* Overlay must be outside CameraView with absolute positioning */}
                <View style={styles.cameraOverlay}>
                    <View style={styles.cameraHeader}>
                        <Text style={styles.cameraTitle}>Scan Your Food</Text>
                        <Text style={styles.cameraSubtitle}>Point camera at your meal</Text>
                    </View>

                    <View style={styles.cameraControls}>
                        <TouchableOpacity style={styles.controlButton} onPress={pickImage}>
                            <Ionicons name="images" size={28} color="#FFF" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.captureButton, { backgroundColor: Colors.primary[500] }]}
                            onPress={takePhoto}
                        >
                            <View style={styles.captureInner} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
                            <Ionicons name="camera-reverse" size={28} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Meal Logging Limit Indicator */}
                {mealLoggingStatus.limit > 0 && (
                    <View style={styles.limitIndicator}>
                        <Ionicons name="camera" size={14} color="#fff" />
                        <Text style={styles.limitText}>
                            {mealLoggingStatus.remaining}/{mealLoggingStatus.limit} scans left today
                        </Text>
                    </View>
                )}

                {/* Upgrade Prompt Modal */}
                <UpgradePrompt
                    visible={showUpgradePrompt}
                    onClose={() => setShowUpgradePrompt(false)}
                    feature="meal_logging"
                    currentTier={tier}
                />
            </SafeAreaView>
        );
    }

    // Results View
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                style={styles.resultsScroll}
                contentContainerStyle={styles.resultsContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Photo Preview */}
                <View style={styles.photoPreviewContainer}>
                    <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                    {isAnalyzing && (
                        <View style={styles.analyzingOverlay}>
                            <View style={styles.analyzingBadge}>
                                <Ionicons name="scan" size={20} color="#FFF" />
                                <Text style={styles.analyzingText}>Analyzing with AI...</Text>
                            </View>
                        </View>
                    )}
                </View>

                {isAnalyzing ? (
                    <Card style={styles.loadingCard}>
                        <Text style={[styles.loadingText, { color: theme.text }]}>
                            🔍 Identifying foods...
                        </Text>
                        <Text style={[styles.loadingSubtext, { color: theme.textSecondary }]}>
                            AI is analyzing your meal
                        </Text>
                    </Card>
                ) : results ? (
                    <>
                        {/* Summary Card */}
                        <Card style={styles.summaryCard} variant="elevated">
                            <Text style={[styles.summaryTitle, { color: theme.text }]}>
                                Meal Summary
                            </Text>
                            <View style={styles.summaryRow}>
                                <View style={styles.summaryItem}>
                                    <Text style={[styles.summaryValue, { color: Colors.primary[500] }]}>
                                        {results.totalCalories.toFixed(1)}
                                    </Text>
                                    <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                                        calories
                                    </Text>
                                </View>
                                <View style={styles.summaryItem}>
                                    <Text style={[styles.summaryValue, { color: Colors.tertiary[500] }]}>
                                        -{results.healthierAlternatives.reduce((sum, alt) => sum + alt.caloriesSaved, 0)}
                                    </Text>
                                    <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                                        potential savings
                                    </Text>
                                </View>
                            </View>
                        </Card>

                        {/* Food Items */}
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Detected Foods
                        </Text>

                        {results.foods.map((item, index) => {
                            const alternative = results.healthierAlternatives.find(
                                (alt) => alt.original.toLowerCase() === item.name.toLowerCase()
                            );
                            return (
                                <Card key={index} style={styles.foodCard}>
                                    <View style={styles.foodHeader}>
                                        <View style={styles.foodInfo}>
                                            <Text style={[styles.foodName, { color: theme.text }]}>
                                                {item.name}
                                            </Text>
                                            <Text style={[styles.serving, { color: theme.textMuted }]}>
                                                {item.servingQty} {item.servingSize}
                                            </Text>
                                        </View>
                                        <View style={styles.caloriesBox}>
                                            <Text style={[styles.foodCalories, { color: Colors.primary[500] }]}>
                                                {item.calories}
                                            </Text>
                                            <Text style={[styles.calLabel, { color: theme.textMuted }]}>cal</Text>
                                        </View>
                                    </View>

                                    {/* Macros */}
                                    <View style={styles.macroRow}>
                                        <View style={[styles.macroPill, { backgroundColor: Colors.secondary[500] + '20' }]}>
                                            <Text style={[styles.macroText, { color: Colors.secondary[600] }]}>
                                                P: {item.protein}g
                                            </Text>
                                        </View>
                                        <View style={[styles.macroPill, { backgroundColor: Colors.primary[500] + '20' }]}>
                                            <Text style={[styles.macroText, { color: Colors.primary[600] }]}>
                                                C: {item.carbs}g
                                            </Text>
                                        </View>
                                        <View style={[styles.macroPill, { backgroundColor: Colors.tertiary[500] + '20' }]}>
                                            <Text style={[styles.macroText, { color: Colors.tertiary[600] }]}>
                                                F: {item.fat}g
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Healthier Alternative */}
                                    {alternative && (
                                        <View style={[styles.alternativeBox, { backgroundColor: Colors.tertiary[500] + '15' }]}>
                                            <View style={styles.alternativeHeader}>
                                                <Text style={[styles.alternativeLabel, { color: Colors.tertiary[600] }]}>
                                                    💡 Healthier swap
                                                </Text>
                                                <Text style={[styles.savingsLabel, { color: Colors.tertiary[600] }]}>
                                                    Save {alternative.caloriesSaved} cal
                                                </Text>
                                            </View>
                                            <Text style={[styles.alternativeName, { color: theme.text }]}>
                                                {alternative.alternative}
                                            </Text>
                                            <Text style={[styles.alternativeReason, { color: theme.textMuted }]}>
                                                {alternative.reason}
                                            </Text>
                                        </View>
                                    )}
                                </Card>
                            );
                        })}

                        {/* Action Buttons */}
                        <View style={styles.actionButtons}>
                            <Button
                                title="Log This Meal"
                                onPress={handleLogMeal}
                                variant="primary"
                                fullWidth
                            />
                            <Button
                                title="Retake Photo"
                                onPress={handleRetake}
                                variant="ghost"
                                fullWidth
                                style={{ marginTop: spacing.sm }}
                            />
                        </View>
                    </>
                ) : null}

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    // Permission screen
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    permissionTitle: { ...Typography.h3, marginTop: spacing.lg, marginBottom: spacing.sm },
    permissionText: { ...Typography.body, textAlign: 'center' },
    // Camera
    camera: { flex: 1 },
    cameraOverlay: {
        flex: 1,
        justifyContent: 'space-between',
        padding: spacing.lg,
    },
    cameraHeader: {
        alignItems: 'center',
        paddingTop: spacing.xl,
    },
    cameraTitle: { ...Typography.h3, color: '#FFF' },
    cameraSubtitle: { ...Typography.body, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs },
    cameraControls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: spacing.xl,
    },
    controlButton: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.lg,
    },
    captureInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FFF',
        borderWidth: 3,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    // Results
    resultsScroll: { flex: 1 },
    resultsContent: { padding: spacing.md },
    photoPreviewContainer: {
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        marginBottom: spacing.md,
    },
    photoPreview: {
        width: '100%',
        height: 220,
        borderRadius: borderRadius.xl,
    },
    analyzingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    analyzingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary[500],
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
        gap: spacing.sm,
    },
    analyzingText: { color: '#FFF', ...Typography.label },
    loadingCard: { alignItems: 'center', padding: spacing.xl },
    loadingText: { ...Typography.h4 },
    loadingSubtext: { ...Typography.bodySmall, marginTop: spacing.xs },
    summaryCard: { marginBottom: spacing.lg },
    summaryTitle: { ...Typography.h4, marginBottom: spacing.md },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
    summaryItem: { alignItems: 'center' },
    summaryValue: { ...Typography.h2 },
    summaryLabel: { ...Typography.caption },
    sectionTitle: { ...Typography.h4, marginBottom: spacing.md },
    foodCard: { marginBottom: spacing.md },
    foodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    foodInfo: { flex: 1 },
    foodName: { ...Typography.body, fontWeight: '600' },
    serving: { ...Typography.caption, marginTop: 2 },
    caloriesBox: { alignItems: 'flex-end' },
    foodCalories: { ...Typography.h3 },
    calLabel: { ...Typography.caption },
    macroRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    macroPill: { paddingVertical: 4, paddingHorizontal: spacing.sm, borderRadius: borderRadius.full },
    macroText: { ...Typography.caption, fontWeight: '600' },
    alternativeBox: { marginTop: spacing.sm, padding: spacing.sm, borderRadius: borderRadius.md },
    alternativeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    alternativeLabel: { ...Typography.caption, fontWeight: '600' },
    savingsLabel: { ...Typography.caption, fontWeight: '600' },
    alternativeName: { ...Typography.bodySmall, fontWeight: '500' },
    alternativeReason: { ...Typography.caption, marginTop: 2 },
    actionButtons: { marginTop: spacing.md },
    bottomSpacer: { height: 100 },

    // Limit indicator
    limitIndicator: {
        position: 'absolute',
        top: 60,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: borderRadius.full,
    },
    limitText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
});
