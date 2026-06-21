import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#0f172a', padding: 24 }}>
          <Text style={{ color: '#f87171', fontSize: 18, fontWeight: 'bold', marginTop: 60 }}>Erro na inicialização</Text>
          <Text style={{ color: '#f1f5f9', fontSize: 13, marginTop: 16, fontFamily: 'monospace' }}>{this.state.error?.toString()}</Text>
          <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 16 }}>{this.state.error?.stack}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AppProvider } from './src/context/AppContext';

import HomeScreen from './src/screens/HomeScreen';
import TodayMatchesScreen from './src/screens/TodayMatchesScreen';
import NewBetScreen from './src/screens/NewBetScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import PerformanceScreen from './src/screens/PerformanceScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Home',       component: HomeScreen,          active: 'home',           inactive: 'home-outline',          label: 'Home' },
  { name: 'Jogos',      component: TodayMatchesScreen,  active: 'calendar',       inactive: 'calendar-outline',      label: 'Jogos' },
  { name: 'Aposta',     component: NewBetScreen,        active: 'add-circle',     inactive: 'add-circle-outline',    label: 'Aposta' },
  { name: 'Histórico',  component: HistoryScreen,       active: 'time',           inactive: 'time-outline',          label: 'Histórico' },
  { name: 'Stats',      component: PerformanceScreen,   active: 'bar-chart',      inactive: 'bar-chart-outline',     label: 'Stats' },
  { name: 'Config',     component: SettingsScreen,      active: 'settings',       inactive: 'settings-outline',      label: 'Config' },
];

function AppNavigator() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const TAB_HEIGHT = 58;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tab.Navigator
        screenOptions={({ route }) => {
          const tabDef = TABS.find(t => t.name === route.name) || {};
          return {
            headerShown: false,
            tabBarStyle: {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              borderTopWidth: 1,
              paddingBottom: insets.bottom,
              paddingTop: 4,
              height: TAB_HEIGHT + insets.bottom,
              elevation: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
            },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textSecondary,
            tabBarLabelStyle: { fontSize: 9, fontWeight: '600', marginTop: 1 },
            tabBarLabel: tabDef.label || route.name,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? tabDef.active : tabDef.inactive} size={size} color={color} />
            ),
          };
        }}
      >
        {TABS.map(t => <Tab.Screen key={t.name} name={t.name} component={t.component} />)}
      </Tab.Navigator>
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ ...Ionicons.font });
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#0f172a' }} />;

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AppProvider>
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>
            </AppProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({});
