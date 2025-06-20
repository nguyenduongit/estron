// theme/index.ts
const palette = {
  // Primary Color from button in image
  primary: '#007AFF', // iOS Blue
  textOnPrimary: '#FFFFFF',

  // Backgrounds (Dark Theme based on image, level 2 is main screen)
  background1: '#2E3A48',
  background2: '#1B2635',
  background3: '#0D1724',
  background4: '#0A121C',

  // Text Colors
  text: '#E1E1E6',
  textSecondary: '#AEAEB2',

  // Semantic Colors
  success: '#34C759',
  danger: '#FF3B30',
  warning: '#FF9500',
  info: '#5AC8FA',

  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  grey: '#8E8E93',
  lightGrey: '#C7C7CC',
  darkGrey: '#3A3A3C',

  // Other
  borderColor: '#384553',
  cardBackground: '#253241',
  transparent: 'transparent',

  // Weekday Colors (Dimmed Color Wheel)
  sunday:   '#cc0000', // Red
  monday:   '#ccae00', // Yellow-olive
  tuesday:  '#3acc00', // Lime green
  wednesday:'#00cc74', // Aqua green
  thursday: '#0074cc', // Sky blue
  friday:   '#3a00cc', // Indigo
  saturday: '#cc00ae', // Pink-purple
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

    borderColor: palette.borderColor,
    cardBackground: palette.cardBackground,
    transparent: palette.transparent,

    // Weekday colors
    sunday: palette.sunday,
    monday: palette.monday,
    tuesday: palette.tuesday,
    wednesday: palette.wednesday,
    thursday: palette.thursday,
    friday: palette.friday,
    saturday: palette.saturday,
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
      'level-3': 14,
      'level-4': 16,
      'level-5': 18,
      'level-6': 20,
      'level-7': 24,
      'level-8': 28,
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
    'level-2': 4,
    'level-3': 6,
    'level-4': 8,
    'level-5': 10,
    'level-6': 12,
    'level-7': 16,
    'level-8': 20,
    'round': 999,
  },

  shadow: {
    sm: {
      shadowColor: palette.white,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2.00,
      elevation: 1,
    },
    md: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 3.22,
      elevation: 3,
    },
    lg: {
      shadowColor: palette.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 5.65,
      elevation: 6,
    }
  }
};

export type Theme = typeof theme;
