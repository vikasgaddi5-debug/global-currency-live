import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import SelectCurrencyScreen from '../screens/SelectCurrencyScreen';
import CurrencyDetailScreen from '../screens/CurrencyDetailScreen';
import ConverterScreen from '../screens/ConverterScreen';
import TopMoversScreen from '../screens/TopMoversScreen';
import CurrencyStrengthScreen from '../screens/CurrencyStrengthScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  const theme = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.text,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SelectCurrency" component={SelectCurrencyScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CurrencyDetail" component={CurrencyDetailScreen} options={{ title: 'Details' }} />
      <Stack.Screen name="Converter" component={ConverterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="TopMovers" component={TopMoversScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CurrencyStrength" component={CurrencyStrengthScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favorites' }} />
    </Stack.Navigator>
  );
}
