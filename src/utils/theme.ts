import { Platform } from 'react-native';

export interface Colors {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  accent: string;
  accentBg: string;
  text: string;
  muted: string;
  dim: string;
  tabBar: string;
  tabBorder: string;
  inputBg: string;
  isDark: boolean;
  cream: string;
}

const dark: Colors = {
  bg: '#14161B',
  surface: '#1E2028',
  surface2: '#252830',
  border: '#3A3D45',
  accent: '#FF4D26',
  accentBg: '#2A1208',
  text: '#EDEAE3',
  muted: '#8A8D96',
  dim: '#3A3D45',
  tabBar: '#14161B',
  tabBorder: '#1E2028',
  inputBg: '#1E2028',
  isDark: true,
  cream: '#EDEAE3',
};

const light: Colors = {
  bg: '#F2F2F7',
  surface: '#FFFFFF',
  surface2: '#F9F9FB',
  border: 'rgba(60,60,67,0.1)',
  accent: '#FF4D26',
  accentBg: '#FFF0F0',
  text: '#14161B',
  muted: '#6C6C70',
  dim: '#AEAEB2',
  tabBar: 'rgba(249,249,251,0.95)',
  tabBorder: 'rgba(60,60,67,0.15)',
  inputBg: '#F2F2F7',
  isDark: false,
  cream: '#EDEAE3',
};

export function getColors(isDark: boolean): Colors {
  return isDark ? dark : light;
}

/** Drop-shadow style for cards in light mode; borderless in dark mode */
export function cardElevation(isDark: boolean): object {
  if (isDark) return { borderWidth: 1 };
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
    borderWidth: 0,
  };
}

/** For web: adds backdrop-filter blur (frosted glass). No-op on native. */
export function glassStyle(isDark: boolean): object {
  if (Platform.OS !== 'web') return {};
  return {
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    backgroundColor: isDark ? 'rgba(28,28,30,0.85)' : 'rgba(255,255,255,0.88)',
  };
}
