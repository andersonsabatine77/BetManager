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
        <ScrollView style={{ flex: 1, backgroundColor: '#0f0f1a', padding: 24 }}>
          <Text style={{ color: '#ff6584', fontSize: 18, fontWeight: 'bold', marginTop: 60 }}>
            ❌ Erro na inicialização
          </Text>
          <Text style={{ color: '#f9fafb', fontSize: 13, marginTop: 16, fontFamily: 'monospace' }}>
            {this.state.error?.toString()}
          </Text>
          <Text style={{ color: '#9ca3af', fontSize: 11, marginTop: 16 }}>
            {this.state.error?.stack}
          </Text>
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
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

function TabBadge({ count, color }) {
  if (!count || count === 0) return null;
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

function AppNavigator() {
  const { colors, isDark } = useTheme();
  const { sugestoes, liveGames } = useApp();

  const sugCount = sugestoes.length;
  const liveCount = liveGames.length;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingBottom: 6,
            paddingTop: 6,
            height: 62,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 12,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            marginTop: 2,
          },
          tabBarIcon: ({ color, size, focused }) => {
            const icons = {
              Home: focused ? 'home' : 'home-outline',
              Sugestões: focused ? 'bulb' : 'bulb-outline',
              'Ao Vivo': focused ? 'radio' : 'radio-outline',
              Histórico: focused ? 'bar-chart' : 'bar-chart-outline',
              Config: focused ? 'settings' : 'settings-outline',
            };
            const iconName = icons[route.name] || 'ellipse';
            return (
              <View>
                <Ionicons name={iconName} size={size} color={color} />
                {route.name === 'Sugestões' && (
                  <TabBadge count={sugCount} color={colors.primary} />
                )}
                {route.name === 'Ao Vivo' && (
                  <TabBadge count={liveCount} color={colors.live} />
                )}
              </View>
            );
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Sugestões" component={SuggestionsScreen} />
        <Tab.Screen name="Ao Vivo" component={LiveScreen} />
        <Tab.Screen name="Histórico" component={HistoryScreen} />
        <Tab.Screen name="Config" component={SettingsScreen} />
      </Tab.Navigator>
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f0f1a' }} />
    );
  }

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
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
});
