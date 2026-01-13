/**
 * AuNouri Design System - Colors
 * Modern minimalist palette with soft, feminine tones
 */

// Primary brand colors - warm gold/honey tones (Au = gold)
const primary = {
  50: '#FFF8E7',
  100: '#FFEFC4',
  200: '#FFE49D',
  300: '#FFD876',
  400: '#FFCC4D',
  500: '#F5B800', // Main brand gold
  600: '#D9A300',
  700: '#B88A00',
  800: '#8C6900',
  900: '#5C4500',
};

// Secondary - soft rose/blush
const secondary = {
  50: '#FFF0F3',
  100: '#FFE0E6',
  200: '#FFC2CF',
  300: '#FFA3B5',
  400: '#FF859C',
  500: '#FF6B84', // Main rose
  600: '#E54D68',
  700: '#C9354F',
  800: '#A12038',
  900: '#6B1525',
};

// Tertiary - calming sage/mint
const tertiary = {
  50: '#F0FAF4',
  100: '#DCF5E6',
  200: '#B8EBCD',
  300: '#8FDEB1',
  400: '#66D096',
  500: '#4AC27D', // Main sage
  600: '#38A565',
  700: '#2A8850',
  800: '#1F6B3D',
  900: '#144D2B',
};

// Neutral grays
const neutral = {
  50: '#FAFAFA',
  100: '#F5F5F5',
  200: '#E5E5E5',
  300: '#D4D4D4',
  400: '#A3A3A3',
  500: '#737373',
  600: '#525252',
  700: '#404040',
  800: '#262626',
  900: '#171717',
};

// Cycle phase colors
const cyclePhases = {
  menstrual: '#E54D68',   // Rose/red - representing menstruation
  follicular: '#4AC27D',  // Fresh green - growth phase
  ovulatory: '#F5B800',   // Golden - peak energy
  luteal: '#A78BFA',      // Soft purple - winding down
};

// Semantic colors
const semantic = {
  success: '#4AC27D',
  warning: '#F5B800',
  error: '#E54D68',
  info: '#60A5FA',
};

const tintColorLight = primary[500];
const tintColorDark = primary[400];

export const Colors = {
  primary,
  secondary,
  tertiary,
  neutral,
  cyclePhases,
  semantic,
  
  light: {
    text: neutral[900],
    textSecondary: neutral[600],
    textMuted: neutral[400],
    background: neutral[50],
    backgroundSecondary: '#FFFFFF',
    card: '#FFFFFF',
    border: neutral[200],
    tint: tintColorLight,
    tabIconDefault: neutral[400],
    tabIconSelected: tintColorLight,
    primary: primary[500],
    secondary: secondary[500],
  },
  dark: {
    text: neutral[50],
    textSecondary: neutral[400],
    textMuted: neutral[500],
    background: neutral[900],
    backgroundSecondary: neutral[800],
    card: neutral[800],
    border: neutral[700],
    tint: tintColorDark,
    tabIconDefault: neutral[500],
    tabIconSelected: tintColorDark,
    primary: primary[400],
    secondary: secondary[400],
  },
};

export default Colors;
