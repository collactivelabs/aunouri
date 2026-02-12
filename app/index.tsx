/**
 * AuNouri - App Entry Point
 * Routes users to onboarding or main app based on their status
 */

import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { onboardingStorage } from '@/services/onboardingStorage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
    const { user, loading: authLoading } = useAuth();
    const [checkingOnboarding, setCheckingOnboarding] = useState(true);
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

    useEffect(() => {
        checkOnboardingStatus();
    }, [user]);

    const checkOnboardingStatus = async () => {
        setCheckingOnboarding(true);

        // Check if onboarding has been completed (stored locally)
        const completed = await onboardingStorage.hasCompletedOnboarding();
        if (__DEV__) console.log('[Index] Onboarding completed:', completed);
        if (__DEV__) console.log('[Index] User:', user?.uid || 'none');
        setHasCompletedOnboarding(completed);
        setCheckingOnboarding(false);
    };

    // Still loading
    if (authLoading || checkingOnboarding) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                <ActivityIndicator size="large" color={Colors.primary[500]} />
            </View>
        );
    }

    // User is logged in - go to main app
    if (user) {
        if (__DEV__) console.log('[Index] Routing to tabs - user logged in:', user.uid);
        return <Redirect href="/(tabs)" />;
    }

    // Guest who completed onboarding - go to main app (limited features)
    if (hasCompletedOnboarding) {
        if (__DEV__) console.log('[Index] Routing to tabs - guest completed onboarding');
        return <Redirect href="/(tabs)" />;
    }

    // New user - start onboarding
    if (__DEV__) console.log('[Index] Routing to onboarding - new user');
    return <Redirect href="/onboarding/step1-basics" />;
}

