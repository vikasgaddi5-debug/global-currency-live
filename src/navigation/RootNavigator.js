import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeStack from './HomeStack';
import CurrenciesStack from './CurrenciesStack';
import CompareStack from './CompareStack';
import AlertsStack from './AlertsStack';
import SettingsStack from './SettingsStack';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

const ICONS = {
  Home: '🏠',
  Currencies: '💱',
  Compare: '📊',
  Alerts: '🔔',
  Settings: '⚙️',
};

export default function RootNavigator() {
  const theme = useTheme();

  const navTheme = {
    ...(theme.mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.background,
      card: theme.tabBar,
      text: theme.text,
      border: theme.border,
      primary: theme.primary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.tabBarInactive,
          tabBarStyle: { backgroundColor: theme.tabBar, borderTopColor: theme.border },
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>{ICONS[route.name]}</Text>,
          tabBarAccessibilityLabel: route.name,
        })}
      >
        <Tab.Screen name="Home" component={HomeStack} />
        <Tab.Screen name="Currencies" component={CurrenciesStack} />
        <Tab.Screen name="Compare" component={CompareStack} />
        <Tab.Screen name="Alerts" component={AlertsStack} />
        <Tab.Screen name="Settings" component={SettingsStack} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
