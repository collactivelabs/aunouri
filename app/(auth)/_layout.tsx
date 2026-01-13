/**
 * AuNouri - Auth Layout
 */

import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Stack } from 'expo-router';

export default function AuthLayout() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.background },
            }}
        >
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
        </Stack>
    );
}
