/**
 * AuNouri - Register Screen
 * Real Firebase authentication with onboarding data transfer
 */

import { Button } from '@/components/ui/Button';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { borderRadius, spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { onboardingStorage } from '@/services/onboardingStorage';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
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

export default function RegisterScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { signUp, signInWithApple, signInWithGoogle } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSsoSignUp = async (provider: 'apple' | 'google') => {
        setLoading(true);
        try {
            if (provider === 'apple') {
                await signInWithApple();
            } else {
                await signInWithGoogle();
            }
            router.replace('/(tabs)');
        } catch (error: any) {
            if (__DEV__) console.error(`${provider} sign-up error:`, error);
            const label = provider === 'apple' ? 'Apple' : 'Google';
            Alert.alert(`${label} Sign-In`, error.message || `Could not sign in with ${label}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            // 1. Get onboarding data first
            const onboardingData = await onboardingStorage.getProfileData();
            if (__DEV__) console.log('Onboarding data to transfer:', onboardingData);

            // 2. Create the account with onboarding data merged
            await signUp(email, password, name, onboardingData || undefined);

            // 3. Clear local onboarding data after successful transfer (fire-and-forget)
            if (onboardingData) {
                onboardingStorage.clearOnboardingData().catch(() => {});
            }

            // 4. Navigate immediately — don't wait for an alert tap
            router.replace('/(tabs)');
        } catch (error: any) {
            if (__DEV__) console.error('Registration error:', error);

            if (error.code === 'auth/email-already-in-use' || error.message?.includes('email-already-in-use')) {
                setLoading(false); // Ensure loading is off before alert
                Alert.alert(
                    'Account Already Exists',
                    'This email address is already in use. Would you like to sign in instead?',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Sign In', onPress: () => router.push('/(auth)/login') }
                    ]
                );
                return;
            }

            let message = error.message || 'Please try again';
            if (error.code === 'auth/invalid-email') message = 'Please enter a valid email address.';
            else if (error.code === 'auth/weak-password') message = 'Password must be at least 6 characters.';
            else if (error.code === 'auth/network-request-failed') message = 'Network error. Please check your internet connection.';

            Alert.alert('Registration Failed', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.content}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={[styles.logoContainer, { backgroundColor: Colors.primary[500] + '20' }]}>
                                <Ionicons name="flower-outline" size={40} color={Colors.primary[500]} />
                            </View>
                            <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
                            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                                Start your personalized health journey
                            </Text>
                        </View>

                        {/* Form */}
                        <View style={styles.form}>
                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Full Name</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                                    placeholder="Your name"
                                    placeholderTextColor={theme.textMuted}
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Email</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                                    placeholder="your@email.com"
                                    placeholderTextColor={theme.textMuted}
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                                    placeholder="At least 6 characters"
                                    placeholderTextColor={theme.textMuted}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Confirm Password</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                                    placeholder="Confirm your password"
                                    placeholderTextColor={theme.textMuted}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                />
                            </View>

                            {/* Terms */}
                            <Text style={[styles.terms, { color: theme.textMuted }]}>
                                By signing up, you agree to our{' '}
                                <Text style={{ color: Colors.primary[500] }}>Terms of Service</Text>
                                {' '}and{' '}
                                <Text style={{ color: Colors.primary[500] }}>Privacy Policy</Text>
                            </Text>

                            <Button
                                title="Create Account"
                                onPress={handleRegister}
                                variant="primary"
                                fullWidth
                                loading={loading}
                            />
                        </View>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                            <Text style={[styles.dividerText, { color: theme.textMuted }]}>or sign up with</Text>
                            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                        </View>

                        {/* Platform-specific SSO */}
                        {Platform.OS === 'ios' ? (
                            <AppleAuthentication.AppleAuthenticationButton
                                buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                                buttonStyle={colorScheme === 'dark'
                                    ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                                    : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                                cornerRadius={12}
                                style={styles.appleButton}
                                onPress={() => handleSsoSignUp('apple')}
                            />
                        ) : (
                            <TouchableOpacity
                                style={[styles.socialButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                                onPress={() => handleSsoSignUp('google')}
                                disabled={loading}
                            >
                                <Ionicons name="logo-google" size={24} color={theme.text} />
                                <Text style={[styles.socialText, { color: theme.text }]}>Continue with Google</Text>
                            </TouchableOpacity>
                        )}

                        {/* Login Link */}
                        <View style={styles.loginContainer}>
                            <Text style={[styles.loginText, { color: theme.textSecondary }]}>
                                Already have an account?{' '}
                            </Text>
                            <Link href="/(auth)/login" asChild>
                                <TouchableOpacity>
                                    <Text style={[styles.loginLink, { color: Colors.primary[500] }]}>Sign In</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    keyboardView: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    content: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: spacing.xl },
    logoContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    // logo: { fontSize: 48, marginBottom: spacing.md },
    title: { ...Typography.h2, marginBottom: spacing.xs },
    subtitle: { ...Typography.body, textAlign: 'center' },
    form: { marginBottom: spacing.lg },
    inputContainer: { marginBottom: spacing.md },
    label: { ...Typography.label, marginBottom: spacing.xs },
    input: {
        height: 52,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        fontSize: 16,
        borderWidth: 1,
    },
    terms: { ...Typography.caption, textAlign: 'center', marginBottom: spacing.lg },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
    dividerLine: { flex: 1, height: 1 },
    dividerText: { ...Typography.caption, marginHorizontal: spacing.md },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 52,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    socialText: { ...Typography.button },
    appleButton: { height: 52, width: '100%', marginBottom: spacing.lg },
    loginContainer: { flexDirection: 'row', justifyContent: 'center' },
    loginText: { ...Typography.body },
    loginLink: { ...Typography.body, fontWeight: '600' },
});
