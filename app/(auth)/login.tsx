/**
 * AuNouri - Login Screen
 * Real Firebase authentication
 */

import { Button } from '@/components/ui/Button';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { borderRadius, spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { signIn, signInWithApple, signInWithGoogle } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await signIn(email, password);
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error('Login error:', error);
            Alert.alert('Login Failed', error.message || 'Please check your credentials');
        } finally {
            setLoading(false);
        }
    };

    const handleAppleLogin = async () => {
        setLoading(true);
        try {
            await signInWithApple();
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error('Apple login error:', error);
            Alert.alert('Apple Sign-In', error.message || 'Could not sign in with Apple');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            await signInWithGoogle();
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error('Google login error:', error);
            Alert.alert('Google Sign-In', error.message || 'Could not sign in with Google');
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
                <View style={styles.content}>
                    {/* Logo/Brand */}
                    <View style={styles.header}>
                        <View style={[styles.logoContainer, { backgroundColor: Colors.primary[500] + '20' }]}>
                            <Ionicons name="flower-outline" size={48} color={Colors.primary[500]} />
                        </View>
                        <Text style={[styles.title, { color: theme.text }]}>AuNouri</Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                            Nourish your body, honor your cycle
                        </Text>
                    </View>

                    {/* Login Form */}
                    <View style={styles.form}>
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
                                placeholder="••••••••"
                                placeholderTextColor={theme.textMuted}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity style={styles.forgotPassword}>
                            <Text style={[styles.forgotText, { color: Colors.primary[500] }]}>
                                Forgot password?
                            </Text>
                        </TouchableOpacity>

                        <Button
                            title="Sign In"
                            onPress={handleLogin}
                            variant="primary"
                            fullWidth
                            loading={loading}
                        />
                    </View>

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                        <Text style={[styles.dividerText, { color: theme.textMuted }]}>or continue with</Text>
                        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                    </View>

                    {/* Social Login */}
                    <View style={styles.socialButtons}>
                        <TouchableOpacity
                            style={[styles.socialButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                            onPress={handleAppleLogin}
                            disabled={loading}
                        >
                            <Ionicons name="logo-apple" size={24} color={theme.text} />
                            <Text style={[styles.socialText, { color: theme.text }]}>Apple</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.socialButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                            onPress={handleGoogleLogin}
                            disabled={loading}
                        >
                            <Ionicons name="logo-google" size={24} color={theme.text} />
                            <Text style={[styles.socialText, { color: theme.text }]}>Google</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Sign Up Link */}
                    <View style={styles.signupContainer}>
                        <Text style={[styles.signupText, { color: theme.textSecondary }]}>
                            Don't have an account?{' '}
                        </Text>
                        <Link href="/(auth)/register" asChild>
                            <TouchableOpacity>
                                <Text style={[styles.signupLink, { color: Colors.primary[500] }]}>Sign Up</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    keyboardView: { flex: 1 },
    content: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: spacing['2xl'] },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    // logo: { fontSize: 64, marginBottom: spacing.md },
    title: { ...Typography.h1, marginBottom: spacing.xs },
    subtitle: { ...Typography.body, textAlign: 'center' },
    form: { marginBottom: spacing.xl },
    inputContainer: { marginBottom: spacing.md },
    label: { ...Typography.label, marginBottom: spacing.xs },
    input: {
        height: 52,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        fontSize: 16,
        borderWidth: 1,
    },
    forgotPassword: { alignSelf: 'flex-end', marginBottom: spacing.lg },
    forgotText: { ...Typography.bodySmall },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
    dividerLine: { flex: 1, height: 1 },
    dividerText: { ...Typography.caption, marginHorizontal: spacing.md },
    socialButtons: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 52,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        gap: spacing.sm,
    },
    // socialIcon: { fontSize: 20 },
    socialText: { ...Typography.button },
    signupContainer: { flexDirection: 'row', justifyContent: 'center' },
    signupText: { ...Typography.body },
    signupLink: { ...Typography.body, fontWeight: '600' },
});
