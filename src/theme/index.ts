// theme/index.ts
const palette = {
  // Primary Color from button in image
  primary: '#007AFF', // iOS Blue
  textOnPrimary: '#FFFFFF',

  // Backgrounds (Dark Theme based on image, level 2 is main screen)
  background1: '#2E3A48', // Lighter dark shade for elevated elements
  background2: '#1B2635', // Main dark background (image general background)
  background3: '#0D1724', // Darker shade
  background4: '#0A121C', // Deepest dark shade

  // Text Colors for Dark Theme
  text: '#E1E1E6', // Light text for readability on dark backgrounds (Subtle off-white)
  textSecondary: '#AEAEB2', // Lighter grey for secondary text (iOS System Gray 2)

  // Semantic Colors (iOS-like for consistency with primary)
  success: '#34C759', // iOS Green
  danger: '#FF3B30', // iOS Red
  warning: '#FF9500', // iOS Orange
  info: '#5AC8FA', // iOS Info Blue

  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  grey: '#8E8E93', // iOS System Gray
  lightGrey: '#C7C7CC', // iOS System Gray 3 (Adjusted from D3D3D3 for better fit)
  darkGrey: '#3A3A3C', // iOS System Gray 6 (For dark theme subtle elements)
  sunday: '#FD475D',
  saturday:'#EC594D',
  workDay:'#339BFF',

  // Other
  borderColor: '#384553', // Border color for elements on dark backgrounds
  cardBackground: '#253241', // Background for cards on dark theme
  transparent: 'transparent',
};

export const theme = {
  colors: {
    primary: palette.primary,
    textOnPrimary: palette.textOnPrimary,

    background1: palette.background1,
    background2: palette.background2,
    background3: palette.background3,
    background4: palette.background4,

    text: palette.text,
    textSecondary: palette.textSecondary,

    success: palette.success,
    danger: palette.danger,
    warning: palette.warning,
    info: palette.info,

    white: palette.white,
    black: palette.black,
    grey: palette.grey,
    lightGrey: palette.lightGrey,
    darkGrey: palette.darkGrey,
    sunday:palette.sunday,
    saturday:palette.saturday,
    workDay:palette.workDay,

    borderColor: palette.borderColor,
    cardBackground: palette.cardBackground,
    transparent: palette.transparent,

    // You can add more specific semantic colors if needed
    // Example: headerBackground: palette.background3, headerTintColor: palette.text
  },
  spacing: {
    'level-1': 4,
    'level-2': 8,
    'level-3': 12,
    'level-4': 16,
    'level-5': 20,
    'level-6': 24,
    'level-7': 32,
    'level-8': 48,
  },

  typography: {
    fontSize: {
      'level-1': 10,
      'level-2': 12,
      'level-3': 14, // Common body text
      'level-4': 16, // Common for inputs, larger body
      'level-5': 18, // Subheadings
      'level-6': 20, // Headings
      'level-7': 24, // Larger headings
      'level-8': 28, // Page titles
    },
    fontWeight: {
      normal: 'normal' as 'normal',
      bold: 'bold' as 'bold',
    },
    fontStyle: {
      normal: 'normal' as 'normal',
      italic: 'italic' as 'italic',
    },
  },

  borderRadius: {
    'level-1': 2,
    'level-2': 4,  // Common for small elements
    'level-3': 6,
    'level-4': 8,  // Common for buttons, cards
    'level-5': 10,
    'level-6': 12, // Larger cards
    'level-7': 16,
    'level-8': 20, // Very rounded elements
    'round': 999, // For circular elements
  },
  shadow: { // Shadows might need adjustment for a dark theme (e.g., using lighter glows or no shadow)
    sm: {
      shadowColor: palette.white, // On a dark theme, shadows are subtle or might be light.
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1, // Reduced opacity for dark themes
      shadowRadius: 2.00,
      elevation: 1,
    },
    md: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12, // Reduced opacity
      shadowRadius: 3.22,
      elevation: 3,
    },
    lg: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15, // Reduced opacity
      shadowRadius: 5.65,
      elevation: 6,
    }
  }
};

export type Theme = typeof theme;