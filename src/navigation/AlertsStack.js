import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AlertsScreen from '../screens/AlertsScreen';
import SelectCurrencyScreen from '../screens/SelectCurrencyScreen';
import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator();

export default function AlertsStack() {
  const theme = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.text,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="AlertsMain" component={AlertsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SelectCurrency" component={SelectCurrencyScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
