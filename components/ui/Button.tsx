/**
 * AuNouri - Button Component
 * Primary, Secondary, and Ghost button variants
 */

import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { borderRadius, spacing } from '@/constants/Layout';
import { Typography } from '@/constants/Typography';
import React from 'react';
import {
    ActivityIndicator,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    fullWidth?: boolean;
    style?: ViewStyle;
}

export function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon,
    fullWidth = false,
    style,
}: ButtonProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const getContainerStyle = (): ViewStyle => {
        const base: ViewStyle = {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: borderRadius.lg,
            opacity: disabled ? 0.5 : 1,
        };

        // Size styles
        const sizes: Record<ButtonSize, ViewStyle> = {
            sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
            md: { paddingVertical: spacing.md - 4, paddingHorizontal: spacing.lg },
            lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
        };

        // Variant styles
        const variants: Record<ButtonVariant, ViewStyle> = {
            primary: { backgroundColor: Colors.primary[500] },
            secondary: { backgroundColor: Colors.secondary[500] },
            ghost: { backgroundColor: 'transparent' },
            outline: {
                backgroundColor: 'transparent',
                borderWidth: 1.5,
                borderColor: theme.primary,
            },
        };

        return {
            ...base,
            ...sizes[size],
            ...variants[variant],
            ...(fullWidth && { width: '100%' }),
        };
    };

    const getTextStyle = (): TextStyle => {
        const base: TextStyle = {
            ...Typography.button,
        };

        const textColors: Record<ButtonVariant, string> = {
            primary: '#FFFFFF',
            secondary: '#FFFFFF',
            ghost: theme.primary,
            outline: theme.primary,
        };

        const fontSizes: Record<ButtonSize, number> = {
            sm: 14,
            md: 16,
            lg: 18,
        };

        return {
            ...base,
            color: textColors[variant],
            fontSize: fontSizes[size],
        };
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={[getContainerStyle(), style]}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'primary' || variant === 'secondary' ? '#FFFFFF' : theme.primary}
                    size="small"
                />
            ) : (
                <>
                    {icon && <>{icon}</>}
                    <Text style={[getTextStyle(), icon ? { marginLeft: spacing.sm } : undefined]}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
}

export default Button;
