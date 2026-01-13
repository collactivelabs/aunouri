/**
 * AuNouri Design System - Typography
 * Modern minimalist typography scale
 */

import { StyleSheet, TextStyle } from 'react-native';

export const fontFamilies = {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
};

export const fontSizes = {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
};

export const lineHeights = {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
};

export const fontWeights: { [key: string]: TextStyle['fontWeight'] } = {
    normal: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
};

export const Typography = StyleSheet.create({
    // Headings
    h1: {
        fontSize: fontSizes['4xl'],
        fontWeight: fontWeights.bold,
        lineHeight: fontSizes['4xl'] * lineHeights.tight,
        letterSpacing: -0.5,
    },
    h2: {
        fontSize: fontSizes['3xl'],
        fontWeight: fontWeights.bold,
        lineHeight: fontSizes['3xl'] * lineHeights.tight,
        letterSpacing: -0.3,
    },
    h3: {
        fontSize: fontSizes['2xl'],
        fontWeight: fontWeights.semiBold,
        lineHeight: fontSizes['2xl'] * lineHeights.tight,
        letterSpacing: -0.2,
    },
    h4: {
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.semiBold,
        lineHeight: fontSizes.xl * lineHeights.normal,
    },

    // Body text
    bodyLarge: {
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.normal,
        lineHeight: fontSizes.lg * lineHeights.relaxed,
    },
    body: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.normal,
        lineHeight: fontSizes.base * lineHeights.relaxed,
    },
    bodySmall: {
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.normal,
        lineHeight: fontSizes.sm * lineHeights.relaxed,
    },

    // Labels & captions
    label: {
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.medium,
        lineHeight: fontSizes.sm * lineHeights.normal,
        letterSpacing: 0.2,
    },
    caption: {
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.normal,
        lineHeight: fontSizes.xs * lineHeights.normal,
    },

    // Special
    button: {
        fontSize: fontSizes.base,
        fontWeight: fontWeights.semiBold,
        lineHeight: fontSizes.base * lineHeights.normal,
        letterSpacing: 0.3,
    },
    tabLabel: {
        fontSize: fontSizes.xs,
        fontWeight: fontWeights.medium,
        lineHeight: fontSizes.xs * lineHeights.normal,
    },
});

export default Typography;
