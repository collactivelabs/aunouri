/**
 * AuNouri - Card Component
 * Container component with consistent styling
 */

import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { borderRadius, shadows, spacing } from '@/constants/Layout';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface CardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    variant?: 'default' | 'elevated' | 'outlined';
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
    children,
    style,
    variant = 'default',
    padding = 'md',
}: CardProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const paddingValues = {
        none: 0,
        sm: spacing.sm,
        md: spacing.md,
        lg: spacing.lg,
    };

    const getVariantStyle = (): ViewStyle => {
        switch (variant) {
            case 'elevated':
                return {
                    backgroundColor: theme.card,
                    ...shadows.lg,
                };
            case 'outlined':
                return {
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: theme.border,
                };
            default:
                return {
                    backgroundColor: theme.card,
                    ...shadows.sm,
                };
        }
    };

    return (
        <View
            style={[
                styles.container,
                getVariantStyle(),
                { padding: paddingValues[padding] },
                style,
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: borderRadius.lg,
    },
});

export default Card;
