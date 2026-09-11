import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { ExpenseProvider } from '../src/context/ExpenseContext';
import { BiometricGuard } from '../src/components/BiometricGuard';

function RootNavigation() {
  const { isDark, colors } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-transaction"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="transactions-list"
          options={{
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ExpenseProvider>
          <BiometricGuard>
            <RootNavigation />
          </BiometricGuard>
        </ExpenseProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
