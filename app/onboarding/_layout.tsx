/**
 * AuNouri - Onboarding Layout
 * Stack navigator for the 6-step onboarding flow
 */

import { Colors } from '@/constants/Colors';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: Colors.light.background },
            }}
        >
            <Stack.Screen name="step1-basics" />
            <Stack.Screen name="step2-activity" />
            <Stack.Screen name="step3-goals" />
            <Stack.Screen name="step4-cycle" />
            <Stack.Screen name="step5-diabetic" />
            <Stack.Screen name="step6-diet" />
            <Stack.Screen name="results" />
        </Stack>
    );
}
