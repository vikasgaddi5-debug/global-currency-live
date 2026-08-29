import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AllCurrenciesScreen from '../screens/AllCurrenciesScreen';
import CurrencyDetailScreen from '../screens/CurrencyDetailScreen';
import SelectCurrencyScreen from '../screens/SelectCurrencyScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator();

export default function CurrenciesStack() {
  const theme = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.text,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="AllCurrenciesMain" component={AllCurrenciesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CurrencyDetail" component={CurrencyDetailScreen} options={{ title: 'Details' }} />
      <Stack.Screen name="SelectCurrency" component={SelectCurrencyScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favorites' }} />
    </Stack.Navigator>
  );
}
