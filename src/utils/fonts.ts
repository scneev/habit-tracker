import { Platform } from 'react-native';

// Screen/section titles — bold but not heavy
export const DISPLAY = Platform.select({
  web: "'Outfit', sans-serif",
  default: undefined,  // SF Pro on iOS — clean system font
});

// Labels, body, UI text
export const OUTFIT = Platform.select({
  web: "'Outfit', sans-serif",
  default: undefined,  // SF Pro on iOS
});

// Large display numbers (savings, stats, counts) — ultra-clean
export const NUMS = Platform.select({
  ios: 'HelveticaNeue-UltraLight',
  android: undefined,
  web: "'Helvetica Neue', Arial, sans-serif",
  default: undefined,
});

// Small monospace — timestamps, codes, percentages in data tables
export const MONO = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  web: "'Space Mono', monospace",
  default: undefined,
});
