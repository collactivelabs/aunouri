/**
 * AuNouri - Upgrade Prompt Component
 * Shows upgrade prompts when users hit feature limits
 */

import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { borderRadius, spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { TieredFeature, UserTier } from '@/services/featureAccess';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface UpgradePromptProps {
    visible: boolean;
    onClose: () => void;
    feature: TieredFeature;
    currentTier: UserTier;
    title?: string;
    message?: string;
}

export function UpgradePrompt({
    visible,
    onClose,
    feature,
    currentTier,
    title,
    message,
}: UpgradePromptProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const getDefaultTitle = (): string => {
        if (currentTier === 'guest') {
            return 'Create a Free Account';
        }
        return 'Upgrade to Premium';
    };

    const getDefaultMessage = (): string => {
        switch (feature) {
            case 'meal_logging':
                if (currentTier === 'guest') {
                    return "You've reached your daily limit of 3 meal scans. Create a free account for unlimited meal logging!";
                }
                return 'Enjoy unlimited meal scanning with Premium!';
            case 'meal_history':
                if (currentTier === 'guest') {
                    return 'Guests can only view 3 days of meal history. Create a free account to see 7 days!';
                }
                return 'Unlock unlimited meal history with Premium!';
            case 'cycle_tracking':
                if (currentTier === 'guest') {
                    return 'Guests can only track 3 days of cycle data. Create a free account for 7 days!';
                }
                return 'Get unlimited cycle tracking with Premium!';
            case 'meal_recommendations':
                if (currentTier === 'guest') {
                    return 'Guests get 3 days of meal recommendations. Create a free account for 7 days!';
                }
                return 'Unlock unlimited AI meal recommendations with Premium!';
            case 'health_sync':
                return 'Sync your health data from Apple Health or Google Fit. Create a free account to unlock!';
            case 'friends':
                return 'Connect with friends for motivation and accountability. Create a free account to unlock!';
            case 'meal_plans':
                return 'Get personalized monthly meal plans tailored to your goals. Upgrade to Premium!';
            case 'analytics':
                return 'Access advanced nutrition analytics and insights. Upgrade to Premium!';
            default:
                return 'Unlock more features by upgrading!';
        }
    };

    const handleUpgrade = () => {
        onClose();
        if (currentTier === 'guest') {
            router.push('/(auth)/register');
        } else {
            // Premium subscription will be implemented later
            // For now, show coming soon message
            Alert.alert(
                'Premium Coming Soon! ✨',
                'Premium features including monthly meal plans, advanced analytics, and ad-free experience are coming soon!',
                [{ text: 'OK' }]
            );
        }
    };

    const getButtonText = (): string => {
        if (currentTier === 'guest') {
            return 'Create Free Account';
        }
        return 'View Premium Plans';
    };

    const getIcon = (): keyof typeof Ionicons.glyphMap => {
        switch (feature) {
            case 'meal_logging':
                return 'camera';
            case 'meal_history':
                return 'time';
            case 'cycle_tracking':
                return 'flower';
            case 'meal_recommendations':
                return 'bulb';
            case 'health_sync':
                return 'fitness';
            case 'friends':
                return 'people';
            case 'meal_plans':
                return 'calendar';
            case 'analytics':
                return 'analytics';
            default:
                return 'lock-open';
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modal, { backgroundColor: theme.card }]}>
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <Ionicons name={getIcon()} size={40} color={Colors.primary[500]} />
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { color: theme.text }]}>
                        {title || getDefaultTitle()}
                    </Text>

                    {/* Message */}
                    <Text style={[styles.message, { color: theme.textSecondary }]}>
                        {message || getDefaultMessage()}
                    </Text>

                    {/* Benefits (for premium upgrade) */}
                    {currentTier === 'registered' && (
                        <View style={styles.benefits}>
                            <View style={styles.benefitItem}>
                                <Ionicons name="checkmark-circle" size={20} color={Colors.primary[500]} />
                                <Text style={[styles.benefitText, { color: theme.text }]}>
                                    Unlimited history & tracking
                                </Text>
                            </View>
                            <View style={styles.benefitItem}>
                                <Ionicons name="checkmark-circle" size={20} color={Colors.primary[500]} />
                                <Text style={[styles.benefitText, { color: theme.text }]}>
                                    Monthly personalized meal plans
                                </Text>
                            </View>
                            <View style={styles.benefitItem}>
                                <Ionicons name="checkmark-circle" size={20} color={Colors.primary[500]} />
                                <Text style={[styles.benefitText, { color: theme.text }]}>
                                    Advanced nutrition analytics
                                </Text>
                            </View>
                            <View style={styles.benefitItem}>
                                <Ionicons name="checkmark-circle" size={20} color={Colors.primary[500]} />
                                <Text style={[styles.benefitText, { color: theme.text }]}>
                                    Ad-free experience
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* CTA Button */}
                    <TouchableOpacity
                        style={styles.ctaButton}
                        onPress={handleUpgrade}
                    >
                        <Text style={styles.ctaText}>{getButtonText()}</Text>
                    </TouchableOpacity>

                    {/* Close button */}
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                    >
                        <Text style={[styles.closeText, { color: theme.textMuted }]}>
                            Maybe later
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modal: {
        width: '100%',
        maxWidth: 340,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary[500] + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        ...Typography.h3,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    message: {
        ...Typography.body,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    benefits: {
        width: '100%',
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    benefitText: {
        ...Typography.body,
        flex: 1,
    },
    ctaButton: {
        width: '100%',
        backgroundColor: Colors.primary[500],
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    ctaText: {
        ...Typography.body,
        color: '#fff',
        fontWeight: '600',
    },
    closeButton: {
        paddingVertical: spacing.sm,
    },
    closeText: {
        ...Typography.caption,
    },
});

export default UpgradePrompt;
