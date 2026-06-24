import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MONO } from './src/utils/fonts';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: string | null; stack: string | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { error: null, stack: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('=== RENDER ERROR ===', error.message);
    console.error('=== COMPONENT STACK ===', info.componentStack);
    this.setState({ stack: info.componentStack });
  }
  render() {
    if (this.state.error) {
      return (
        <View style={eb.root}>
          <Text style={eb.title}>RENDER ERROR</Text>
          <Text style={eb.msg}>{this.state.error}</Text>
          <Text style={eb.label}>COMPONENT STACK:</Text>
          <ScrollView style={eb.scroll}>
            <Text style={eb.stack}>{this.state.stack ?? '(no stack)'}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}
const eb = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', padding: 20, paddingTop: 60 },
  title: { color: '#EE3333', fontSize: 16, fontWeight: '800', marginBottom: 8 },
  msg: { color: '#FFF', fontSize: 13, marginBottom: 16 },
  label: { color: '#888', fontSize: 11, marginBottom: 4 },
  scroll: { flex: 1 },
  stack: { color: '#AAA', fontSize: 11, lineHeight: 18 },
});

import { AppProvider, useAppStore, useIsReady } from './src/store/AppContext';
import { getColors } from './src/utils/theme';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import StatsScreen from './src/screens/StatsScreen';
import ManageScreen from './src/screens/ManageScreen';
import MoneyScreen from './src/screens/MoneyScreen';
import AddHabitModal from './src/screens/AddHabitModal';
import ChallengeCompleteScreen from './src/screens/ChallengeCompleteScreen';
import CreateChallengeModal from './src/screens/CreateChallengeModal';
import DevModal from './src/screens/DevModal';
import LogIncomeModal from './src/screens/LogIncomeModal';
import LogWakeModal from './src/screens/LogWakeModal';
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS: Record<string, string> = {
  Today: '◈',
  Money: '▣',
  History: '≡',
  Stats: '▲',
  Manage: '⊙',
};

function MainTabs() {
  const { state } = useAppStore();
  const c = getColors(state.isDark);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: {
          backgroundColor: c.tabBar,
          borderTopColor: c.tabBorder,
          borderTopWidth: 1,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          letterSpacing: 2,
          textTransform: 'uppercase',
          fontFamily: MONO,
        },
        tabBarIcon: ({ color, size }) => (
          <Text style={{ fontSize: size - 4, color }}>{TAB_ICONS[route.name]}</Text>
        ),
      })}
    >
      <Tab.Screen name="Today" component={HomeScreen} />
      <Tab.Screen name="Money" component={MoneyScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Manage" component={ManageScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { state } = useAppStore();
  const isReady = useIsReady();
  const c = getColors(state.isDark);

  if (!isReady) return null;

  if (!state.hasOnboarded) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: c.bg },
      }}
    >
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="AddHabit" component={AddHabitModal} options={{ presentation: 'modal' }} />
      <Stack.Screen name="ChallengeComplete" component={ChallengeCompleteScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="CreateChallenge" component={CreateChallengeModal} options={{ presentation: 'modal' }} />
      <Stack.Screen name="DevTools" component={DevModal} options={{ presentation: 'modal' }} />
      <Stack.Screen name="LogIncome" component={LogIncomeModal} options={{ presentation: 'modal' }} />
      <Stack.Screen name="LogWake" component={LogWakeModal} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;900&family=Space+Mono:wght@400;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppProvider>
          <NavigationContainer>
            <StatusBar style="auto" />
            <RootNavigator />
          </NavigationContainer>
        </AppProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
