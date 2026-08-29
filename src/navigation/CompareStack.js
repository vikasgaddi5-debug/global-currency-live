import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CompareScreen from '../screens/CompareScreen';
import SelectCurrencyScreen from '../screens/SelectCurrencyScreen';
import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator();

export default function CompareStack() {
  const theme = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.text,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="CompareMain" component={CompareScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SelectCurrency" component={SelectCurrencyScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
