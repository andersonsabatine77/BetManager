import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
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
import { AppProvider, useApp } from './src/context/AppContext';

import HomeScreen from './src/screens/HomeScreen';
import SuggestionsScreen from './src/screens/SuggestionsScreen';
import LiveScreen from './src/screens/LiveScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import PerformanceScreen from './src/screens/PerformanceScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Home',       component: HomeScreen,        active: 'home',      inactive: 'home-outline',      label: 'Home' },
  { name: 'Sugestões',  component: SuggestionsScreen, active: 'bulb',      inactive: 'bulb-outline',      label: 'Sugestões' },
  { name: 'Ao Vivo',    component: LiveScreen,        active: 'radio',     inactive: 'radio-outline',     label: 'Ao Vivo' },
  { name: 'Histórico',  component: HistoryScreen,     active: 'time',      inactive: 'time-outline',      label: 'Histórico' },
  { name: 'Desempenho', component: PerformanceScreen, active: 'bar-chart', inactive: 'bar-chart-outline', label: 'Stats' },
  { name: 'Config',     component: SettingsScreen,    active: 'settings',  inactive: 'settings-outline',  label: 'Config' },
];

function AppNavigator() {
  const { colors, isDark } = useTheme();
  const { sugestoes } = useApp();
  const sugCount = sugestoes ? sugestoes.length : 0;

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
              paddingBottom: 4,
              paddingTop: 4,
              height: 58,
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
              <View>
                <Ionicons name={focused ? tabDef.active : tabDef.inactive} size={size} color={color} />
                {route.name === 'Sugestões' && sugCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.badgeText}>{sugCount > 99 ? '99+' : sugCount}</Text>
                  </View>
                )}
                {route.name === 'Ao Vivo' && (
                  <View style={[styles.liveDot, { backgroundColor: '#ef4444' }]} />
                )}
              </View>
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

const styles = StyleSheet.create({
  badge: { position: 'absolute', top: -4, right: -8, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  liveDot: { position: 'absolute', top: -2, right: -4, width: 6, height: 6, borderRadius: 3 },
});
